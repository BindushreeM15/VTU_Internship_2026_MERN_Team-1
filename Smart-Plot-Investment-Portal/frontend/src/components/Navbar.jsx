import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    LogOut,
    LayoutDashboard,
    Sun,
    Moon,
    Menu,
    X,
    FolderKanban,
    MapPin,
    ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";

// ── JWT helper ────────────────────────────────────────────────────────────────
const parseJwt = (token) => {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        return null;
    }
};

// ── Nav link definitions ──────────────────────────────────────────────────────
const NAV_LINKS = [
    {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        roles: ["builder", "investor"], // all logged-in
    },
    {
        label: "Projects",
        to: "/dashboard/builder/projects",
        icon: FolderKanban,
        roles: ["builder"],
    },
    {
        label: "Plots",
        to: "/dashboard/builder/projects/plots",
        icon: MapPin,
        roles: ["builder"],
    },
];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem("token");

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return (
                localStorage.getItem("theme") ||
                (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            );
        }
        return "light";
    });

    const userRole = token ? parseJwt(token)?.role : null;

    // Filter links by role
    const visibleLinks = token
        ? NAV_LINKS.filter((l) => l.roles.includes(userRole))
        : [];

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Scroll detection
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Theme application
    useEffect(() => {
        const root = document.documentElement;
        theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Lock body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        setMobileOpen(false);
        navigate("/login");
    };

    const isActive = (to) => location.pathname === to;

    return (
        <>
            {/* ── Desktop / Top Navbar ─────────────────────────────────────── */}
            <nav
                className={`nav-anim sticky top-0 z-50 w-full transition-all duration-500 ${
                    scrolled
                        ? "border-b border-border bg-background/80 backdrop-blur-md shadow-sm"
                        : "border-b border-transparent bg-background"
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="spin-slow w-8 h-8 rounded-full border border-primary flex items-center justify-center text-primary text-sm">
                                ◈
                            </div>
                            <span className="nav-logo text-xl font-bold text-primary tracking-widest uppercase">
                                PlotVest
                            </span>
                        </Link>

                        {/* Center live badge — hidden on mobile */}
                        <div className="hidden md:flex items-center gap-1.5 border border-primary/20 bg-primary/5 rounded-full px-3 py-1">
                            <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            <span className="nav-link text-primary text-[10px] tracking-[2px] uppercase font-medium">
                                Live Market
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">

                            {/* Theme Toggle */}
                            <Button
                                onClick={toggleTheme}
                                variant="ghost"
                                size="icon"
                                className="w-9 h-9 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                                aria-label="Toggle theme"
                            >
                                <span key={theme} className="icon-enter">
                                    {theme === "dark" ? (
                                        <Sun className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Moon className="h-4 w-4 text-primary" />
                                    )}
                                </span>
                            </Button>

                            <Separator orientation="vertical" className="h-5" />

                            {token ? (
                                <>
                                    {/* Desktop nav links */}
                                    <div className="hidden md:flex items-center gap-1">
                                        {visibleLinks.map((link) => (
                                            <Button
                                                key={link.to}
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className={`nav-link gap-2 text-xs tracking-wider uppercase ${
                                                    isActive(link.to)
                                                        ? "text-primary bg-primary/10"
                                                        : ""
                                                }`}
                                            >
                                                <Link to={link.to}>
                                                    <link.icon className="h-3.5 w-3.5" />
                                                    {link.label}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>

                                    <Separator orientation="vertical" className="h-5 hidden md:block" />

                                    {/* Logout — desktop */}
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        size="sm"
                                        className="nav-link gap-2 text-xs tracking-wider uppercase border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive hidden md:flex"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>Logout</span>
                                    </Button>

                                    {/* Hamburger — mobile only */}
                                    <Button
                                        onClick={() => setMobileOpen((o) => !o)}
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden w-9 h-9 rounded-full border border-border hover:border-primary/40"
                                        aria-label="Toggle menu"
                                    >
                                        {mobileOpen ? (
                                            <X className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Menu className="h-4 w-4 text-primary" />
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="nav-link text-xs tracking-wider uppercase"
                                    >
                                        <Link to="/login">Sign In</Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="nav-link text-xs tracking-wider uppercase shadow-md shadow-primary/20 font-semibold"
                                    >
                                        <Link to="/signup">Get Started</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Drawer ────────────────────────────────────────────── */}
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
                    mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Slide-in panel */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-72 md:hidden bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                    mobileOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-primary text-xs">
                            ◈
                        </div>
                        <span className="text-sm font-bold text-primary tracking-widest uppercase">
                            PlotVest
                        </span>
                    </div>
                    <Button
                        onClick={() => setMobileOpen(false)}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                {/* Role badge */}
                {userRole && (
                    <div className="px-5 pt-4 pb-2">
                        <span className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 rounded-full px-3 py-1">
                            <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            <span className="text-primary text-[10px] tracking-[2px] uppercase font-medium">
                                {userRole}
                            </span>
                        </span>
                    </div>
                )}

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                    {visibleLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                isActive(link.to)
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <link.icon
                                    className={`h-4 w-4 ${
                                        isActive(link.to) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    }`}
                                />
                                <span className="tracking-wide uppercase text-xs">{link.label}</span>
                            </div>
                            <ChevronRight
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                    isActive(link.to) ? "text-primary translate-x-0.5" : "text-muted-foreground/50"
                                }`}
                            />
                        </Link>
                    ))}
                </nav>

                {/* Drawer footer */}
                <div className="px-3 py-4 border-t border-border space-y-2 shrink-0">
                    <Button
                        onClick={toggleTheme}
                        variant="ghost"
                        className="w-full justify-start gap-3 text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full justify-start gap-3 text-xs tracking-wider uppercase border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </>
    );
}