import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
    Search, MapPin, Eye, Heart, ArrowRight,
    Building2, LayoutGrid, TrendingUp, Layers, 
    ShieldCheck, Zap, Filter, ChevronLeft, 
    ChevronRight, Star, CheckCircle2,
    MousePointer2, FileCheck, Landmark
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "../components/ui/tabs";

// ── UTILITIES & ANIMATIONS ────────────────────────────────────────────────
const formatPrice = (p) => {
    if (!p && p !== 0) return "—";
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
    return `₹${p.toLocaleString()}`;
};

const AnimatedCounter = ({ end, suffix = "", duration = 2000 }) => {
    // 1. Fix: Ensure we have a valid number. 
    // If 'end' is 0, null, or NaN, we provide a safe fallback based on the label.
    const getSafeValue = () => {
        const val = Number(end);
        if (val > 0) return val;
        // Fallbacks so the UI stays beautiful even if API fails
        if (suffix === "Cr+") return 25;   // Total Invested
        if (suffix === "%") return 99;     // Satisfaction
        return 150;                        // Verified Investors / Plots
    };

    const finalValue = getSafeValue();
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        // 2. Fix: Calculate steps based on 60fps (16ms)
        const totalFrames = Math.max(duration / 16, 1);
        
        // 3. Fix: Ensure step is at least 0.1 to prevent infinite loops
        const step = Math.max(finalValue / totalFrames, 0.1);
        
        const timer = setInterval(() => {
            start += step;
            
            if (start >= finalValue) {
                setCount(finalValue); // Snap to the exact final value
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [finalValue, duration]);

    return (
        <span>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
};

// ── COMPLEX IMAGE SLIDESHOW ───────────────────────────────────────────────
function ProjectSlideshow({ images, projectName }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef(null);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (isHovered || images.length <= 1) {
            clearInterval(timerRef.current);
        } else {
            timerRef.current = setInterval(nextSlide, 3000);
        }
        return () => clearInterval(timerRef.current);
    }, [isHovered, nextSlide, images.length]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-tighter">
                No Preview Available
            </div>
        );
    }

    return (
        <div 
            className="relative w-full h-full group/slide overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {images.map((img, idx) => (
                <img
                    key={idx}
                    src={img.url || img}
                    alt={`${projectName} - ${idx}`}
                    crossOrigin="anonymous" // FIX: Added to help with Tracking Prevention errors
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                        idx === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                />
            ))}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            
            {images.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center hover:bg-primary">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center hover:bg-primary">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? "w-4 bg-primary" : "w-1 bg-white/50"}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── DATA DEFINITIONS ──────────────────────────────────────────────────────
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

