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
            error: "This phone number is already linked to a user account",
            errorType: "TAKEN_PHONE_NUMBER"
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
            if (!body.success) {
              return res
                .status(400)
                .json({ success: false, error: body.message });
            }
            return res.json(body);
          }
        );
      });
    })
    .catch(next);
});

module.exports = router;
