import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "sonner";
import {
  Lock, Calendar, TrendingUp, Loader2, AlertCircle,
  DollarSign,
  BookIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Input } from "../components/ui/input";

const formatPrice = (price) => {
  if (!price && price !== 0) return "—";
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)}Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
  return `₹${Number(price).toLocaleString("en-IN")}`;
};

const STATUS_BADGE = {
  reserved: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  expired: "bg-gray-100 text-gray-800 border-gray-300",
};

function TopUpModal({ booking, plot, onClose, onSuccess }) {
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remainingBalance = Number(plot.price) - Number(booking.tokenAmount);
  const isExpired = new Date() > new Date(booking.expiresAt);

  const handleTopUp = async () => {
    setError("");

    if (!topUpAmount || Number(topUpAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (Number(topUpAmount) > remainingBalance) {
      setError(`Cannot exceed remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/api/bookings/${booking._id}/top-up`, {
        topUpAmount: Number(topUpAmount),
      });
      toast.success(res.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process top-up");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Pay Remaining Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <p className="text-sm text-gray-600">
              Plot {plot.plotNumber} · {plot.projectName}
            </p>
            <p className="text-lg font-bold">{formatPrice(plot.price)}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-semibold">{formatPrice(booking.tokenAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-semibold text-amber-600">
                {formatPrice(remainingBalance)}
              </span>
            </div>
          </div>

          {isExpired && (
            <Alert className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                This booking has expired. Please block the plot again.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium">Top-up Amount (₹)</label>
            <Input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder={`Max: ${remainingBalance.toLocaleString("en-IN")}`}
              max={remainingBalance}
              disabled={loading || isExpired}
              className="mt-1"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          {Number(topUpAmount) === remainingBalance && (
            <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
              ✓ This will confirm your booking and mark the plot as sold.
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={loading || !topUpAmount || isExpired}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" /> Pay {formatPrice(topUpAmount || 0)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topUpModal, setTopUpModal] = useState({ open: false, booking: null, plot: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/bookings/my-bookings");
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">Investor</p>
        <h1 className="display-font text-3xl font-bold text-foreground flex items-center gap-3">
          <BookIcon className="h-8 w-8 text-primary" />
          My Bookings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your plot bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            You haven't booked any plots yet.{" "}
            <button
              onClick={() => navigate("/projects")}
              className="font-medium underline underline-offset-2"
            >
              Browse projects →
            </button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            const plot = booking.plotId;
            const project = booking.projectId;
            const remainingBalance = Number(plot.price) - Number(booking.tokenAmount);
            const isExpired = new Date() > new Date(booking.expiresAt);
            const daysLeft = Math.ceil(
              (new Date(booking.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={booking._id} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">Plot {plot.plotNumber}</h3>
                        <Badge className={STATUS_BADGE[booking.status]}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.projectName} · {project.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(plot.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Price</p>
                    </div>
                  </div>

                  {/* Plot Details */}
                  <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm flex items-center justify-center " >
                    <div>
                      <p className="text-muted-foreground text-xs">Size</p>
                      <p className="font-medium">{plot.sizeSqft} sqft</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Facing</p>
                      <p className="font-medium">{plot.facing}</p>
                    </div>
                
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <p className="font-medium">
                        {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Token Amount Paid:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(booking.tokenAmount)}
                      </span>
                    </div>
                    {booking.status === "reserved" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-semibold text-amber-600">
                            {formatPrice(remainingBalance)}
                          </span>
                        </div>
                        {!isExpired && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              <Calendar className="h-3.5 w-3.5 inline mr-1" />
                              Expires in
                            </span>
                            <span className={`font-semibold ${daysLeft <= 3 ? "text-red-600" : "text-gray-700"}`}>
                              {daysLeft} days
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {booking.status === "reserved" && !isExpired && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setTopUpModal({
                              open: true,
                              booking,
                              plot,
                            })
                          }
                          className="gap-1.5 flex-1"
                        >
                          <DollarSign className="h-4 w-4" />
                          Pay Remaining
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking._id)}
                          className="flex-1"
                        >
                          Cancel Booking
                        </Button>
                      </>
                    )}
                    {isExpired && booking.status === "reserved" && (
                      <Button
                        onClick={() => navigate("/projects")}
                        className="w-full"
                      >
                        Book Another Plot
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Top-up Modal */}
      {topUpModal.open && (
        <TopUpModal
          booking={topUpModal.booking}
          plot={topUpModal.plot}
          onClose={() => setTopUpModal({ open: false, booking: null, plot: null })}
          onSuccess={fetchBookings}
        />
      )}
    </div>
  );
}
