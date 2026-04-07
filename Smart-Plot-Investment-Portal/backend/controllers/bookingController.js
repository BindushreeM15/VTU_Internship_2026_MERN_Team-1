const Booking = require("../models/booking");
const Plot = require("../models/Plot");

// POST /api/bookings/block
const blockPlot = async (req, res) => {
  try {
    const { plotId, tokenAmount } = req.body;
    const userId = req.user.id; // from JWT middleware

    // Validate input
    if (!plotId || !tokenAmount) {
      return res.status(400).json({ message: "plotId and tokenAmount are required" });
    }

    if (tokenAmount <= 0) {
      return res.status(400).json({ message: "Token amount must be greater than 0" });
    }

    // Check if plot exists
    const plot = await Plot.findById(plotId);
    if (!plot) {
      return res.status(404).json({ message: "Plot not found" });
    }

    // Check if plot is available
    if (plot.status !== "available") {
      return res.status(400).json({
        message: `Plot is not available. Current status: ${plot.status}`,
      });
    }

    // Check if this user already has an active booking for any plot in this project
    const existingBooking = await Booking.findOne({
      userId,
      plotId,
      status: "reserved",
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You have already blocked this plot",
      });
    }

    // Set expiry to 30 days from now
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create booking
    const booking = await Booking.create({
      plotId,
      projectId: plot.projectId,
      userId,
      tokenAmount,
      status: "reserved",
      expiresAt,
    });

    // Update plot status to reserved
    plot.status = "reserved";
    await plot.save();

    return res.status(201).json({
      message: "Plot blocked successfully",
      booking: {
        _id: booking._id,
        plotId: booking.plotId,
        projectId: booking.projectId,
        tokenAmount: booking.tokenAmount,
        status: booking.status,
        expiresAt: booking.expiresAt,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error("Block plot error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// GET /api/bookings/my-bookings  (investor sees their own bookings)
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId })
      .populate("plotId", "plotNumber sizeSqft facing price status")
      .populate("projectId", "projectName location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// GET /api/bookings/:bookingId  (single booking details)
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate("plotId", "plotNumber sizeSqft facing price status roadWidth")
      .populate("projectId", "projectName location");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// PATCH /api/bookings/:bookingId/cancel  (investor cancels booking)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "reserved") {
      return res.status(400).json({
        message: `Cannot cancel a booking with status: ${booking.status}`,
      });
    }

    // Revert plot status back to available
    await Plot.findByIdAndUpdate(booking.plotId, { status: "available" });

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// PATCH /api/bookings/:bookingId/confirm  (investor confirms booking - final purchase)
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { finalAmount } = req.body; // Total purchase amount (optional for validation)
    const userId = req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if booking is still in reserved status
    if (booking.status !== "reserved") {
      return res.status(400).json({
        message: `Cannot confirm a booking with status: ${booking.status}. Only reserved bookings can be confirmed.`,
      });
    }

    // Check if booking has expired
    if (new Date() > booking.expiresAt) {
      // Mark as expired
      booking.status = "expired";
      await booking.save();

      // Revert plot status back to available
      await Plot.findByIdAndUpdate(booking.plotId, { status: "available" });

      return res.status(400).json({
        message: "Booking has expired. Please block the plot again.",
      });
    }

    // Update booking status to confirmed
    booking.status = "confirmed";
    await booking.save();

    // Update plot status to sold
    await Plot.findByIdAndUpdate(booking.plotId, { status: "sold" });

    return res.status(200).json({
      message: "Booking confirmed successfully",
      booking: {
        _id: booking._id,
        plotId: booking.plotId,
        projectId: booking.projectId,
        userId: booking.userId,
        tokenAmount: booking.tokenAmount,
        status: booking.status,
        expiresAt: booking.expiresAt,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { blockPlot, getMyBookings, getBookingById, cancelBooking, confirmBooking };