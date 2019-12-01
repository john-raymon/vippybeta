var mongoose = require("mongoose");
var express = require("express");
var router = express.Router();
var querystring = require("querystring");
var request = require("request");
var { parsePhoneNumber, ParseError } = require("libphonenumber-js");

// auth middleware
var auth = require("../authMiddleware");
var { hostMiddleware } = require("./host");

// models
var Event = require("../../models/Event");
var Host = require("../../models/Host");
var User = require("../../models/User");
var Listing = require("../../models/Listing");
var Reservation = require("../../models/Reservation");

const twilioErrorCodes = {
  "60000":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60001":
    "We're experiencing issues on our end, we apologize for the inconvenience.",
  "60003":
    "You have made too many attempts to verify this number, please try again later.",
  "60004": "Your phone number seems to be invalid",
  "60008":
    "We're experiencing issues on our end, we apologize for the inconvenience.",
  "60009":
    "We're experiencing issues on our end, we apologize for the inconvenience.",
  "60013":
    "We apologize but we're unable to verify phone number's with that country code.",
  "60015":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60017":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60018":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60021":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60022":
    "Your verification code is not correct, please try again or request for your code to be resent",
  "60033":
    "There was an error while trying to verify your phone number. Please try again later or contact us at info@vippy.com",
  "60057":
    "We're experiencing issues on our end, we apologize for the inconvenience."
};
// config
var config = require("./../../config");

// code to send to user
router.get("/send-onboard-code", function(req, res, next) {
  if (!req.query.phonenumber) {
    return res.status(400).json({
      success: true,
      error: "A phone number is required"
    });
  }
  const userNum = req.query.phonenumber;
  const userEmail = req.query.email;
  // validate phonenumber
  new Promise((resolve, reject) => {
    try {
      const parsedPhoneNumber = parsePhoneNumber(userNum, "US");
      if (!parsedPhoneNumber.isValid()) {
        return res.status(400).json({
          success: false,
          error: "The phone number is not valid"
        });
      }
      resolve(parsedPhoneNumber);
    } catch (error) {
      if (error instanceof ParseError) {
        return res
          .status(400)
          .json({ error: "The phone number may be invalid" });
      }
      reject(error);
    }
  })
    .then(parsedPhoneNumber => {
      const nationalNumber = parsedPhoneNumber.nationalNumber;
      const countryCallingCode = parsedPhoneNumber.countryCallingCode;
      Promise.all([
        User.count({ email: userEmail }).exec(),
        User.count({ phonenumber: nationalNumber }).exec()
      ]).then(function([emailUserCount, numberUserCount]) {
        if (numberUserCount > 0) {
          return res.status(422).json({
            success: false,
            message: "This phone number is already linked to a user account",
            error: "This phone number is already linked to a user account",
            errorType: "TAKEN_PHONE_NUMBER",
            name: "validationError"
          });
        }
        if (emailUserCount > 0) {
          return res.status(422).json({
            success: false,
            error: "Your email is already linked to an existing account.",
            errorType: "TAKEN_EMAIL"
          });
        }
        // the phonenumber is free to register so continue
        request(
          {
            url:
              "https://api.authy.com/protected/json/phones/verification/start",
            method: "POST",
            headers: {
              "X-Authy-API-Key": process.env.TWILIO_ACCOUNT_SECURITY_API_KEY
            },
            form: {
              via: "sms",
              phone_number: nationalNumber,
              country_code: countryCallingCode
            },
            json: true
          },
          function(err, response, body) {
            if (process.env.NODE_ENV === "development") {
              // if in dev mode then force a successful phone verification
              return res.json({
                success: true
              });
            }
            if (!body.success) {
              return res.status(400).json({
                ...body,
                success: false,
                message:
                  twilioErrorCodes[body.error_code] ||
                  `We're expericing issues while trying to verify your phone number, please try again later.`
              });
            }
            return res.json(body);
          }
        );
      });
    })
    .catch(next);
});

module.exports = {
  router,
  twilioErrorCodes
};