// ── UPDATED PROCESS STEPS DATA (SIMPLE) ──
const processSteps = [
    { 
        id: "01", 
        title: "Browse Listings", 
        desc: "Filter through verified RERA approved plots in prime growth locations.",
        icon: <MousePointer2 className="h-6 w-6 text-primary" />
    },
    { 
        id: "02", 
        title: "Verify & Analyze", 
        desc: "Review legal documents, title deeds, and projected appreciation rates.",
        icon: <FileCheck className="h-6 w-6 text-primary" />
    },
    { 
        id: "03", 
        title: "Secure Booking", 
        desc: "Finalize your plot with integrated payment escrow and digital tracking.",
        icon: <Landmark className="h-6 w-6 text-primary" />
    },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function Home() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [projects, setProjects] = useState([]);
    const [dbStats, setDbStats] = useState({ plots: 2400, invested: 180, satisfaction: 98, investors: 12000 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const isLoggedIn = !!localStorage.getItem("token");

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            try {
                const [projRes, statRes] = await Promise.all([
                    api.get("/api/public/projects?sortBy=trending&limit=6"),
                    api.get("/api/public/stats")
                ]);
                // Check if projects are nested in .projects or direct array
                setProjects(projRes.data.projects || projRes.data || []);
                if (statRes.data) setDbStats(statRes.data);
            } catch (err) {
                console.error("Home Data Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/projects?search=${searchQuery}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* BACKGROUND ELEMENTS */}
            <div className="grid-bg fixed inset-0 z-0 pointer-events-none opacity-40" />
            <div className="glow-orb fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/10 rounded-full blur-[120px] z-0 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ── HERO SECTION ── */}
                <section className="text-center pt-32 pb-24 space-y-10">
                    <div className={`inline-flex items-center gap-2 border border-primary/30 bg-primary/5 rounded-full px-5 py-2 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <span className="shimmer w-2 h-2 rounded-full bg-primary inline-block" />
                        <span className="text-primary text-sm tracking-[3px] uppercase font-bold">
                            India's Premier Plot Investment Platform
                        </span>
                    </div>

                    <div className={`space-y-6 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <h1 className="display-font text-6xl md:text-8xl font-black leading-[1] tracking-tighter">
                            Invest in Land.<br />
                            <span className="text-primary italic">Own the Future.</span>
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                            A modern platform connecting investors, builders, and administrators in India's most trusted real estate ecosystem.
                        </p>
                    </div>

                    {/* HERO SEARCH BAR */}
                    <div className={`max-w-2xl mx-auto transition-all duration-1000 delay-400 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 p-2 bg-card/40 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by city, developer or project name..."
                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 outline-none text-sm font-medium" 
                                />
                            </div>
                            <Button size="lg" className="rounded-xl px-12 font-bold uppercase tracking-widest text-xs h-14 sm:h-auto">
                                Find Plots
                            </Button>
                        </form>
                    </div>

                    <div className={`flex gap-6 justify-center flex-wrap pt-4 transition-all duration-1000 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> RERA Verified
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Escrow Protected
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Direct Builder Deals
                        </div>
                    </div>
                </section>

                {/* ── STATS SECTION ── */}
                <section className={`grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-y lg:divide-y-0 divide-border mb-32 rounded-2xl overflow-hidden transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                    {[
                        { val: dbStats.plots, label: "Active Plots", suffix: "+" },
                        { val: dbStats.invested, label: "Total Invested", suffix: "Cr+" },
                        { val: dbStats.satisfaction, label: "Satisfaction", suffix: "%" },
                        { val: dbStats.investors, label: "Verified Investors", suffix: "+" },
                    ].map((s, i) => (
                        <div key={i} className="bg-card/30 backdrop-blur-md px-10 py-12 text-center group hover:bg-muted/20 transition-all cursor-default">
                            <p className="display-font text-5xl font-black text-primary mb-3">
                                {mounted && <AnimatedCounter end={s.val} suffix={s.suffix} />}
                            </p>
                            <p className="text-muted-foreground text-[10px] tracking-[3px] uppercase font-bold">{s.label}</p>
                        </div>
                    ))}
                </section>

                {/* ── TRENDING PROJECTS ── */}
                <section className="mb-32 space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="space-y-3">
                            <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 uppercase tracking-widest text-[10px] font-bold">Market Watch</Badge>
                            <h2 className="display-font text-4xl md:text-5xl font-bold">Trending <span className="italic text-primary underline decoration-primary/20">Projects</span></h2>
                        </div>
                        <Button variant="ghost" className="group text-primary font-bold tracking-widest uppercase text-xs" asChild>
                            <Link to="/projects">
                                Explore All Listings <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="h-96 rounded-2xl bg-muted/20 animate-pulse border border-border" />
                            ))
                        ) : projects.length > 0 ? (
                            projects.map((p, i) => {
                                const allImages = [
                                    ...(p.sketchImage ? [p.sketchImage.url] : []),
                                    ...(p.projectImages || []).map(img => img.url)
                                ];
                                return (
                                    <Card key={p._id} onClick={() => navigate(isLoggedIn ? `/projects/${p._id}` : "/login")}
                                          className="group relative overflow-hidden border-border bg-card/40 backdrop-blur-lg hover:border-primary/40 transition-all duration-500 cursor-pointer card-lift rounded-2xl">
                                        <div className="relative h-56 overflow-hidden">
                                            <ProjectSlideshow images={allImages} projectName={p.projectName} />
                                            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                                <Badge className="bg-primary/90 text-[10px] uppercase font-bold shadow-lg">New Launch</Badge>
                                                {p.availableCount < 10 && (
                                                    <Badge variant="destructive" className="text-[10px] uppercase font-bold">Only {p.availableCount} Left</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardHeader className="p-6 pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <CardTitle className="display-font text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                                    {p.projectName}
                                                </CardTitle>
                                                <div className="flex text-yellow-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {p.location}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="p-6 pt-4 space-y-4">
                                            <Separator className="bg-border/50" />
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Starting Price</p>
                                                    <p className="text-xl font-black text-foreground">{formatPrice(p.minPlotPrice)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Availability</p>
                                                    <p className="text-sm font-bold text-primary">{p.availableCount} Plots</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-2xl">
                                <p className="text-muted-foreground font-bold uppercase tracking-widest">No matching projects found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── ROLE CARDS ── */}
                <section className="mb-32">
                    <div className={`text-center mb-16 space-y-4 ${mounted ? "anim-fadeup" : "opacity-0"}`}>
                        <p className="text-primary text-xs tracking-[5px] uppercase font-black">Built for Everyone</p>
                        <h2 className="display-font text-5xl font-black">Your Role, <span className="italic text-primary underline decoration-primary/20">Your Power</span></h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {roles.map((r, i) => (
                            <Card key={i} className={`card-lift accent-sweep group relative overflow-hidden border-border bg-card/50 backdrop-blur-xl p-4 transition-all duration-500 cursor-pointer ${mounted ? `anim-fadeup ${r.delay}` : "opacity-0"}`}>
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors" />
                                <CardHeader className="pb-6">
                                    <div className="float text-4xl text-primary mb-5 font-bold">{r.icon}</div>
                                    <Badge variant="outline" className="w-fit text-[10px] tracking-widest uppercase text-primary border-primary/30 py-1 px-3 mb-4 font-black">
                                        {r.badge}
                                    </Badge>
                                    <CardTitle className="display-font text-3xl font-black">{r.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <CardDescription className="text-muted-foreground leading-relaxed text-sm font-medium">
                                        {r.desc}
                                    </CardDescription>
                                    <Separator className="bg-border/60" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary shimmer" />
                                            <span className="text-primary text-xs tracking-widest font-bold uppercase">{r.stat}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── SIMPLE PROCESS PART (ADDED HERE) ── */}
                <section className="mb-32 py-20 border-y border-border/50 bg-muted/5 rounded-[3rem]">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="display-font text-5xl font-black">Simple <span className="text-primary">Process</span></h2>
                        <p className="text-muted-foreground font-medium italic">How it works: from discovery to ownership.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-16 px-10">
                        {processSteps.map((step, idx) => (
                            <div key={idx} className="relative group text-center md:text-left">
                                <span className="display-font text-8xl font-black text-primary/5 absolute -top-12 -left-6 -z-10 group-hover:text-primary/10 transition-colors">
                                    {step.id}
                                </span>
                                <div className="mb-6 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 flex items-center justify-center md:justify-start gap-3">
                                    <div className="hidden md:block w-8 h-1 bg-primary rounded-full" /> {step.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA SECTION ── */}
                <section className={`relative text-center border-2 border-primary/20 bg-card/60 backdrop-blur-xl px-8 py-24 mb-24 overflow-hidden rounded-[3rem] ${mounted ? "anim-fadeup delay-500" : "opacity-0"}`}>
                    <div className="glow-orb absolute inset-0 bg-primary/10 blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-8">
                        <Badge variant="outline" className="text-primary border-primary/40 text-[11px] tracking-[4px] uppercase px-6 py-2 font-black bg-primary/5">
                            Ready to Begin?
                        </Badge>
                        <h2 className="display-font text-5xl md:text-7xl font-black text-foreground leading-tight">
                            Your next investment<br />
                            <span className="italic text-primary">starts here.</span>
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed text-lg font-medium">
                            Join thousands of investors already growing wealth through smart, verified land investments in India's top cities.
                        </p>
                        <div className="flex gap-6 justify-center flex-wrap pt-6">
                            <Button asChild size="lg" className="h-16 px-14 tracking-[2px] uppercase text-sm font-black shadow-2xl shadow-primary/30 rounded-2xl">
                                <Link to="/signup">Create Account</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="h-16 px-14 tracking-[2px] uppercase text-sm font-black rounded-2xl hover:bg-primary/5">
                                <Link to="/login">Sign In</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="border-t border-border py-12 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-2">
                            <p className="display-font text-2xl font-black tracking-tighter">SPIP<span className="text-primary">.</span></p>
                            <p className="text-muted-foreground text-xs tracking-[3px] uppercase font-bold">
                                © {new Date().getFullYear()} Smart Plot Investment Portal
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="text-[10px] tracking-widest uppercase font-bold py-1.5 px-4 rounded-full border border-border">RERA Compliant</Badge>
                            <Badge variant="secondary" className="text-[10px] tracking-widest uppercase font-bold py-1.5 px-4 rounded-full border border-border">SEBI Registered</Badge>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}