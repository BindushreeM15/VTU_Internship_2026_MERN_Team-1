import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = decodeURIComponent(searchParams.get("token"));

    const handleReset = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            await api.post("/api/auth/reset-password", {
                token,
                newPassword: password,
            });

            setMessage("Password reset successful");
            setError("");

            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to reset password");
            setMessage("");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                </CardHeader>

                <CardContent>
                    {message && (
                        <p className="text-green-600 text-sm mb-2">{message}</p>
                    )}
                    {error && (
                        <p className="text-red-600 text-sm mb-2">{error}</p>
                    )}

                    <form onSubmit={handleReset} className="space-y-4">
                        {/* Password */}
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-500"
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-2.5 text-gray-500"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        <Button className="w-full bg-[#D4552B] hover:bg-[#E06035]">
                            Reset Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
