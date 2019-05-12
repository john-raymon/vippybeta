var express = require("express");
var router = express.Router();
var querystring = require("querystring");
var request = require("request");

// auth middleware
var auth = require("../authMiddleware");
var { hostMiddleware } = require("./host");

// models
var Promoter = require("../../models/Promoter");
var Host = require("../../models/Host");

// config
var config = require("./../../config");

// auth passports
var { promoterPassport } = require("./../../config/passport");

// utils
var createId = require("./../../utils/createId");

// create a promoter
router.post("/", auth.required, hostMiddleware, function(req, res, next) {
  const { vippyHost: host } = req;

  const requiredProps = ["password"];

  let isBodyMissingProperty = false;

  const propErrors = requiredProps.reduce((errors, prop) => {
    if (!req.body[prop]) {
      isBodyMissingProperty = true;
      errors[prop] = { message: `is required` };
    }
    return errors;
  }, {});

  if (isBodyMissingProperty) {
    return next({
      name: "ValidationError",
      errors: propErrors
    });
  }

  Promoter.count({ username: req.body.username })
    .exec()
    .then(function(count) {
      if (count > 0) {
        return next({
          name: "ValidationError",
          errors: {
            username: { message: "is already taken" }
          }
        });
      }
      return count;
    });
  const promoter = new Promoter({
    username: req.body.username || createId(6),
    venue: host,
    venueId: host.venueId,
    fullname: req.body.fullname
  });

  promoter.setPassword(req.body.password);

  return promoter
    .save()
    .then(savedPromoter => {
      res.json({ promoter: savedPromoter.getPromoter() });
    })
    .catch(next);
});

// authenticate a promoter
router.post("/login", function(req, res, next) {
  const requiredProps = ["username", "password", "venueId"];

  let isBodyMissingProperty = false;

  const propErrors = requiredProps.reduce((errors, prop) => {
    if (!req.body[prop]) {
      isBodyMissingProperty = true;
      errors[prop] = { message: `is required` };
    }
    return errors;
  }, {});

  if (isBodyMissingProperty) {
    next({
      name: "ValidationError",
      errors: propErrors
    });
  }

  promoterPassport.authenticate("local", function(err, promoter, data) {
    // handle for errors
    if (err) {
      return next(err);
    }

    if (!promoter) {
      return res.status(422).json({
        success: false,
        error: data
      });
    }

    return res.json({
      promoter: promoter.getAuthPromoter()
    });
  })(req, res, next);
});

// get all promoters for authorized venue host
router.get("/", auth.required, hostMiddleware, function(req, res, next) {
  const { vippyHost: host } = req;

  return Promise.all([
    Promoter.find({ venue: host._id }).exec(),
    Promoter.count({ venue: host._id }).exec()
  ])
    .then(([promoters, promoterCount]) => {
      return res.json({
        promoters: promoters.map(promoter => promoter.getPromoter()),
        promoterCount
      });
    })
    .catch(next);
});

router.patch("/:promoterUsername", auth.required, hostMiddleware, function(
  req,
  res,
  next
) {
  if (!req.params.promoterUsername) {
    return next({
      name: "ValidationError",
      errors: {
        username: { message: "The promoter username is required" }
      }
    });
  }
  const { promoterUsername } = req.params;
  const whitelistedKeys = ["username", "password", "fullname"];
  Promoter.findOne({ username: promoterUsername })
    .then(promoter => {
      if (!promoter) {
        res.status(404).json({
          success: false,
          errors: {
            promoter: {
              message: `Promoter with username ${promoterUsername} does not exist`
            }
          }
        });
      }
      for (let prop in req.body) {
        if (
          whitelistedKeys.includes(prop) &&
          prop !== "username" &&
          prop !== "password"
        ) {
          promoter[prop] = req.body[prop];
        }
      }

      if (req.body.username && promoter.username !== req.body.username) {
        // send security confirmation email below
        // and reset isEmailConfirmed
        // ...
        promoter.username = req.body.username;
      }

      if (req.body.password) {
        // send security email to host
        promoter.setPassword(req.body.password);
      }

      return promoter.save();
    })
    .then(function(promoter) {
      return res.json({ promoter: promoter.getPromoter() });
    })
    .catch(next);
});
module.exports = router;
