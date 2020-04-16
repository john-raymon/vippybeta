var express = require("express");
var router = express.Router();
var querystring = require("querystring");
var request = require("request");
const differenceInMinutes = require("date-fns/difference_in_minutes");
const isFuture = require("date-fns/is_future");
const isValid = require("date-fns/is_valid");

// cloudinary
var cloudinary = require("cloudinary");

// zipcodes library
var zipcodes = require("zipcodes");

// auth middleware
var auth = require("../authMiddleware");
var hostOrPromoterOnlyMiddleware = auth.hostOrPromoterMiddleware(false);
var hostOnlyMiddleware = auth.hostOrPromoterMiddleware(true);

// cloudinary parser middleware
var imageParser = require("./../../config/multer-cloudinary");

// models
var Event = require("../../models/Event");
var Host = require("../../models/Host");
var Listing = require("../../models/Listing");

// config
var config = require("./../../config");

// utils
var isBodyMissingProps = require("./../../utils/isBodyMissingProps");

router.param("listing", function(req, res, next, listingId) {
  Listing.findById(listingId)
    .populate("host")
    .populate({
      path: "event",
      populate: { path: "host" }
    })
    .exec()
    .then(function(listing) {
      if (!listing) {
        return res.sendStatus(404);
      }
      req.listing = listing;
      next();
    })
    .catch(next);
});

router.patch(
  "/:listing",
  auth.required,
  hostOrPromoterOnlyMiddleware,
  auth.onlyPromoterWithCreateUpdateListingsPermissions,
  imageParser.array("listingImages", 5),
  async function(req, res, next) {
    const { vippyHost, vippyPromoter, listing: vippyListing } = req;
    const { event } = vippyListing;

    // if host , check if event belongs to host/
    // if promoter, check if event belongs to promoter's host
    if (
      (vippyHost && vippyHost.id !== vippyListing.host.id) ||
      (vippyPromoter && vippyPromoter.venue.id !== vippyListing.host.id)
    ) {
      return next({
        name: "UnauthorizedError",
        message:
          "You must the venue host of this event or promoter of the venue host of this event with proper permissions to make changes to this event"
      });
    }

    if (vippyListing.cancelled) {
      return next({
        name: "BadRequestError",
        message:
          "You can no longer update listings for this event as the event has been cancelled."
      });
    }

    // check if event startTime is still in the future
    if (!isFuture(new Date(event.startTime))) {
      return next({
        name: "BadRequestError",
        message:
          "You can no longer update listings for this event as it's start time has passed"
      });
    }

    const whitelistedKeys = ["quantity", "unlimitedQuantity", "description"];
    // changes to date, starttime, endtime, address are not allowed to be updated after creation of event,
    // a deactivation of this event along with a new event with the
    // preferred date, startTime, endtime, address will need to take be created
    // /event/deactivate endpoint will be used for deactivating since sideeffects
    // and constrains will need be to checked, deactivating connected listings, refunding reservations.
    // multiple event cancellations will result in suspension of host , set event cap in env variables

    for (let prop in req.body) {
      if (whitelistedKeys.includes(prop)) {
        vippyListing[prop] = req.body[prop];
      }
    }

    // check if bookingDeadline falls atleast 30 minutes before event.endTime
    if (req.body.bookingDeadline) {
      if (!isValid(new Date(req.body.bookingDeadline))) {
        return next({
          name: "ValidationError",
          message:
            "The booking deadline your entired is not a valid date and time"
        });
      }

      if (!isFuture(new Date(req.body.bookingDeadline))) {
        return next({
          name: "ValidationError",
          message:
            "Your booking deadline is set in the past, it can only be in the future."
        });
      }

      const minutesDif = differenceInMinutes(
        new Date(event.endTime),
        new Date(req.body.bookingDeadline)
      );

      if (minutesDif < 30) {
        return next({
          name: "ValidationError",
          message:
            "The booking deadline must be at least 30 minutes before the event's end time."
        });
      }

      vippyListing.bookingDeadline = req.body.bookingDeadline;
    }

    let newImages = {};
    if (req.files) {
      newImages = req.files.reduce((newImagesObj, file) => {
        newImagesObj[file.public_id] = {
          url: file.url,
          public_id: file.public_id
        };
        return newImagesObj;
      }, {});
      let listingImagesObject = {}; // convert Map to JS Object
      for (let [key, value] of vippyListing.images) {
        listingImagesObject[key] = value;
      }
      vippyListing.images = { ...listingImagesObject, ...newImages };
    }

    if (req.body.imageIdsToRemove) {
      for (let publicId of req.body.imageIdsToRemove) {
        console.log("we have images to remove gghh", publicId);

        try {
          const destroyImage = await new Promise((resolve, reject) => {
            cloudinary.v2.uploader.destroy(publicId, {}, (error, result) => {
              if (error) reject(error);
              resolve(result);
            });
          });
          if (destroyImage) {
            let listingImagesObject = {}; // convert Map to JS Object
            for (let [key, value] of vippyListing.images) {
              listingImagesObject[key] = value;
            }
            vippyListing.images = {
              ...listingImagesObject,
              ...newImages,
              [publicId]: undefined
            };
          }
        } catch (err) {
          next(err);
        }
      }
    }

    vippyListing
      .save()
      .then(listing => {
        return res.json({
          success: true,
          listing: listing.toJSONForHost(vippyHost || vippyPromoter.venue)
        });
      })
      .catch(next);
  }
);

