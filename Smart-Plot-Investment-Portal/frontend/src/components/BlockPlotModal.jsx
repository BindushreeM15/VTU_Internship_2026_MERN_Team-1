import { useState } from "react";
import api from "../utils/api"; // ✅ same api utility used across all pages

const BlockPlotModal = ({ plot, onClose, onSuccess }) => {
  const [tokenAmount, setTokenAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleBlock = async () => {
    setError("");
    setSuccess("");

    if (!tokenAmount || Number(tokenAmount) <= 0) {
      setError("Please enter a valid token amount");
      return;
    }

    if (Number(tokenAmount) > Number(plot.price)) {
      setError("Token amount cannot exceed plot price");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/bookings/block", {
        plotId: plot._id,
        tokenAmount: Number(tokenAmount),
      });

      setSuccess(response.data.message + " ✓");

      if (onSuccess) {
        onSuccess(response.data.booking);
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const expiryDate = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Block Plot</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Plot Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Plot Number</span>
            <span className="font-semibold text-gray-800">{plot.plotNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Size</span>
            <span className="font-semibold text-gray-800">{plot.sizeSqft} sqft</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Facing</span>
            <span className="font-semibold text-gray-800">{plot.facing}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Plot Price</span>
            <span className="font-semibold text-green-600">
              ₹{plot.price?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Token Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token Amount (₹)
          </label>
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="Enter token amount"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            min="1"
            max={plot.price}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Token amount must be between ₹1 and ₹{plot.price?.toLocaleString("en-IN")}
          </p>
          {Number(tokenAmount) === Number(plot.price) && (
            <p className="text-xs text-green-700 mt-1">
              ✅ Full payment amount entered. The plot will be confirmed immediately and marked sold.
            </p>
          )}
        </div>

        {/* Expiry Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          ⏳ This plot will be reserved until <strong>{expiryDate}</strong> if full payment is not made. If not confirmed by then, it will be released automatically.
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleBlock}
            disabled={loading || !tokenAmount}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Confirm Block"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BlockPlotModal;