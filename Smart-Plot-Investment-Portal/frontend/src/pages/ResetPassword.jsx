import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/reset-password", {
        email,
        newPassword: password
      });

      setMessage("Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}