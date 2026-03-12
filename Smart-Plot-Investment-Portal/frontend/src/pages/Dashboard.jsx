import { useEffect, useState } from "react";
import axios from "axios";
import {
    AlertCircle,
    ShieldCheck,
    User,
    BadgeCheck,
    Wifi,
    TrendingUp,
    Activity,
    Clock,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const roleConfig = {
    investor: {
        icon: "◈",
        label: "Investor",
        color: "text-primary",
        desc: "Browse & invest in plots",
    },
    builder: {
        icon: "◉",
        label: "Builder",
        color: "text-primary",
        desc: "Manage your listings",
    },
    admin: {
        icon: "◎",
        label: "Admin",
        color: "text-primary",
        desc: "Platform administration",
    },
};

const statCards = [
    {
        icon: TrendingUp,
        label: "Portfolio Value",
        value: "₹0",
        sub: "No investments yet",
    },
    { icon: Activity, label: "Active Plots", value: "0", sub: "Plots tracked" },
    { icon: Clock, label: "Member Since", value: "Today", sub: "Account age" },
];

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/api/protected");
                setMessage(res.data.message);
                setUser(res.data.user);
            } catch (err) {
                setError(
                    err.response?.data?.error ||
                        "Failed to load protected data",
                );
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const role = user ? roleConfig[user.role] || roleConfig.investor : null;

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            {/* Header */}
            <div className="anim-fadeup delay-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-primary text-xs tracking-[3px] uppercase font-medium mb-2">
                        Overview
                    </p>
                    <h1 className="display-font text-4xl font-bold text-foreground tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Welcome back — your investment hub awaits.
                    </p>
                </div>
                {role && (
                    <Badge
                        variant="outline"
                        className="text-primary border-primary/30 text-[10px] tracking-[2px] uppercase px-4 py-2 flex items-center gap-2 w-fit"
                    >
                        <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        {role.icon} {role.label}
                    </Badge>
                )}
            </div>

            {error ? (
                <Alert variant="destructive" className="anim-fadeup delay-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <>
                    {/* Stat strip */}
                    <div className="anim-fadeup delay-100 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border">
                        {statCards.map((s, i) => (
                            <div
                                key={i}
                                className="bg-card/70 hover:bg-muted/30 transition-colors duration-300 px-6 py-6 flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center shrink-0">
                                    <s.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="display-font text-2xl font-bold text-foreground leading-none">
                                        {s.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground tracking-wide mt-1">
                                        {s.label}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                        {s.sub}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Profile + Access cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Profile */}
                        {user && (
                            <Card className="anim-fadeup delay-200 border-border bg-card/70 backdrop-blur-sm shadow-sm shadow-primary/5">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary text-lg">
                                            {role?.icon || "◈"}
                                        </div>
                                        <div>
                                            <CardTitle className="display-font text-lg font-bold">
                                                Your Profile
                                            </CardTitle>
                                            <CardDescription>
                                                Account information
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                            <span className="text-xs tracking-wider uppercase">
                                                User ID
                                            </span>
                                        </div>
                                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
                                            {user.id}
                                        </code>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            <span className="text-xs tracking-wider uppercase">
                                                Role
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="text-primary border-primary/30 text-[10px] tracking-[2px] uppercase"
                                        >
                                            {user.role}
                                        </Badge>
                                    </div>
                                    {role && (
                                        <div className="flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-md px-3 py-2 mt-2">
                                            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span className="text-primary text-xs">
                                                {role.desc}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Access status */}
                        <Card className="anim-fadeup delay-300 border-border bg-card/70 backdrop-blur-sm shadow-sm shadow-primary/5">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="display-font text-lg font-bold">
                                            Access Status
                                        </CardTitle>
                                        <CardDescription>
                                            Authentication & connection
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="pt-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs tracking-wider uppercase text-muted-foreground">
                                        Auth Token
                                    </span>
                                    <Badge className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary border-0">
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs tracking-wider uppercase text-muted-foreground">
                                        Session
                                    </span>
                                    <Badge className="text-[10px] tracking-wider uppercase bg-primary/10 text-primary border-0">
                                        Valid
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Wifi className="h-3.5 w-3.5" />
                                        <span className="text-xs tracking-wider uppercase">
                                            Backend URL
                                        </span>
                                    </div>
                                    <code className="text-xs bg-muted px-3 py-2 rounded font-mono text-foreground block truncate">
                                        {import.meta.env.VITE_API_URL ||
                                            "http://localhost:5001"}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-md px-3 py-2">
                                    <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                                    <span className="text-primary text-xs font-medium">
                                        {message ||
                                            "Connected and authenticated"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Footer strip */}
            <div className="anim-fadeup delay-400 border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-muted-foreground text-[10px] tracking-[2px] uppercase">
                    PlotVest Dashboard · Secure Session
                </p>
                <div className="flex items-center gap-3">
                    <Badge
                        variant="secondary"
                        className="text-[10px] tracking-wider uppercase"
                    >
                        RERA Compliant
                    </Badge>
                    <Badge
                        variant="secondary"
                        className="text-[10px] tracking-wider uppercase"
                    >
                        SEBI Registered
                    </Badge>
                </div>
            </div>
        </div>
    );
}
