var express = require("express");
var router = express.Router();
var querystring = require("querystring");
var request = require("request");
var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// cloudinary
var cloudinary = require("cloudinary");

// auth middleware
var auth = require("../authMiddleware");
var hostMiddleware = auth.hostOrPromoterMiddleware(true); // true to set doNotAllowPromoter

// cloudinary parser middleware
var imageParser = require("./../../config/multer-cloudinary");

// models
var Host = require("../../models/Host");
var Promoter = require("../../models/Promoter");
var FutureVenue = require("../../models/FutureVenue");

// config
var config = require("./../../config");

// passports
var { hostPassport } = require("./../../config/passport");

// utils
var createId = require("./../../utils/createId");
var isBodyMissingProps = require("./../../utils/isBodyMissingProps");

// get all Venues, authentication not required
router.get("/", auth.optional, auth.setUserOrHost, function(req, res, next) {
  return Promise.all([
    Host.find({ isEmailConfirmed: true }).exec(),
    Host.count({ isEmailConfirmed: true }).exec()
  ])
    .then(([hosts, hostCount]) => {
      return res.json({
        success: true,
        venues: hosts.map(host => host.toProfileJSON()),
        venueCount: hostCount
      });
    })
    .catch(next);
});

// Update hosts
router.patch(
  "/",
  auth.required,
  hostMiddleware,
  imageParser.array("venueImages", 10),
  async function(req, res, next) {
    const whitelistedKeys = [
      "venueName",
      "fullname",
      "phonenumber",
      "legalVenueName"
    ];
    for (let prop in req.body) {
      if (whitelistedKeys.includes(prop)) {
        req.vippyHost[prop] = req.body[prop];
      }
    }

    if (req.body.email && req.vippyHost.email !== req.body.email) {
      // send security confirmation email below
      // and reset isEmailConfirmed
      // ...
      req.vippyHost.email = req.body.email;
      req.vippyHost.isEmailConfirmed = false;
    }

    if (req.body.password) {
      // TODO: send security email to host
      req.vippyHost.setPassword(req.body.password);
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
      let hostImagesObject = {}; // convert Map to JS Object
      for (let [key, value] of req.vippyHost.images) {
        hostImagesObject[key] = value;
      }
      req.vippyHost.images = { ...hostImagesObject, ...newImages };
    }

    if (req.body.imageIdsToRemove) {
      for (let publicId of req.body.imageIdsToRemove) {
        try {
          const destroyImage = await new Promise((resolve, reject) => {
            cloudinary.v2.uploader.destroy(publicId, {}, (error, result) => {
              if (error) reject(error);
              resolve(result);
            });
          });
          if (destroyImage) {
            let hostImagesObject = {}; // convert Map to JS Object
            for (let [key, value] of req.vippyHost.images) {
              hostImagesObject[key] = value;
            }
            req.vippyHost.images = {
              ...hostImagesObject,
              ...newImages,
              [publicId]: undefined
            };
          }
        } catch (err) {
          next(err);
        }
      }
    }

    req.vippyHost
      .save()
      .then(function(host) {
        return res.json({ success: true, venueHost: host._toJSON() });
      })
      .catch(next);
  }
);

// Create a new Host -
// TODO : add admin middleware to prevent Host from being created without permission
router.post(
  "/",
  async function(req, res, next) {
    const requiredProps = [
      "email",
      "venueName",
      "phonenumber",
      "fullname",
      "zipcode",
      "password",
      "accessCode",
      "legalVenueName" // ex: club paradise LLC instead of "Nightclub Paradise"
    ];
    const { hasMissingProps, propErrors } = isBodyMissingProps(
      requiredProps,
      req.body
    );
    if (hasMissingProps) {
      next({
        name: "ValidationError",
        errors: propErrors
      });
    }

    // NOTE: check if accessCode and email can be found as FutureVenue record before continuing
    // since email is required to be unique on a Host we don't need to worry about removing the
    // email record, as after the venue is successfully created for the email, a venue/"host"
    // record can not be created again due to the unique email record
    FutureVenue.count({
      email: req.body.email,
      accessCode: req.body.accessCode
    })
      .exec()
      .then(function(count) {
        console.log("it is!! it is", count);
        if (count === 0) {
          return next({
            name: "ValidationError",
            message: "Please verify your access code is correct and try again."
          });
        }
        return count;
      })
      .then(function() {
        const host = new Host({
          email: req.body.email,
          fullname: req.body.fullname,
          zipcode: req.body.zipcode,
          phonenumber: req.body.phonenumber,
          venueId: createId(5),
          venueName: req.body.venueName,
          legalVenueName: req.body.legalVenueName
        });

        host.setPassword(req.body.password);

        req.vippyHost = host;
        next();
      });
  },
  imageParser.array("venueImages", 10),
  function(req, res, next) {
    const { vippyHost } = req;
    if (req.files) {
      const newImages = req.files.reduce((newImagesObj, file) => {
        newImagesObj[file.public_id] = {
          url: file.url,
          public_id: file.public_id
        };
        return newImagesObj;
      }, {});
      let hostImagesObject = {}; // convert Map to JS Object
      for (let [key, value] of vippyHost.images) {
        hostImagesObject[key] = value;
      }
      vippyHost.images = { ...hostImagesObject, ...newImages };
    }
    vippyHost
      .save()
      .then(function() {
        return res.json({
          success: true,
          venueHost: vippyHost.toAuthJSON()
        });
      })
      .catch(next);
  }
);