// Create Listings -- only the Venue Host on the Event and Promoter (with proper permissions) of the Venue Host on Event can Create Listings
router.post(
  "/",
  auth.required,
  hostOrPromoterOnlyMiddleware,
  auth.onlyPromoterWithCreateUpdateListingsPermissions,
  function(req, res, next) {
    const { vippyHost: host, vippyPromoter } = req;
    let requiredProps = [
      "eventId",
      "name",
      "guestCount",
      "bookingPrice",
      "unlimitedQuantity",
      "quantity",
      "description"
    ];
    const { hasMissingProps, propErrors } = isBodyMissingProps(
      requiredProps,
      req.body
    );
    if (hasMissingProps) {
      return next({
        name: "ValidationError",
        errors: propErrors
      });
    }
    Event.findById(req.body.eventId)
      .populate("host")
      .populate("currentListings")
      .exec()
      .then(function(event) {
        if (!event) {
          return res.status(404).json({
            success: false,
            errors: {
              event: {
                message: `We could not locate an Event with the id ${
                  req.body.eventId
                }`
              }
            }
          });
        }
        // make sure host or promoter belong to Event
        if (
          (host && host.id !== event.host.id) ||
          (vippyPromoter && vippyPromoter.venue.id !== event.host.id)
        ) {
          return next({
            name: "UnauthorizedError",
            message:
              "You must be the venue host of this event or promoter of the venue host of this event with proper permissions to create listings for this event"
          });
        }

        // check if event startTime is still in the future
        if (!isFuture(new Date(event.startTime))) {
          return next({
            name: "BadRequestError",
            message:
              "You can no longer create a listing for this event as it's start time has passed"
          });
        }

        if (event.cancelled) {
          return next({
            name: "BadRequestError",
            message:
              "You can no longer create listings for this event as it has been cancelled."
          });
        }

        // check if bookingDeadline falls atleast 30 minutes before event.endTime
        if (req.body.bookingDeadline) {
          if (!isValid(new Date(req.body.bookingDeadline))) {
            return next({
              name: "ValidationError",
              message: "The booking deadline is not a valid date and time"
            });
          }
          if (!isFuture(new Date(req.body.bookingDeadline))) {
            return next({
              name: "ValidationError",
              message:
                "Your booking deadline is set in the past, it can only be in the future."
            });
          }

          const minutesDif = differenceInMinutes(
            new Date(event.endTime),
            new Date(req.body.bookingDeadline)
          );

          if (minutesDif < 30) {
            // sure you can book 40 minutes before the event ends 🤷
            return next({
              name: "ValidationError",
              message:
                "The booking deadline must be at least 30 minutes before your event's end time." +
                minutesDif
            });
          }
        }

        // proceed to create listing
        const listing = new Listing({
          venueId: host ? host.venueId : vippyPromoter.venue.venueId,
          name: req.body.name,
          guestCount: req.body.guestCount,
          payAndWait: req.body.hasPayAndWait, // not implemented yet in v1
          // images: req.body.endTime, // use multer and cloudinary to store images
          bookingPrice: req.body.bookingPrice,
          disclaimers:
            req.body.disclaimers +
            " You must be able to receive a verfication code to the phone number on your account at the door in order to redeem your reservation.",
          quantity: req.body.unlimitedQuantity ? 0 : req.body.quantity,
          unlimitedQuantity: req.body.unlimitedQuantity,
          bookingDeadline: req.body.bookingDeadline,
          description: req.body.description
        });

        listing.host = host ? host : vippyPromoter.venue;
        listing.event = event;

        event.currentListings = [...event.currentListings, listing._id];

        return Promise.all([listing.save(), event.save()]);
      })
      .then(function([listing]) {
        req.vippyListing = listing;
        next();
      })
      .catch(next);
  },
  imageParser.array("listingImages", 10),
  function(req, res, next) {
    const { vippyListing: listing } = req;
    if (req.files) {
      const newImages = req.files.reduce((newImagesObj, file) => {
        newImagesObj[file.public_id] = {
          url: file.url,
          public_id: file.public_id
        };
        return newImagesObj;
      }, {});
      let listingImagesObject = {}; // convert Map to JS Object
      for (let [key, value] of vippyListing.images) {
        listingImagesObject[key] = value;
      }
      listing.images = { ...listingImagesObject, ...newImages };
    }
    listing
      .save()
      .then(listing => {
        return res.json({ success: true, listing: listing._toJSON() });
      })
      .catch(next);
  }
);

