var mongoose = require("mongoose");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var uniqueValidator = require("mongoose-unique-validator");
var secret = require("../config").secret;

const PromoterSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "is required"]
    },
    permissions: {
      createUpdateEvents: { type: Boolean, default: false },
      createUpdateListings: { type: Boolean, default: false }
    },
    fullname: {
      type: String,
      lowercase: true,
      required: [true, "is required"]
    },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Host" },
    venueId: { type: String },
    salt: String,
    hash: String
  },
  { timestamps: true }
);

PromoterSchema.plugin(uniqueValidator, { type: "mongoose-unique-validator" });

PromoterSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

PromoterSchema.methods.validPassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

PromoterSchema.methods.getPromoter = function() {
  return {
    id: this._id,
    firstname: this.fullname.split(" ")[0],
    type: "promoter",
    username: this.username,
    venueId: this.venueId,
    permissions: this.permissions
  };
};

PromoterSchema.methods.getAuthPromoter = function() {
  return {
    id: this._id,
    firstname: this.fullname.split(" ")[0],
    type: "promoter",
    username: this.username,
    venueId: this.venueId,
    permissions: this.permissions,
    token: this.generateJWT()
  };
};

PromoterSchema.methods.createRandomKey = function() {
  crypto.randomBytes(48, (err, buffer) => {
    this.randomKey = buffer.toString("hex");
  });
  return this.save().then(() => {
    return this.randomKey;
  });
};

PromoterSchema.methods.generateJWT = function() {
  const today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign(
    {
      sub: "promoter",
      id: this._id,
      email: this.username,
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
};

const Promoter = mongoose.model("Promoter", PromoterSchema);

module.exports = Promoter;
