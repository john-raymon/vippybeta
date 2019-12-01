var mongoose = require("mongoose");

var ProductSchema = mongoose.Schema({
  title: String,
  imageUrl: String,
  host: { type: mongoose.Schema.Types.ObjectId, ref: "Host" },
  price: Number,
  description: String,
  quantity: Number,
  unlimitedQuantity: Boolean
});
