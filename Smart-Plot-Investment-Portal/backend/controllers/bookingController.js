const Booking = require("../models/booking");
const Plot = require("../models/Plot");
const { SnipUser: User } = require("../models/User");
const { sendBookingConfirmationEmail } = require("../utils/sendEmail");

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

    const isFullPayment = Number(tokenAmount) === Number(plot.price);
    const expiresAt = isFullPayment
      ? new Date()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const status = isFullPayment ? "confirmed" : "reserved";

    // Create booking
    const booking = await Booking.create({
      plotId,
      projectId: plot.projectId,
      userId,
      tokenAmount,
      status,
      expiresAt,
    });

    // Update plot status
    plot.status = isFullPayment ? "sold" : "reserved";
    await plot.save();

    return res.status(201).json({
      message: isFullPayment ? "Plot confirmed with full payment" : "Plot blocked successfully",
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

// PATCH /api/bookings/:bookingId/top-up  (investor pays additional amount toward a reserved booking)
const topUpBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { topUpAmount } = req.body;
    const userId = req.user.id;

    if (!topUpAmount || Number(topUpAmount) <= 0) {
      return res.status(400).json({ message: "topUpAmount must be greater than 0" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "reserved") {
      return res.status(400).json({
        message: `Top-up is only allowed for reserved bookings. Current status: ${booking.status}`,
      });
    }

    if (new Date() > booking.expiresAt) {
      booking.status = "expired";
      await booking.save();
      await Plot.findByIdAndUpdate(booking.plotId, { status: "available" });
      return res.status(400).json({ message: "Booking has expired. Please block the plot again." });
    }

    const plot = await Plot.findById(booking.plotId);
    if (!plot) {
      return res.status(404).json({ message: "Associated plot not found" });
    }

    const newTotalPaid = Number(booking.tokenAmount) + Number(topUpAmount);
    if (newTotalPaid > Number(plot.price)) {
      return res.status(400).json({ message: "Top-up amount cannot exceed remaining balance." });
    }

    booking.tokenAmount = newTotalPaid;

    if (newTotalPaid === Number(plot.price)) {
      booking.status = "confirmed";
      await Plot.findByIdAndUpdate(booking.plotId, { status: "sold" });
    }

    await booking.save();

    return res.status(200).json({
      message: newTotalPaid === Number(plot.price)
        ? "Booking fully paid and confirmed"
        : "Top-up successful. Booking remains reserved.",
      booking,
    });
  } catch (error) {
    console.error("Top-up booking error:", error);
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

// GET /api/bookings/:bookingId/details  (get full booking details with plot and builder info)
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate({
        path: "plotId",
        select: "plotNumber sizeSqft facing price status roadWidth projectId",
      })
      .populate({
        path: "projectId",
        select: "projectName location bannerImages description amenities",
        populate: {
          path: "builderId",
          select: "name companyName email phone address",
        },
      });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Format response with structured data
    const response = {
      bookingId: booking._id,
      status: booking.status,
      tokenAmount: booking.tokenAmount,
      createdAt: booking.createdAt,
      expiresAt: booking.expiresAt,
      plot: booking.plotId ? {
        id: booking.plotId._id,
        number: booking.plotId.plotNumber,
        size: booking.plotId.sizeSqft,
        facing: booking.plotId.facing,
        price: booking.plotId.price,
        roadWidth: booking.plotId.roadWidth,
        status: booking.plotId.status,
      } : null,
      project: booking.projectId ? {
        id: booking.projectId._id,
        name: booking.projectId.projectName,
        location: booking.projectId.location,
        description: booking.projectId.description,
        amenities: booking.projectId.amenities,
        bannerImages: booking.projectId.bannerImages,
        builder: booking.projectId.builderId ? {
          id: booking.projectId.builderId._id,
          name: booking.projectId.builderId.name,
          companyName: booking.projectId.builderId.companyName,
          email: booking.projectId.builderId.email,
          phone: booking.projectId.builderId.phone,
          address: booking.projectId.builderId.address,
        } : null,
      } : null,
    };

    return res.status(200).json({ booking: response });
  } catch (error) {
    console.error("Get booking details error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// POST /api/bookings/:bookingId/send-confirmation-email  (send confirmation email)
const sendConfirmationEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate({
        path: "plotId",
        select: "plotNumber sizeSqft facing price status roadWidth projectId",
      })
      .populate({
        path: "projectId",
        select: "projectName location bannerImages description amenities",
        populate: {
          path: "builderId",
          select: "name companyName email phone address",
        },
      });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Get investor details
    const investor = await User.findById(userId, "name email");
    if (!investor) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send confirmation email
    const emailData = {
      investorName: investor.name,
      bookingId: booking._id,
      plotNumber: booking.plotId?.plotNumber,
      plotSize: booking.plotId?.sizeSqft,
      plotFacing: booking.plotId?.facing,
      plotPrice: booking.plotId?.price,
      tokenAmount: booking.tokenAmount,
      projectName: booking.projectId?.projectName,
      projectLocation: booking.projectId?.location,
      builderName: booking.projectId?.builderId?.name,
      builderCompany: booking.projectId?.builderId?.companyName,
      builderPhone: booking.projectId?.builderId?.phone,
      builderEmail: booking.projectId?.builderId?.email,
    };

    await sendBookingConfirmationEmail(investor.email, emailData);

    return res.status(200).json({
      message: "Confirmation email sent successfully",
    });
  } catch (error) {
    console.error("Send confirmation email error:", error.message);
    
    // Email service not configured
    if (error.message.includes("not configured")) {
      return res.status(503).json({ 
        message: "Email service is currently unavailable. Please try again later.",
        error: "EMAIL_NOT_CONFIGURED"
      });
    }
    
    // SMTP authentication errors
    if (error.message.includes("Invalid login") || error.message.includes("EAUTH")) {
      return res.status(500).json({ 
        message: "Email authentication failed. Please contact support.",
        error: "SMTP_AUTH_FAILED"
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to send email. Please try again later.",
      error: error.message 
    });
  }
};

module.exports = { blockPlot, getMyBookings, getBookingById, cancelBooking, confirmBooking, topUpBooking, getBookingDetails, sendConfirmationEmail };