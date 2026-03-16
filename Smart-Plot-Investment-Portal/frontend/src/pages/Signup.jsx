import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
    User,
    Mail,
    Lock,
    Phone,
    ShieldCheck,
    Loader2,
    ArrowRight,
    EyeOff,
    Eye,
} from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

const roles = [
    {
        value: "investor",
        label: "Investor",
        icon: "◈",
        desc: "Browse & invest in plots",
    },
    {
        value: "builder",
        label: "Builder",
        icon: "◉",
        desc: "List your projects",
    },
    { value: "admin", label: "Admin", icon: "◎", desc: "Manage the platform" },
];

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        role: "investor",
        companyName: "",
    });

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });
    const handleRoleChange = (value) => setForm({ ...form, role: value });

    const validateForm = () => {
        if (!form.name?.trim()) {
            toast.error("Name is required");
            return false;
        }
        if (!form.email?.trim()) {
            toast.error("Email is required");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error("Please enter a valid email");
            return false;
        }
        if (!form.password?.trim()) {
            toast.error("Password is required");
            return false;
        }
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return false;
        }
        if(form.password?.trim() !== form.confirmPassword?.trim()){
            toast.error("Confrim Password should be same as password");
            return false;
        }
        if (!form.phone?.trim()) {
            toast.error("Phone is required");
            return false;
        }
        if (!/^\d{10}$/.test(form.phone)) {
            toast.error("Phone must be 10 digits");
            return false;
        }
        if (form.role === "builder" && !form.companyName?.trim()) {
            toast.error("Company name is required for builders");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const endpoint =
                form.role === "builder"
                    ? "/api/builders/register"
                    : "/api/auth/signup";

            const payload =
                form.role === "builder"
                    ? {
                          name: form.name,
                          email: form.email,
                          password: form.password,
                          phone: form.phone,
                          companyName: form.companyName,
                      }
                    : form;

            await api.post(endpoint, payload);
            toast.success("Account created! Redirecting...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            toast.error(err.response?.data?.error || "Signup failed");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedRole = roles.find((r) => r.value === form.role);

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background">
            {/* Background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md anim-fadeup delay-0">
                {/* Logo mark */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="spin-slow w-12 h-12 rounded-full border border-primary flex items-center justify-center text-primary text-xl">
                        ◈
                    </div>
                    <span className="nav-logo text-2xl font-bold text-primary tracking-widest uppercase">
                        PlotVest
                    </span>
                </div>

                <Card className="border-border bg-card/70 backdrop-blur-sm shadow-xl shadow-primary/5">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="display-font text-2xl font-bold text-foreground">
                                    Create Account
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Join India's premier plot investment
                                    platform
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-primary border-primary/30 text-[10px] tracking-[2px] uppercase hidden sm:flex items-center gap-1"
                            >
                                <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                                Free
                            </Badge>
                        </div>
                    </CardHeader>

                    <Separator className="mb-6" />

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                >
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="pl-10 bg-background/60 border-border focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                >
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="pl-10 bg-background/60 border-border focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                >
                                    Password
                                </Label>

                                <div className="relative">
                                    {/* Left Icon */}
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                                    <Input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        className="pl-10 pr-10 bg-background/60 border-border focus:border-primary transition-colors"
                                    />

                                    {/* Show/Hide Button */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                >
                                   Confirm Password
                                </Label>

                                <div className="relative">
                                    {/* Left Icon */}
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={
                                            showConfirmPassword ? "text" : "password"
                                        }
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm Password"
                                        className="pl-10 pr-10 bg-background/60 border-border focus:border-primary transition-colors"
                                    />

                                    {/* Show/Hide Button */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="phone"
                                    className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                >
                                    Phone Number
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        className="pl-10 bg-background/60 border-border focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {form.role === "builder" && (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="companyName"
                                        className="text-xs tracking-wider uppercase text-muted-foreground font-medium"
                                    >
                                        Company Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            value={form.companyName}
                                            onChange={handleChange}
                                            placeholder="Your company name"
                                            className="pl-10 bg-background/60 border-border focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Role */}
                            <div className="space-y-2">
                                <Label className="text-xs tracking-wider uppercase text-muted-foreground font-medium">
                                    Role
                                </Label>
                                <Select
                                    value={form.role}
                                    onValueChange={handleRoleChange}
                                >
                                    <SelectTrigger className="bg-background/60 border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem
                                                key={r.value}
                                                value={r.value}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-primary">
                                                        {r.icon}
                                                    </span>
                                                    <span>{r.label}</span>
                                                    <span className="text-muted-foreground text-xs hidden sm:inline">
                                                        — {r.desc}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Role hint */}
                                {selectedRole && (
                                    <div className="flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-md px-3 py-2 anim-fadeup delay-0">
                                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="text-primary text-xs">
                                            {selectedRole.desc}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full gap-2 tracking-wider uppercase text-sm font-semibold shadow-lg shadow-primary/20 mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="h-4 w-4" />{" "}
                                        Create Account
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="mt-5 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-primary hover:underline tracking-wide"
                            >
                                Sign In
                            </Link>
                        </p>
                    </CardContent>
                </Card>

                <p className="text-center text-muted-foreground text-[10px] tracking-[2px] uppercase mt-6">
                    RERA Compliant · Secure · Trusted by 12,000+ Investors
                </p>
            </div>
        </div>
    );
}
