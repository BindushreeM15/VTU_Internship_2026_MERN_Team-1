import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return (
                localStorage.getItem("theme") ||
                (window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light")
            );
        }
        return "light";
    });

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((t) => (t === "dark" ? "light" : "dark"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <>
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

                        {/* Center live badge */}
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
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="nav-link gap-2 text-xs tracking-wider uppercase hidden sm:flex"
                                    >
                                        <Link to="/dashboard">
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                            Dashboard
                                        </Link>
                                    </Button>

                                    <Separator
                                        orientation="vertical"
                                        className="h-5 hidden sm:block"
                                    />

                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        size="sm"
                                        className="nav-link gap-2 text-xs tracking-wider uppercase border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">
                                            Logout
                                        </span>
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
        </>
    );
}
