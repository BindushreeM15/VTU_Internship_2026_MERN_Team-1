import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, Sun, Moon, Menu, X,
  FolderKanban, MapPin, Users, Home, BookmarkCheck,
  ChevronDown, ShieldCheck, Building2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const parseJwt = (token) => {
  try {
    const p = token.split(".")[1];
    return p ? JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/"))) : null;
  } catch { return null; }
};

const DROPDOWN_ITEMS = {
  investor: [
    { label: "Home",           to: "/",               icon: Home },
    { label: "Dashboard",      to: "/dashboard",      icon: LayoutDashboard },
    { label: "Saved Projects", to: "/saved-projects", icon: BookmarkCheck },
  ],
  builder: [
    { label: "Home",        to: "/",                           icon: Home },
    { label: "Dashboard",   to: "/dashboard",                  icon: LayoutDashboard },
    { label: "Builder Hub", to: "/dashboard/builder/projects", icon: FolderKanban },
  ],
  admin: [
    { label: "Home",        to: "/",                icon: Home },
    { label: "Dashboard",   to: "/dashboard",       icon: LayoutDashboard },
    { label: "Admin Panel", to: "/dashboard/admin", icon: Users },
  ],
};

const ROLE_COLORS = {
  investor: "bg-blue-500/20 text-blue-200",
  builder:  "bg-amber-500/20 text-amber-200",
  admin:    "bg-purple-500/20 text-purple-200",
};

function Avatar({ name, role }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold select-none ${ROLE_COLORS[role] || "bg-gray-500/20 text-gray-200"}`}>
      {initial}
    </div>
  );
}

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : "light"
  );

  const [tokenData, setTokenData] = useState(() => {
    const t = localStorage.getItem("token");
    return t ? parseJwt(t) : null;
  });

  // Re-read token when localStorage changes (e.g. KYC approved, token refreshed)
  useEffect(() => {
    const syncToken = () => {
      const t = localStorage.getItem("token");
      setTokenData(t ? parseJwt(t) : null);
    };
    window.addEventListener("storage",      syncToken);
    window.addEventListener("tokenUpdated",  syncToken);
    return () => {
      window.removeEventListener("storage",     syncToken);
      window.removeEventListener("tokenUpdated",syncToken);
    };
  }, []);

  const token        = localStorage.getItem("token");
  const payload      = tokenData;
  const role         = payload?.role      || null;
  const name         = payload?.name      || "";
  const kycStatus    = payload?.kycStatus || null;
  const isVerified   = kycStatus === "verified";

  const dropItems = DROPDOWN_ITEMS[role] || [];

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Route change → close menus
  useEffect(() => { setMobileOpen(false); setDropOpen(false); }, [location.pathname]);

  // Scroll detection for subtle border
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Lock scroll on mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <>
      {/* ── Navbar — always dark ───────────────────────────────────────────── */}
      <nav className={`navbar sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-lg" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15" style={{ height: "60px" }}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="navbar-logo text-lg">
                Smart<span className="text-primary">Plot</span>
              </span>
            </Link>

            {/* Center — public links */}
            <div className="hidden lg:flex items-center gap-1">
              <Link to="/" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive("/") && location.pathname === "/" ? "navbar-link-active" : ""}`}>
                Home
              </Link>
              <Link to="/projects" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive("/projects") ? "navbar-link-active" : ""}`}>
                Projects
              </Link>
              {role === "builder" && isVerified && (
                <>
                  <Link to="/dashboard/builder/projects" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/builder/projects") ? "navbar-link-active" : ""}`}>
                    Builder Hub
                  </Link>
                  <Link to="/dashboard/builder/projects/plots" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/builder/projects/plots") ? "navbar-link-active" : ""}`}>
                    Plots
                  </Link>
                </>
              )}
              {role === "builder" && !isVerified && (
                <Link to="/dashboard/builder/kyc" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 ${isActive("/dashboard/builder/kyc") ? "navbar-link-active" : ""}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify Company
                </Link>
              )}
              {role === "admin" && (
                <Link to="/dashboard/admin" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/admin") ? "navbar-link-active" : ""}`}>
                  Admin Panel
                </Link>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[rgb(240_235_230/0.5)] hover:text-[rgb(240_235_230/1)] hover:bg-white/5 transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark"
                  ? <Sun  className="h-4 w-4 text-amber-400" />
                  : <Moon className="h-4 w-4" />}
              </button>

              {token ? (
                <div ref={dropRef} className="relative hidden md:block">
                  <button
                    onClick={() => setDropOpen(o => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
                    style={{ backgroundColor: dropOpen ? "rgba(255,255,255,0.08)" : "" }}
                  >
                    <Avatar name={name} role={role} />
                    <span className="text-sm font-medium max-w-[110px] truncate" style={{ color: "rgb(240 235 230)" }}>
                      {name}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} style={{ color: "rgb(240 235 230 / 0.5)" }} />
                  </button>

                  {dropOpen && (
                    <div className="anim-slide-down absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
                      {/* User header */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
                      </div>
                      <div className="py-1">
                        {dropItems.map((item) => (
                          <Link key={item.to} to={item.to}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                            <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="py-1 border-t" style={{ borderColor: "var(--border)" }}>
                        <button onClick={handleLogout}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 w-full transition-colors">
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium navbar-link transition-colors">
                    Sign In
                  </Link>
                  <Link to="/signup"
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileOpen(o => !o)}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors navbar-link">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 md:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "var(--nav-bg)", borderLeft: "1px solid var(--nav-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-15 border-b" style={{ height: "60px", borderColor: "var(--nav-border)" }}>
          {token ? (
            <div className="flex items-center gap-2">
              <Avatar name={name} role={role} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "rgb(240 235 230)" }}>{name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
          ) : (
            <span className="navbar-logo text-base">SmartPlot</span>
          )}
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 navbar-link">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {token ? dropItems.map((item) => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.to) ? "navbar-link-active bg-primary/10" : "navbar-link"
              }`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          )) : (
            <>
              <Link to="/login"  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium navbar-link">Sign In</Link>
              <Link to="/signup" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary">Get Started</Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--nav-border)" }}>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm navbar-link transition-colors">
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          {token && (
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm transition-colors"
              style={{ color: "rgb(239 68 68)" }}>
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}
