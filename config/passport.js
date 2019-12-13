var Passport = require("passport").Passport,
  userPassport = new Passport(),
  hostPassport = new Passport(),
  promoterPassport = new Passport();
var LocalStategy = require("passport-local").Strategy;
var mongoose = require("mongoose");
var User = require("../models/User");
var Host = require("../models/Host");
var Promoter = require("../models/Promoter");

userPassport.use(
  new LocalStategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true
    },
    function(req, username, password, done) {
      const { email, phoneNumber } = req.body.emailOrPhoneNumber;
      User.findOne({ [email ? "email" : "phonenumber"]: username })
        .then(function(user) {
          if (!user || !user.validPassword(password)) {
            return done(null, false, {
              error: {
                message: `The ${
                  email ? "email" : "phone number"
                } or password you entered is incorrect. Try again.`
              }
            });
          }
          return done(null, user);
        })
        .catch(done);
    }
  )
);

hostPassport.use(
  new LocalStategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    function(email, password, done) {
      console.log("called@!! here!! inside local !!", email, password);
      Host.findOne({ email: email })
        .then(function(host) {
          if (!host || !host.validPassword(password)) {
            return done(null, false, {
              name: "BadRequest",
              message: "The email or password is invalid"
            });
          }
          return done(null, host);
        })
        .catch(done);
    }
  )
);

promoterPassport.use(
  new LocalStategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true
    },
    function(req, username, password, done) {
      Promoter.findOne({ username: username, venueId: req.body.venueId })
        .then(function(promoter) {
          if (!promoter || !promoter.validPassword(password)) {
            return done(null, false, {
              errors: { "email or password": "is invalid" }
            });
          }
          return done(null, promoter);
        })
        .catch(done);
    }
  )
);

module.exports = {
  hostPassport,
  userPassport,
  promoterPassport
};