// get listing by id, no authentication required,
// if authenticated Venue Host, or Promoter, it will return
// listing object with the currentReservations
router.get("/:listing", auth.optional, auth.setUserOrHost, function(
  req,
  res,
  next
) {
  const { auth = { sub: "" }, listing: currentListing } = req;
  console.log("The type of authenticated user is a", auth.sub);
  if (auth.sub === "host") {
    res.json({
      success: true,
      listing: currentListing.toJSONForHost(req.vippyHost)
    });
  }
  res.json({ success: true, listing: currentListing._toJSON() });
});

// get all listings, no authentication required,
// if authenticated Venue Host, or Promoter, it will return
// listing objects with the currentReservations
router.get("/", auth.optional, auth.setUserOrHost, async function(
  req,
  res,
  next
) {
  let query = {}; // TODO: query based on date and other stuff later on
  let limit = 20;
  let offset = 0;
  let nearByZips = [];

  if (typeof req.body.limit !== "undefined") {
    limit = req.body.limit;
  }

  if (typeof req.body.offset !== "undefined") {
    offset = req.body.offset;
  }

  if (req.query.zip || req.query.noZip) {
    // noZip flag allows for no zip to be used
    // while allowing this endpoint to return nearBy events and listings
    try {
      const getNearByZips = function(zip = 32801) {
        // TODO: remove 32801 hardcode
        return zipcodes.radius(zip, 50); // 50 miles by default
      };
      let zipcode = req.query.zip || "";
      if (req.query.noZip) {
        let lat = req.query.lat;
        let lng = req.query.lng;
        // make request to Stripe tokenUri with access code received from Stripe to receive Host's stripe_user_id
        zipcode = await new Promise((resolve, reject) => {
          request.get(
            {
              url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&location_type=ROOFTOP&result_type=street_address&key=${
                process.env.GOOGLE_GEOCODING_API_KEY
              }`,
              method: "GET",
              json: true
            },
            (err, response, body) => {
              if (body.status === "OK") {
                resolve(
                  body.results[0].address_components.find(element => {
                    return element.types.includes("postal_code");
                  }).long_name
                );
              }
              if (err) {
                reject(err);
              }
            }
          );
        });
      }
      nearByZips = [zipcode, ...getNearByZips(zipcode)];
    } catch (err) {
      return next(err);
    }
  }

  if (req.query.byVenue) {
    query = {
      ...query,
      ["venueId"]: req.query.byVenue
    };
  }
  //   make request to google api to reverse geocode the latlng into a precise address (street_address), only the address for which Google has location information accurate down to street address precision (ROOFTOP).
  // 	check response, if status “OK” , proceed to get postal code from response
  // 	use zipcode library to receive array of zipcodes with default mile radius 30 miles (later on allow mile radius to change)
  // 	query events
  // let results = await Event.find({'address.zip' : { '$in': [ '11217', '32825' ] } })

  Promise.all([
    Listing.find(query)
      .limit(+limit)
      .skip(+offset)
      .populate("host")
      .populate({
        path: "event",
        populate: {
          path: "host"
        }
      })
      .exec(),
    Listing.count(query).exec(),
    Event.find({ "address.zip": { $in: nearByZips } })
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
      .populate("host")
      .exec(),
    Event.count({ "address.zip": { $in: nearByZips } })
      .populate("currentListings")
      .exec()
  ])
    .then(([listings, listingCount, nearByEvents, nearByEventsCount]) => {
      if (req.query.zip || req.query.noZip) {
        return res.json({
          success: true,
          nearByEvents: nearByEvents.map(event => {
            console.log("this is an event in the map", event);
            return event.toJSONFor(); // designed to be adjusted to return auth versions of events and listing objects within event
          }),
          nearByEventsCount: nearByEventsCount,
          nearByListings: nearByEvents
            .reduce((accListings, event) => {
              return [...accListings, ...event.currentListings];
            }, [])
            .map(listing => {
              return listing.toJSONForHost();
            }),
          nearByListingsCount: nearByEvents.reduce(
            (accListingsCount, event) => {
              return accListingsCount + event.currentListings.length;
            },
            0
          )
        });
      }
      return res.json({
        success: true,
        listings: listings.map(listing => {
          if (req.auth && req.vippyHost) {
            return listing.toJSONForHost(req.vippyHost);
          }
          return listing.toJSONForHost();
        }),
        listingCount: listingCount
      });
    })
    .catch(next);
});

module.exports = router;
