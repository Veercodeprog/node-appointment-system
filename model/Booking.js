const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema for Booking
const bookingSchema = new Schema({
  serviceName: {
    type: String,
    required: true,
  },
  charges: {
    type: Number,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String, // Assuming createdBy will reference a User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: false,
  },
});

// Create model from schema
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
