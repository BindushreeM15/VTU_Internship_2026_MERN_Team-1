const express = require("express");
const router = express.Router();
const {
  blockPlot,
  getMyBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  topUpBooking,
} = require("../controllers/bookingController");

// Import the authenticate middleware - it's exported as exports.authenticate
const { authenticate } = require("../middleware/auth");

// All booking routes require login
router.post("/block", authenticate, blockPlot);
router.get("/my-bookings", authenticate, getMyBookings);
router.get("/:bookingId", authenticate, getBookingById);
router.patch("/:bookingId/cancel", authenticate, cancelBooking);
router.patch("/:bookingId/top-up", authenticate, topUpBooking);
router.patch("/:bookingId/confirm", authenticate, confirmBooking);

module.exports = router;