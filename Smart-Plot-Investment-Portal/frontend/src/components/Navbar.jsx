import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, Sun, Moon, Menu, X, LayoutDashboard, BarChart3,
  FolderKanban, MapPin, Users, Home, BookmarkCheck,
  ChevronDown, ShieldCheck, Building2,
  BookImageIcon, BookIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import MyBookings from "../pages/MyBookings";

const parseJwt = (token) => {
  try {
    const p = token?.split(".")[1];
    return p ? JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/"))) : null;
  } catch { return null; }
};

// Read and parse token from localStorage — single source of truth
const readToken = () => {
  const t = localStorage.getItem("token");
  return { raw: t, payload: parseJwt(t) };
};

const DROPDOWN_ITEMS = {
  investor: [
    { label:"Home",           to:"/",               icon:Home },
    { label:"Dashboard",      to:"/dashboard",      icon:LayoutDashboard },
    { label:"My Bookings",    to:"/my-bookings",    icon:BookIcon },
    { label:"Saved Projects", to:"/saved-projects", icon:BookmarkCheck },
  ],
  builder: [
    { label:"Home",        to:"/",                           icon:Home },
    { label:"Dashboard",   to:"/dashboard",                  icon:LayoutDashboard },
    { label:"Builder Hub", to:"/dashboard/builder/projects", icon:FolderKanban },
  ],
  admin: [
    { label:"Home",        to:"/",                icon:Home },
    { label:"Dashboard",   to:"/dashboard",       icon:LayoutDashboard },
    { label:"Admin Panel", to:"/dashboard/admin", icon:Users },
    { label:"Analytics", to:"/dashboard/admin/analytics", icon:BarChart3 },  ],
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

  // ── Single state for everything token-derived ────────────────────────────
  const [auth, setAuth] = useState(readToken);

  const syncAuth = () => setAuth(readToken());

  useEffect(() => {
    // Cross-tab: token set/removed in another tab
    window.addEventListener("storage",      syncAuth);
    // Same-tab: token updated by KYC polling or login/logout
    window.addEventListener("tokenUpdated", syncAuth);
    return () => {
      window.removeEventListener("storage",      syncAuth);
      window.removeEventListener("tokenUpdated", syncAuth);
    };
  }, []);

  // Re-sync on every route change — catches login redirect
  useEffect(() => {
    syncAuth();
    setMobileOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  const token      = auth.raw;
  const payload    = auth.payload;
  const role       = payload?.role      || null;
  const name       = payload?.name      || "";
  const kycStatus  = payload?.kycStatus || null;
  const isVerified = kycStatus === "verified";
  const isLoggedIn = !!token && !!payload; // both must exist

  // ── Other state ───────────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : "light"
  );

  const dropItems = DROPDOWN_ITEMS[role] || [];

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setDropOpen(false);
    setMobileOpen(false);
    syncAuth(); // immediately clear nav state
    window.dispatchEvent(new Event("tokenUpdated"));
    navigate("/login");
  };

  const isActive = (to, exact = false) => {
  if (exact) {
    return location.pathname === to;
  }
  return location.pathname.startsWith(to);
};

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className={`navbar sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-lg" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height:"60px" }}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="navbar-logo text-lg">Smart<span className="text-primary">Plot</span></span>
            </Link>

            {/* Center nav links */}
            <div className="hidden lg:flex items-center gap-1">
              <Link to="/" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/") ? "navbar-link-active" : ""}`}>
                Home
              </Link>
              <Link to="/projects" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/projects") ? "navbar-link-active" : ""}`}>
                Projects
              </Link>
              {isLoggedIn && role === "builder" && isVerified && (
                <>
                  <Link to="/dashboard/builder/projects" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/builder/projects") ? "navbar-link-active" : ""}`}>
                    Builder Hub
                  </Link>
                  <Link to="/dashboard/builder/projects/plots" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/builder/projects/plots") ? "navbar-link-active" : ""}`}>
                    Plots
                  </Link>
                </>
              )}
              {isLoggedIn && role === "builder" && !isVerified && (
                <Link to="/dashboard/builder/kyc" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 ${isActive("/dashboard/builder/kyc") ? "navbar-link-active" : ""}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify Company
                </Link>
              )}
              {isLoggedIn && role === "admin" && (
                <Link to="/dashboard/admin" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/admin", true) ? "navbar-link-active" : ""}`}>
                  Admin Panel
                </Link>
              )}
              {isLoggedIn && role === "admin" && (
                <Link to="/dashboard/admin/analytics" className={`navbar-link px-3 py-1.5 rounded-md text-sm font-medium ${isActive("/dashboard/admin/analytics") ? "navbar-link-active" : ""}`}>
                  Analytics
                </Link>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all navbar-link"
                aria-label="Toggle theme"
              >
                {theme === "dark"
                  ? <Sun  className="h-4 w-4 text-amber-400" />
                  : <Moon className="h-4 w-4" />}
              </button>

              {/* Logged-in: avatar dropdown */}
              {isLoggedIn ? (
                <div ref={dropRef} className="relative hidden md:block">
                  <button
                    onClick={() => setDropOpen(o => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Avatar name={name} role={role} />
                    <span className="text-sm font-medium max-w-[110px] truncate" style={{ color:"rgb(250 250 249)" }}>
                      {name}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} style={{ color:"rgb(113 113 122)" }} />
                  </button>

                  {dropOpen && (
                    <div className="anim-slide-down absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                      style={{ background:"var(--card)", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)" }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor:"var(--border)", background:"var(--muted)" }}>
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
                      </div>
                      <div className="py-1">
                        {dropItems.map(item => (
                          <Link key={item.to} to={item.to}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
                            <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="py-1 border-t" style={{ borderColor:"var(--border)" }}>
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
                  <Link to="/login" className="px-4 py-1.5 rounded-lg text-sm font-medium navbar-link">Sign In</Link>
                  <Link to="/signup" className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Hamburger */}
              <button onClick={() => setMobileOpen(o => !o)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors navbar-link">
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background:"rgba(0,0,0,0.5)" }}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 lg:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background:"var(--nav-bg)", borderLeft:"1px solid var(--nav-border)" }}
      >
        <div className="flex items-center justify-between px-5 border-b" style={{ height:"60px", borderColor:"var(--nav-border)" }}>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Avatar name={name} role={role} />
              <div>
                <p className="text-sm font-semibold" style={{ color:"rgb(250 250 249)" }}>{name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
          ) : (
            <span className="navbar-logo text-base">SmartPlot</span>
          )}
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 navbar-link">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive("/") ? "navbar-link-active bg-primary/10" : "navbar-link"}`}>
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/projects" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive("/projects") ? "navbar-link-active bg-primary/10" : "navbar-link"}`}>
            <Building2 className="h-4 w-4" /> Projects
          </Link>
          {isLoggedIn && dropItems.map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.to) ? "navbar-link-active bg-primary/10" : "navbar-link"}`}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          {isLoggedIn && role === "builder" && isVerified && (
            <>
              <Link to="/dashboard/builder/projects" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive("/dashboard/builder/projects") ? "navbar-link-active bg-primary/10" : "navbar-link"}`}>
                <FolderKanban className="h-4 w-4" /> Builder Hub
              </Link>
              <Link to="/dashboard/builder/projects/plots" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive("/dashboard/builder/projects/plots") ? "navbar-link-active bg-primary/10" : "navbar-link"}`}>
                <MapPin className="h-4 w-4" /> Plots
              </Link>
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor:"var(--nav-border)" }}>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm navbar-link transition-colors">
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          {isLoggedIn && (
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm transition-colors"
              style={{ color:"rgb(239 68 68)" }}>
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
          {!isLoggedIn && (
            <>
              <Link to="/login"  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium navbar-link">Sign In</Link>
              <Link to="/signup" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
