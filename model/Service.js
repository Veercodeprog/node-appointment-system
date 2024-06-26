// models/Service.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema for Service
const serviceSchema = new Schema({
  serviceName: {
    type: String,
    required: true,
  },
  charges: {
    type: Number,
    required: true,
  },
  timingSlots: [
    {
      day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        required: true,
      },
      time: {
        type: String,
        required: true,
      },
      available: {
        type: Boolean,
        default: true,
      },
    },
  ],
});

// Create model from schema
const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
