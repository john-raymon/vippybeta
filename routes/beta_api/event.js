var express = require("express");
var router = express.Router();
var querystring = require("querystring");
var request = require("request");

// auth middleware
var auth = require("../authMiddleware");
var hostOrPromoterMiddleware = auth.hostOrPromoterMiddleware(false);
var hostOnlyMiddleware = auth.hostOrPromoterMiddleware(true);

// models
var Event = require("../../models/Event");
var Host = require("../../models/Host");

// config
var config = require("./../../config");

router.param("event", function(req, res, next, eventId) {
  Event.findById(eventId)
    .populate("host")
    .populate({
      path: "currentListings",
      populate: [
        {
          path: "host"
        },
        {
          path: "event",
          populate: {
            path: "host"
          }
        }
      ]
    })
    .exec()
    .then(function(event) {
      if (!event) {
        return res.status(404).json({
          success: false,
          errors: {
            promoter: {
              message: `An event with the id ${eventId} does not exist`
            }
          }
        });
      }
      req.vippyEvent = event;
      next();
    })
    .catch(next);
});

// Create Events endpoint, only Venue Host and authenticated Promoter's belonging to Venue Host, with proper permissions can Create Events
router.post(
  "/",
  auth.required,
  hostOrPromoterMiddleware,
  auth.onlyPromoterWithCreateUpdateEventsPermissions,
  function(req, res, next) {
    console.log("the req.body at POST event/ endpoint is", req.body);
    const { vippyPromoter, vippyHost: host } = req;

    if (!(host ? host.hasStripeId() : vippyPromoter.venue.hasStripeId())) {
      return res.status(404).json({
        success: false,
        error: "You must connect to Stripe before creating an Event"
      });
    }

    const event = new Event({
      name: req.body.name,
      host: host ? host : vippyPromoter.venue,
      date: req.body.eventDate || req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      address: {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip || req.body.zipcode
      }
    });

    return event
      .save()
      .then(savedEvent => {
        res.json({ success: true, event: savedEvent.toJSONFor() });
      })
      .catch(next);
  }
);

router.patch(
  "/:event",
  auth.required,
  hostOrPromoterMiddleware,
  auth.onlyPromoterWithCreateUpdateEventsPermissions,
  function(req, res, next) {
    const { vippyEvent, vippyHost, vippyPromoter } = req;

    // if host , check if event belongs to host/
    // if promoter, check if event belongs to promoter's host
    if (
      (vippyHost && !vippyHost._id.equals(vippyEvent.host._id)) ||
      (vippyPromoter && vippyPromoter.venueId !== vippyEvent.host.venueId)
    ) {
      return next({
        name: "UnauthorizedError",
        message:
          "You must the venue host of this event or promoter of the venue host of this event with proper permissions to make changes to this event"
      });
    }

    const whitelistedKeys = ["name"];
    // changes to date, starttime, endtime, address are not allowed to be updated after creation of event,
    // a deactivation of this event along with a new event with the
    // preferred date, startTime, endtime, address will need to take be created
    // /event/deactivate endpoint will be used for deactivating since sideeffects
    // and constrains will need be to checked, deactivating connected listings, refunding reservations.
    // multiple event cancellations will result in suspension of host , set event cap in env variables

    for (let prop in req.body) {
      if (whitelistedKeys.includes(prop)) {
        vippyEvent[prop] = req.body[prop];
      }
    }

    vippyEvent.save().then(event => {
      res.json({
        success: true,
        event: event.toJSONFor(vippyHost || vippyPromoter.venue)
      });
    });
  }
);

// get specific event by id, no authentication required,
// if authenticated Venue Host, or Promoter, it will return
// the event object with the event's listing's currentReservations
router.get("/:event", auth.optional, auth.setUserOrHost, function(
  req,
  res,
  next
) {
  const { vippyEvent, vippyHost, vippyUser, vippyPromoter } = req;
  if (
    (vippyHost && vippyHost._id.equals(vippyEvent.host._id)) ||
    (vippyPromoter && vippyPromoter.venueId === vippyEvent.host.venueId)
  ) {
    return res.json({
      success: true,
      event: vippyEvent.toJSONFor(vippyHost || vippyPromoter.venue)
    });
  }
  return res.json({
    success: true,
    event: vippyEvent.toJSONFor(vippyUser)
  });
});

// get all events, no authentication required,
// if authenticated Venue Host, or Promoter, it will return
// event objects with the each event's listing's currentReservations
router.get("/", auth.optional, auth.setUserOrHost, function(req, res, next) {
  let query = {}; // query based on date and other stuff later on
  let limit = 20;
  let offset = 0;

  if (typeof req.body.limit !== "undefined") {
    limit = req.body.limit;
  }

  if (typeof req.body.offset !== "undefined") {
    offset = req.body.offset;
  }

  Promise.all([
    Event.find(query)
      .limit(+limit)
      .skip(+offset)
      .populate("host")
      .populate({
        path: "currentListings",
        populate: [
          {
            path: "host"
          },
          {
            path: "event",
            populate: {
              path: "host"
            }
          }
        ]
      })
      .exec(),
    Event.count(query).exec()
  ])
    .then(([events, eventsCount]) => {
      res.json({
        success: true,
        events: events.map(event => {
          console.log("this is an event in the map", event);
          if (req.vippyHost || req.vippyPromoter) {
            return event.toJSONFor(req.vippyHost || req.vippyPromoter.venue);
          }
          return event.toJSONFor(); // designed to be adjusted to return auth versions of events and listing objects within event
        }),
        eventsCount: eventsCount
      });
    })
    .catch(next);
});

module.exports = router;
