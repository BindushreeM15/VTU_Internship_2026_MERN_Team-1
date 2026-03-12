import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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

const AnimatedCounter = ({ end, suffix = "", duration = 2000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return (
        <span>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
};

const roles = [
    {
        icon: "◈",
        badge: "Investor",
        title: "Build Wealth",
        desc: "Discover curated plots with verified ROI projections and fractional investment options tailored to your goals.",
        stat: "12.4% avg returns",
        delay: "delay-0",
    },
    {
        icon: "◉",
        badge: "Builder",
        title: "List Projects",
        desc: "Showcase your developments to thousands of verified investors actively seeking high-growth opportunities.",
        stat: "3,200+ investors",
        delay: "delay-150",
    },
    {
        icon: "◎",
        badge: "Admin",
        title: "Full Control",
        desc: "Real-time transaction monitoring, compliance tools, and comprehensive platform-wide analytics dashboard.",
        stat: "99.9% uptime",
        delay: "delay-300",
    },
];

const stats = [
    { value: 2400, suffix: "+", label: "Active Plots" },
    { value: 180, suffix: "Cr+", label: "Total Invested" },
    { value: 98, suffix: "%", label: "Satisfaction" },
    { value: 12000, suffix: "+", label: "Investors" },
];

export default function Home() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setTimeout(() => setMounted(true), 80);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Grid bg */}
            <div className="grid-bg fixed inset-0 z-0 pointer-events-none" />

            {/* Radial glow top */}
            <div className="glow-orb fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-3xl z-0 pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── HERO ── */}
                <section className="text-center pt-24 pb-20 space-y-8">
                    <div
                        className={`inline-flex items-center gap-2 border border-primary/30 bg-primary/5 rounded-full px-4 py-1.5 ${mounted ? "anim-fadeup delay-0" : "opacity-0"}`}
                    >
                        <span className="shimmer w-2 h-2 rounded-full bg-primary inline-block" />
                        <span className="text-primary text-xs tracking-[3px] uppercase font-medium">
                            India's Premier Plot Investment Platform
                        </span>
                    </div>

                    <h1
                        className={`display-font text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight text-foreground ${mounted ? "anim-fadeup delay-100" : "opacity-0"}`}
                    >
                        Invest in Land.
                        <br />
                        <span className="text-primary italic">
                            Own the Future.
                        </span>
                    </h1>

                    <p
                        className={`text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed ${mounted ? "anim-fadeup delay-200" : "opacity-0"}`}
                    >
                        A modern platform connecting investors, builders, and
                        administrators in India's most trusted real estate
                        ecosystem.
                    </p>

                    <div
                        className={`flex gap-4 justify-center flex-wrap ${mounted ? "anim-fadeup delay-300" : "opacity-0"}`}
                    >
                        <Button
                            asChild
                            size="lg"
                            className="px-10 tracking-wider text-sm uppercase font-semibold shadow-lg shadow-primary/20"
                        >
                            <Link to="/signup">Start Investing →</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="px-10 tracking-wider text-sm uppercase font-semibold"
                        >
                            <Link to="/login">View Listings</Link>
                        </Button>
                    </div>
                </section>

                {/* ── STATS ── */}
                <section
                    className={`grid grid-cols-2 md:grid-cols-4 border border-border divide-x divide-y md:divide-y-0 divide-border mb-24 ${mounted ? "anim-fadeup delay-400" : "opacity-0"}`}
                >
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className="bg-card/60 backdrop-blur-sm px-6 py-8 text-center hover:bg-muted/30 transition-colors duration-300"
                        >
                            <p className="display-font text-4xl font-bold text-primary leading-none mb-2">
                                {mounted && (
                                    <AnimatedCounter
                                        end={s.value}
                                        suffix={s.suffix}
                                    />
                                )}
                            </p>
                            <p className="text-muted-foreground text-xs tracking-[2px] uppercase">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </section>

                {/* ── ROLE CARDS ── */}
                <section className="mb-24">
                    <div
                        className={`text-center mb-14 space-y-3 ${mounted ? "anim-fadeup delay-200" : "opacity-0"}`}
                    >
                        <p className="text-primary text-xs tracking-[4px] uppercase font-medium">
                            Built for Everyone
                        </p>
                        <h2 className="display-font text-4xl md:text-5xl font-bold text-foreground">
                            Your Role,{" "}
                            <em className="italic text-primary">Your Power</em>
                        </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {roles.map((r, i) => (
                            <Card
                                key={i}
                                className={`card-lift accent-sweep relative overflow-hidden border-border bg-card/70 backdrop-blur-sm cursor-pointer group ${mounted ? `anim-fadeup ${r.delay}` : "opacity-0"}`}
                            >
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors duration-500" />
                                <CardHeader className="pb-3">
                                    <div className="float text-3xl text-primary mb-3">
                                        {r.icon}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="w-fit text-[10px] tracking-[2px] uppercase text-primary border-primary/40 mb-2"
                                    >
                                        {r.badge}
                                    </Badge>
                                    <CardTitle className="display-font text-2xl font-bold text-foreground">
                                        {r.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <CardDescription className="text-muted-foreground leading-relaxed text-sm">
                                        {r.desc}
                                    </CardDescription>
                                    <Separator className="bg-border/60" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shimmer" />
                                        <span className="text-primary text-xs tracking-wider font-medium">
                                            {r.stat}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── FEATURES STRIP ── */}
                <section
                    className={`mb-24 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border ${mounted ? "anim-fadeup delay-300" : "opacity-0"}`}
                >
                    {[
                        {
                            icon: "⬡",
                            title: "RERA Compliant",
                            sub: "All listings verified",
                        },
                        {
                            icon: "⬢",
                            title: "Secure Escrow",
                            sub: "Protected transactions",
                        },
                        {
                            icon: "⬣",
                            title: "Live Analytics",
                            sub: "Real-time portfolio data",
                        },
                    ].map((f, i) => (
                        <div
                            key={i}
                            className="bg-card/80 hover:bg-muted/40 transition-colors duration-300 px-8 py-8 flex items-center gap-5"
                        >
                            <span className="text-3xl text-primary">
                                {f.icon}
                            </span>
                            <div>
                                <p className="text-foreground text-sm font-semibold tracking-wider uppercase">
                                    {f.title}
                                </p>
                                <p className="text-muted-foreground text-xs mt-0.5">
                                    {f.sub}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* ── CTA ── */}
                <section
                    className={`relative text-center border border-border bg-card/50 backdrop-blur-sm px-8 py-20 mb-20 overflow-hidden ${mounted ? "anim-fadeup delay-400" : "opacity-0"}`}
                >
                    <div className="glow-orb absolute inset-0 bg-primary/5 blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                        <Badge
                            variant="outline"
                            className="text-primary border-primary/40 text-[10px] tracking-[3px] uppercase px-4 py-1.5"
                        >
                            Ready to Begin?
                        </Badge>
                        <h2 className="display-font text-4xl md:text-5xl font-bold text-foreground leading-tight">
                            Your next investment
                            <br />
                            <em className="italic text-primary">
                                starts here.
                            </em>
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Join thousands of investors already growing wealth
                            through smart, verified land investments.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap pt-2">
                            <Button
                                asChild
                                size="lg"
                                className="px-12 tracking-wider uppercase text-sm font-semibold shadow-xl shadow-primary/25"
                            >
                                <Link to="/signup">Create Account</Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="px-12 tracking-wider uppercase text-sm font-semibold"
                            >
                                <Link to="/login">Sign In</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="border-t border-border py-8 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-muted-foreground text-xs tracking-[2px] uppercase">
                        © {new Date().getFullYear()} SPIP — All Rights Reserved
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
                </footer>
            </div>
        </div>
    );
}
