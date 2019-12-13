const mongoose = require("mongoose");
const isFuture = require("date-fns/is_future");

// Host model
var Host = require("./Host");

// Listing model
var Listing = require("./Listing");

var EventSchema = mongoose.Schema({
  name: { type: String, required: [true, "is required"] },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "Host" },
  currentListings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  date: { type: Date, required: [true, "is required"] },
  startTime: { type: Date, required: [true, "is required"] },
  endTime: { type: Date, required: [true, "is required"] },
  address: {
    street: { type: String, required: [true, "is required"] },
    city: { type: String, required: [true, "is required"] },
    state: { type: String, required: [true, "is required"] },
    zip: { type: String, required: [true, "is required"] }
  },
  images: {
    type: Map,
    of: {
      url: String,
      public_id: { type: String, index: true }
    },
    default: new Map()
  },
  cancelled: {
    type: Boolean,
    default: false
  }
});

EventSchema.methods.toJSONFor = function(user) {
  // user argument is utilized when invoking listing.toJSONForHost method vvv read comment below next to invocation
  const {
    name,
    host,
    currentListings,
    date,
    startTime,
    endTime,
    address,
    images,
    cancelled,
    _id: id
  } = this;

  return {
    id,
    name,
    host: host ? host.toProfileJSON() : host,
    currentListings: currentListings.map(function(listing, index) {
      // toJSONForHost will check if user is not Host and instead return unAuth version of listing object
      return listing.toJSONForHost(user);
    }),
    date,
    startTime,
    endTime,
    address,
    images,
    cancelled
  };
};

EventSchema.methods.toNestedJSON = function() {
  const {
    name,
    host,
    currentListings,
    date,
    startTime,
    endTime,
    address,
    images,
    cancelled,
    _id: id
  } = this;

  return {
    id,
    name,
    host: host ? host.toProfileJSON() : host,
    date,
    startTime,
    endTime,
    address,
    images,
    cancelled
  };
};

EventSchema.methods.isStartTimeInFuture = function() {
  return isFuture(new Date(this.startTime));
};

var Event = mongoose.model("Event", EventSchema);

module.exports = Event;
