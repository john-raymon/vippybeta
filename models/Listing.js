var mongoose = require("mongoose");

var ListingSchema = mongoose.Schema({
  name: String,
  guestCount: Number,
  host: { type: mongoose.Schema.Types.ObjectId, ref: "Host" },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  currentReservations: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" }
  ],
  description: String,
  payAndWait: Boolean,
  images: {
    type: Map,
    of: {
      url: String,
      public_id: { type: String, index: true }
    },
    default: new Map()
  },
  bookingPrice: Number,
  disclaimers: String,
  quantity: Number,
  unlimitedQuantity: Boolean,
  bookingDeadline: {
    type: Date,
    required: true
  },
  cancelled: { type: Boolean, default: false }
});

ListingSchema.methods.toJSONForHost = function(currentHost) {
  if ((currentHost && !currentHost._id.equals(this.host._id)) || !currentHost) {
    // calling other toJSON due to unauth host, or not host at all
    return this._toJSON();
  }
  // by host we're assuming host of listing, anyone else is a username
  const {
    _id: id,
    name,
    guestCount,
    host,
    event,
    currentReservations,
    payAndWait,
    images,
    bookingPrice,
    disclaimers,
    quantity,
    unlimitedQuantity,
    bookingDeadline,
    cancelled,
    description
  } = this;

  return {
    id,
    name,
    guestCount,
    host: host ? host.toProfileJSON() : host,
    event: event.toNestedJSON(),
    currentReservations, // only venue/host of listing can see currentReservations
    payAndWait,
    images,
    bookingPrice,
    disclaimers,
    quantity,
    unlimitedQuantity,
    bookingDeadline,
    cancelled,
    description
  };
};

ListingSchema.methods._toJSON = function() {
  const {
    _id: id,
    name,
    guestCount,
    host,
    event,
    payAndWait,
    images,
    bookingPrice,
    disclaimers,
    quantity,
    unlimitedQuantity,
    bookingDeadline,
    cancelled,
    description
  } = this;

  return {
    id,
    name,
    guestCount,
    host: host ? host.toProfileJSON() : host,
    event: event.toNestedJSON(),
    payAndWait,
    images,
    bookingPrice,
    disclaimers,
    quantity,
    unlimitedQuantity,
    bookingDeadline,
    cancelled,
    description
  };
};

var Listing = mongoose.model("Listing", ListingSchema);

module.exports = Listing;
