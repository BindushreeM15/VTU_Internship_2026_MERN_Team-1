import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/send-otp", { email });

      setMessage("OTP sent to your email");
      setError("");

      navigate("/verify-otp", { state: { email } });

    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
      setMessage("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}