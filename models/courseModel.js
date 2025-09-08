const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [
      true,
      "Course category is required. Please specify the category of the course",
    ],
    trim: true,
  },
  title: {
    type: String,
    required: [
      true,
      "Package name is required. Please provide a name for this package",
    ],
    trim: true,
  },
  details: {
    type: String,
    required: [
      true,
      "Package description is required. Please provide details about this package",
    ],
    trim: true,
  },

  description: {
    type: String,
    required: [
      true,
      "Package description is required. Please provide details about this package",
    ],
    trim: true,
  },
  price: {
    type: String,
    required: [
      true,
      "Package price is required. Please specify the price for this package",
    ],
    trim: true,
  },
  discount: {
    type: String,
    default: "0",
  },

  level: {
    type: String,
    default: "Beginner",
  },
  reviews: [{ reviewerName: String, review: String, rating: Number }],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
