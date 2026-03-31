import { useState } from "react";
import api from "../utils/api";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/send-reset-link", { email });

      setMessage("Reset link sent to your email");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
      setMessage("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>

        <CardContent>
          {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button className="w-full">Send Reset Link</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}