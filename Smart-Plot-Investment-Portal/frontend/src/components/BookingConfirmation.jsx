import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader, Building2, Home, Phone, Mail, MapPin, DollarSign } from "lucide-react";
import api from "../utils/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("idle");

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/bookings/${bookingId}/details`);
        setBooking(response.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch booking details");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    const autoSendEmail = async () => {
      if (!booking || booking.status !== "confirmed" || emailStatus !== "idle") {
        return;
      }

      setEmailSending(true);
      setEmailStatus("sending");

      try {
        await api.post(`/api/bookings/${bookingId}/send-confirmation-email`);
        setEmailStatus("sent");
      } catch (err) {
        setEmailStatus("failed");
        setError(err.response?.data?.message || "Failed to send confirmation email");
      } finally {
        setEmailSending(false);
      }
    };

    autoSendEmail();
  }, [booking, bookingId, emailStatus]);

  const handleConfirmBooking = async () => {
    try {
      setEmailSending(true);
      const response = await api.patch(`/api/bookings/${bookingId}/confirm`);
      
      // Send confirmation email
      if (response.data.booking) {
        await api.post(`/api/bookings/${bookingId}/send-confirmation-email`, {
          booking: response.data.booking,
        });
      }

      // Show success and redirect after 3 seconds
      setTimeout(() => {
        navigate("/my-bookings");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm booking");
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <Button onClick={() => navigate("/my-bookings")} className="w-full">
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const remainingAmount = (booking.plot?.price || 0) - booking.tokenAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your plot reservation is complete. Check your email for details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plot Details Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Plot Details</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Plot Number:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.plot?.number || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.plot?.size || "N/A"} Sq.Ft
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Facing:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.plot?.facing || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Road Width:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.plot?.roadWidth || "N/A"} ft
                  </span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{booking.plot?.price?.toLocaleString("en-IN") || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Builder Details Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Builder Info</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 block text-sm">Name</span>
                  <span className="font-semibold text-gray-900">
                    {booking.project?.builder?.name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600 block text-sm">Company</span>
                  <span className="font-semibold text-gray-900">
                    {booking.project?.builder?.companyName || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a
                    href={`mailto:${booking.project?.builder?.email}`}
                    className="text-blue-600 hover:underline truncate"
                  >
                    {booking.project?.builder?.email || "N/A"}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${booking.project?.builder?.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {booking.project?.builder?.phone || "N/A"}
                  </a>
                </div>

                {booking.project?.builder?.address && (
                  <div className="flex items-start gap-2 pt-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <span className="text-sm text-gray-600">
                      {booking.project.builder.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Project Summary Card */}
        <Card className="bg-white shadow-lg mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Project Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600 block text-sm font-medium">Project Name</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {booking.project?.name || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-gray-600 block text-sm font-medium">Location</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {booking.project?.location || "N/A"}
                </span>
              </div>

              {booking.project?.description && (
                <div className="md:col-span-2">
                  <span className="text-gray-600 block text-sm font-medium mb-2">
                    Description
                  </span>
                  <p className="text-gray-700">
                    {booking.project.description.substring(0, 200)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Email Status */}
        {emailStatus === "sending" && (
          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <div className="p-4 text-blue-700">Sending your confirmation email now...</div>
          </Card>
        )}
        {emailStatus === "sent" && (
          <Card className="bg-green-50 border border-green-200 mb-6">
            <div className="p-4 text-green-700">Confirmation email sent successfully to your registered email.</div>
          </Card>
        )}
        {emailStatus === "failed" && (
          <Card className="bg-red-50 border border-red-200 mb-6">
            <div className="p-4 text-red-700">Failed to send confirmation email. Please retry below.</div>
          </Card>
        )}

        {/* Payment Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg mb-8 border-blue-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Amount Paid (Token):</span>
                <span className="font-semibold text-gray-900">
                  ₹{booking.tokenAmount?.toLocaleString("en-IN") || "0"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Total Plot Price:</span>
                <span className="font-semibold text-gray-900">
                  ₹{booking.plot?.price?.toLocaleString("en-IN") || "0"}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold text-gray-900">Remaining Amount:</span>
                <span className="text-2xl font-bold text-red-600">
                  ₹{remainingAmount?.toLocaleString("en-IN") || "0"}
                </span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  ℹ️ <strong>Note:</strong> Please contact the builder to complete the remaining payment and legal formalities.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          {booking.status === "confirmed" ? (
            <Button
              onClick={handleConfirmBooking}
              disabled={emailSending || emailStatus === "sent"}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              {emailSending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending Email...
                </>
              ) : emailStatus === "sent" ? (
                "Email Sent"
              ) : emailStatus === "failed" ? (
                "Retry Email"
              ) : (
                "Send Confirmation Email"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConfirmBooking}
              disabled={emailSending}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              {emailSending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm & Send Email"
              )}
            </Button>
          )}

          <Button
            onClick={() => navigate("/my-bookings")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-8 py-3 rounded-lg font-semibold"
          >
            Back to Bookings
          </Button>
        </div>

        {/* Information Box */}
        <Card className="bg-blue-50 border-l-4 border-blue-600">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📌 What Happens Next?</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✓ A confirmation email has been sent to your registered email address</li>
              <li>✓ The builder will contact you within 24 hours for legal documentation</li>
              <li>✓ You'll need to complete KYC verification and sign the agreement</li>
              <li>✓ Final payment can be made through bank transfer or installments</li>
              <li>✓ Keep your booking ID safe for future reference</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
