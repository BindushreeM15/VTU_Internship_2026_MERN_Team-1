const mongoose = require('mongoose');
const { snipConn } = require('../config/db');

const plotSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved'],
    default: 'available',
  },
  facingDirection: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'],
    required: false,
  },
  roadWidth: {
    type: String, // e.g., "30 feet", "40 feet"
    required: false,
  },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  latitude: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  images: [{
    type: String, // file paths or URLs
  }],
  builderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active',
  },
  plots: [plotSchema],
}, { timestamps: true });

module.exports = snipConn.model('Project', projectSchema);