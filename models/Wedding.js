const mongoose = require("mongoose");

const weddingSchema = new mongoose.Schema({
  coupleNames: { type: String, required: true },
  artists: [
    {
      name: String,
      image: String, // path to file
    },
  ],
  meals: {
    firstMeal: {
      name: { type: String, required: true },
      image: String,
    },
    secondMeal: {
      name: { type: String, required: true },
      image: String,
    },
    thirdMeal: {
      name: String,
      image: String,
    },
    desert: {
      name: String,
      image: String,
    },
  },
  popularGuests: [String],
  qrCode: String,
});

module.exports = mongoose.model("Wedding", weddingSchema);
