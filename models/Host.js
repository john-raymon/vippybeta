var mongoose = require("mongoose");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var uniqueValidator = require("mongoose-unique-validator");
var secret = require("../config").secret;

// utils
var createId = require("../utils/createId");

const HostSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "is required"],
      match: [/\S+@\S+\.\S+/, "is invalid"]
    },
    images: {
      type: Map,
      of: {
        url: String,
        public_id: { type: String, index: true }
      },
      default: new Map()
    },
    isEmailConfirmed: { type: Boolean, unqiue: true, default: true },
    venueName: { type: String },
    fullname: {
      type: String,
      lowercase: true,
      required: [true, "is required"]
    },
    legalVenueName: {
      type: String,
      lowercase: true,
      required: [true, "is required"]
    },
    zipcode: { type: String, required: [true, "is required"] },
    phonenumber: {
      type: Number,
      unique: true,
      validate: [
        function validator(n) {
          return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(
            n
          );
        },
        "This is not a valid 10 digit number"
      ],
      required: [true, "is required"]
    },
    type: {
      type: String,
      default: "individual",
      enum: ["individual", "company"]
    },
    stripeAccountId: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    salt: String,
    hash: String,
    randomKey: String,
    venueId: {
      type: String,
      unique: true,
      default: createId(5)
    },
    suspended: { type: Boolean, default: false }
  },
  { timestamps: true }
);

HostSchema.plugin(uniqueValidator, { message: "is already taken" });

HostSchema.methods.addProduct = function(id) {
  if (this.products.indexOf(id) === -1) {
    this.products.push(id);
  }
};

HostSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

HostSchema.methods.validPassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

HostSchema.methods.createRandomKey = function() {
  crypto.randomBytes(48, (err, buffer) => {
    this.randomKey = buffer.toString("hex");
  });
  return this.save().then(() => {
    return this.randomKey;
  });
};

HostSchema.methods.generateJWT = function() {
  const today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign(
    {
      sub: "host",
      id: this._id,
      email: this.email,
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
};

HostSchema.methods.hasStripeId = function() {
  if (
    (typeof this.stripeAccountId === "string" &&
      !this.stripeAccountId.trim().length) ||
    this.stripeAccountId === null ||
    !this.stripeAccountId
  ) {
    return false;
  }
  return true;
};

HostSchema.methods.toAuthJSON = function() {
  return {
    username: this.email,
    zipcode: this.zipcode,
    fullname: this.fullname,
    venueName: this.venueName,
    legalVenueName: this.legalVenueName,
    phonenumber: this.phonenumber,
    type: "host",
    token: this.generateJWT(),
    venueId: this.venueId,
    isEmailConfirmed: this.isEmailConfirmed,
    completedStripePaymentFlow: this.hasStripeId(),
    images: this.images
  };
};

// change to getAuthHostWithoutJWT
HostSchema.methods._toJSON = function() {
  return {
    username: this.email,
    zipcode: this.zipcode,
    fullname: this.fullname,
    phonenumber: this.phonenumber,
    type: "host",
    venueName: this.venueName,
    legalVenueName: this.legalVenueName,
    venueId: this.venueId,
    isEmailConfirmed: this.isEmailConfirmed,
    completedPayment: this.hasStripeId(),
    images: this.images
  };
};

HostSchema.methods.toProfileJSON = function() {
  return {
    id: this._id,
    zipcode: this.zipcode,
    firstname: this.fullname.split(" ")[0],
    phonenumber: this.phonenumber,
    type: "host",
    venueName: this.venueName,
    legalVenueName: this.legalVenueName,
    venueId: this.venueId,
    images: this.images
  };
};

const Host = mongoose.model("Host", HostSchema);

module.exports = Host;