// login and authenticate Host
router.post("/login", function(req, res, next) {
  const requiredProps = ["email", "password"];

  const { hasMissingProps, propErrors } = isBodyMissingProps(
    requiredProps,
    req.body
  );
  if (hasMissingProps) {
    next({
      name: "ValidationError",
      errors: propErrors
    });
  }

  hostPassport.authenticate("local", function(err, host, data) {
    if (err) {
      return next(err);
    }

    if (!host) {
      return res.status(422).json(data);
    }

    return Promise.all([
      Promoter.find({ venue: host._id }).exec(),
      Promoter.count({ venue: host._id }).exec()
    ])
      .then(([promoters, promoterCount]) => {
        return res.json({
          success: true,
          venue: {
            ...host.toAuthJSON(),
            promoters: promoters.map(promoter => promoter.getPromoter()),
            promoterCount
          }
        });
      })
      .catch(next);
  })(req, res, next);
});

// stripe
router.post("/stripe/auth", auth.required, hostMiddleware, function(
  req,
  res,
  next
) {
  const hostAuth = req.auth;

  Host.findById(hostAuth.id)
    .then(function(host) {
      if (!host) {
        return next({
          name: "UnauthorizedError",
          message: "You must be an authenticated host"
        });
      }

      if (host.hasStripeId()) {
        return next({
          name: "UnauthorizedError",
          message: "You have already connected this account to a Stripe account"
        });
      }

      host
        .createRandomKey()
        .then(key => {
          let parameters = {
            client_id: config.stripe.client_id,
            response_type: "code",
            state: key,
            scope: "read_write", // defaults to 'read_only' see https://stripe.com/docs/connect/oauth-reference
            // if not explicitly set to read_write then stripe_landing will
            // by default go to login for scope read_only and register for scope read_write.
            // we want register, since we don't expect venue owners/host to
            // initially have Stripe accounts.
            redirect_uri:
              "http://" + config.public_domain + "/api/host/stripe/token",
            "suggested_capabilities[]": "transfers",
            "stripe_user[business_type]": host.type || "individual",
            "stripe_user[business_name]": host.business_name || undefined,
            "stripe_user[first_name]": host.fullname.split(" ")[0] || undefined,
            "stripe_user[last_name]": host.fullname.split(" ")[1] || undefined,
            "stripe_user[email]": host.email || undefined,
            "stripe_user[phone_number]": host.phonenumber || undefined
            // If we're suggesting this account have the `card_payments` capability,
            // we can pass some additional fields to prefill:
            // 'suggested_capabilities[]': 'card_payments',
            // 'stripe_user[street_address]': req.user.address || undefined,
            // 'stripe_user[city]': req.user.city || undefined,
            // 'stripe_user[zip]': req.user.postalCode || undefined,
            // 'stripe_user[state]': req.user.city || undefined,
            // 'stripe_user[country]': req.user.country || undefined
          };

          console.log("Starting Express flow:", parameters);

          res.json({
            success: true,
            redirectUrl:
              config.stripe.authorizeUri +
              "?" +
              querystring.stringify(parameters)
          });
        })
        .catch(next);
    })
    .catch(next);
});

// stripe on-boarding returns venue host back through here
router.get(
  "/stripe/token",
  auth.required, // usually not optional (auth.required), will be required when jwt can be picked up on redirect
  hostMiddleware,
  function(req, res, next) {
    const hostAuth = req.auth;
    Host.findOne({ randomKey: req.query.state, _id: hostAuth.id })
      .then(function(host) {
        if (!host) {
          return next({
            name: "UnauthorizedError",
            message: "You must be an authenticated host"
          });
        }

        if (host.hasStripeId()) {
          return next({
            name: "BadRequestError",
            message: "You have already connected to a Stripe account"
          });
        }

        // make request to Stripe tokenUri with access code received from Stripe to receive Host's stripe_user_id
        request.post(
          config.stripe.tokenUri,
          {
            form: {
              grant_type: "authorization_code",
              client_secret: config.stripe.secret_key,
              code: req.query.code
            },
            json: true
          },
          (err, response, body) => {
            if (err || body.error) {
              // return res.json(response)
              // TODO: decide whether to respond with bad status code and proper body to identify the issue/error/
              // reason why the oAuth didn't process properly or redirect to specific path.
              res.redirect("/onBoardingError"); // front-end page explaining the fallout, telling the user to attempt the process again
            }
            // update the host model with the stripe_user_id
            host.stripeAccountId = body.stripe_user_id;

            host
              .save()
              .then(host => {
                host.createRandomKey().then(key => {
                  return res.json({
                    success: true,
                    host: host._toJSON()
                  }); // when front-end is implemented instead redirect to dashboard, that will handle for stripe being authenticated already
                });
              })
              .catch(next);
          }
        );
      })
      .catch(next);
  }
);

// redirect host to stripe express dashboard
router.get("/stripe/dashboard", auth.required, auth.setUserOrHost, function(
  req,
  res,
  next
) {
  if (req.vippyHost) {
    if (!req.vippyHost.hasStripeId()) {
      // TODO : return proper response that client can understand correctly in order to start on-boarding for Host.
      return res.status(400).json({
        error: "You must have authenticate your account with Stripe",
        redirectTo: "HOST_DASHBOARD"
      });
    }

    stripe.accounts
      .createLoginLink(req.vippyHost.stripeAccountId)
      .then(loginLink => {
        res.redirect(loginLink.url);
      })
      .catch(next);
  }
});

module.exports = {
  router,
  hostMiddleware
};
