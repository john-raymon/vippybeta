require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var isProduction = process.env.NODE_ENV === "production";
var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "client/build/")));

if (isProduction) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect("mongodb://localhost/vippy_dev", { useNewUrlParser: true });
  mongoose.set("debug", true);
  function logResponseBody(req, res, next) {
    console.log("The request body --->", req.body);
    var oldWrite = res.write,
      oldEnd = res.end;

    var chunks = [];

    res.write = function(chunk) {
      chunks.push(chunk);

      oldWrite.apply(res, arguments);
    };

    res.end = function(chunk) {
      if (chunk) chunks.push(chunk);

      var body = Buffer.concat(chunks).toString("utf8");
      console.log(req.path, body);

      oldEnd.apply(res, arguments);
    };
    next();
  }

  app.use(logResponseBody);
}

require("./models/User");
require("./models/Host");
require("./models/Promoter");
require("./models/Event");
require("./models/Listing");
require("./models/Product");
require("./models/Reservation");

require("./config/passport");

app.use("/api", require("./routes/beta_api"));

app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// forward 404s to error handler (note: this is a middleware, not error handler, hence no `err` argument)
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler - any error not caught before this will be caught here, 404s are also sent here from middleware above
app.use(function(err, req, res, next) {
  console.log("the error in error handler is", err);
  if (isProduction) {
    console.log(err.stack); // print stacktrace
  }
  res.status(err.status || 500);
  res.json({
    success: false,
    name: err.name || "error",
    message:
      err.message ||
      "Sorry for the inconvenience. We're experiencing technical difficulties, please refresh and try again",
    errors: {
      [err.name || "error"]: {
        message: err.message || ""
      }
    }
  });
});

module.exports = app;
