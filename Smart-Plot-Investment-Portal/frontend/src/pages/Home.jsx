import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
  Search, MapPin, Eye, Heart, ArrowRight,
  Building2, LayoutGrid, TrendingUp, Layers, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge }  from "../components/ui/badge";

const parseJwt = (token) => {
  try { const p = token.split(".")[1]; return p ? JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/"))) : null; }
  catch { return null; }
};
const formatPrice = (p) => {
  if (!p && p !== 0) return "—";
  if (p >= 10000000) return `₹${(p/10000000).toFixed(1)}Cr`;
  if (p >= 100000)   return `₹${(p/100000).toFixed(1)}L`;
  if (p >= 1000)     return `₹${(p/1000).toFixed(0)}K`;
  return `₹${p}`;
};

// ── Image Slideshow ───────────────────────────────────────────────────────────
function Slideshow({ images, companyName }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  const start = useCallback(() => {
    if (images.length <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i+1) % images.length), 3500);
  }, [images.length]);

  useEffect(() => { start(); return () => clearInterval(timer.current); }, [start]);

  const go = (dir, e) => {
    e.stopPropagation();
    clearInterval(timer.current);
    setIdx(i => (i + dir + images.length) % images.length);
    start();
  };

  // Fallback initials
  if (!images.length) {
    const initials = companyName?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "SP";
    return (
      <div className="w-full h-full flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, var(--muted)), var(--muted))" }}>
        <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold mb-2"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
          {initials}
        </div>
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">{companyName}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/slide">
      {images.map((src, i) => (
        <img key={i} src={src} alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i===idx?"opacity-100":"opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button onClick={e=>go(-1,e)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity">
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button onClick={e=>go(1,e)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_,i) => (
              <button key={i} onClick={e=>{e.stopPropagation();clearInterval(timer.current);setIdx(i);start();}}
                className={`rounded-full transition-all duration-300 ${i===idx?"w-4 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, isLoggedIn }) {
  const navigate = useNavigate();

  const allImages = [
    ...(project.sketchImage ? [project.sketchImage.url] : []),
    ...(project.projectImages || []).map(i=>i.url),
    ...(project.plotImages || []).map(i=>i.url),
  ];

  const handleClick = () => {
    if (!isLoggedIn) { navigate("/login", { state: { from: `/projects/${project._id}` } }); return; }
    navigate(`/projects/${project._id}`);
  };

  return (
    <div onClick={handleClick}
      className="card-sp cursor-pointer flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted shrink-0">
        <Slideshow images={allImages} companyName={project.builder?.companyName} />
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ background:"var(--primary)", color:"var(--primary-foreground)" }}>
            Active
          </span>
          {(project.availableCount || 0) > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-sm">
              {project.availableCount} plots
            </span>
          )}
        </div>
        {/* Engagement */}
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          <span className="flex items-center gap-1 bg-black/50 text-white text-[10px] rounded-md px-1.5 py-0.5 backdrop-blur-sm">
            <Eye className="h-2.5 w-2.5" />{project.viewCount||0}
          </span>
          <span className="flex items-center gap-1 bg-black/50 text-white text-[10px] rounded-md px-1.5 py-0.5 backdrop-blur-sm">
            <Heart className="h-2.5 w-2.5" />{project.interestCount||0}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 space-y-2.5">
        <div>
          <h3 className="display-font font-bold text-foreground group-hover:text-primary transition-colors leading-tight"
            style={{ fontSize: "1.05rem" }}>
            {project.projectName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Building2 className="h-3 w-3 shrink-0" />
            {project.builder?.companyName || "—"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0 text-primary" />
          <span className="truncate">{project.location}</span>
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price Range</p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(project.minPlotPrice)}
              {project.maxPlotPrice !== project.minPlotPrice &&
                <span className="text-muted-foreground font-normal"> – {formatPrice(project.maxPlotPrice)}</span>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Plots</p>
            <p className="text-sm font-bold text-foreground">{project.plotCount||0}</p>
          </div>
        </div>
        {project.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.amenities.slice(0,3).map(a => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background:"var(--muted)", color:"var(--muted-foreground)" }}>{a}</span>
            ))}
            {project.amenities.length>3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background:"var(--muted)", color:"var(--muted-foreground)" }}>
                +{project.amenities.length-3}
              </span>
            )}
          </div>
        )}
        <div className="pt-1 mt-auto flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
          style={{ color:"var(--primary)" }}>
          {isLoggedIn ? "View Project" : "Login to View"}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6 text-center">
      <Icon className="h-5 w-5 mb-1" style={{ color:"var(--primary)" }} />
      <p className="display-font text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default function Home() {
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const [projects,  setProjects]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search,    setSearch]    = useState("");
  const [heroSearch,setHeroSearch]= useState("");

  useEffect(() => {
    // Only fetch 9 (3×3) for home
    api.get("/api/public/projects?sortBy=trending&limit=9")
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
    api.get("/api/public/stats").then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    navigate(`/projects?search=${encodeURIComponent(heroSearch)}`);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="hero-section py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="anim-fadeup delay-0">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
                <span className="shimmer w-1.5 h-1.5 rounded-full" style={{ background:"var(--primary)", display:"inline-block" }} />
                India's Premier Plot Investment Platform
              </span>
            </div>

            <h1 className="display-font anim-fadeup delay-100"
              style={{ fontSize:"clamp(2.5rem,5vw,4.5rem)", lineHeight:1.08, fontWeight:800 }}>
              Find Your Perfect
              <br />
              <span className="text-gradient">Plot Investment</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl anim-fadeup delay-200">
              Browse verified real estate projects from trusted builders.
              Transparent pricing, RERA compliant, direct builder access.
            </p>

            {/* Search */}
            <form onSubmit={handleHeroSearch}
              className="flex gap-3 max-w-xl anim-fadeup delay-300">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={heroSearch}
                  onChange={e=>setHeroSearch(e.target.value)}
                  placeholder="Search project or location…"
                  className="form-input pl-10 py-3 w-full"
                  style={{ borderRadius:"var(--radius-xl)" }}
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3"
                style={{ borderRadius:"var(--radius-xl)", whiteSpace:"nowrap" }}>
                Search
              </button>
            </form>

            {/* Quick stats inline */}
            {stats && (
              <div className="flex items-center gap-6 pt-2 anim-fadeup delay-400">
                {[
                  { label:"Active Projects", value: stats.projects },
                  { label:"Total Plots",     value: stats.plots },
                  { label:"Cities",          value: stats.locations },
                ].map(s => (
                  <div key={s.label} className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground text-base mr-1">{s.value}+</span>
                    {s.label}
                    <span className="mx-2 opacity-30">·</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <div className="section-divider" />
      <section style={{ background:"var(--card)", borderBottom:"1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x" style={{ "--tw-divide-opacity":1, borderColor:"var(--border)" }}>
          <StatCard icon={LayoutGrid}  value={stats?.projects  ?? "—"} label="Active Projects" />
          <StatCard icon={Layers}      value={stats?.plots     ?? "—"} label="Total Plots" />
          <StatCard icon={MapPin}      value={stats?.locations ?? "—"} label="Cities" />
          <StatCard icon={TrendingUp}  value="RERA"                    label="Compliant" />
        </div>
      </section>
      <div className="section-divider" />

      {/* ── PROJECTS 3×3 ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"var(--primary)" }}>Browse</p>
            <h2 className="display-font text-3xl font-bold text-foreground">Trending Projects</h2>
          </div>
          <Link to="/projects">
            <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-all hover:bg-accent"
              style={{ borderColor:"var(--border)", color:"var(--foreground)" }}>
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Not logged in notice */}
        {!isLoggedIn && (
          <div className="flex items-center justify-between gap-4 rounded-xl px-5 py-3 mb-6"
            style={{ background:"color-mix(in srgb, var(--primary) 6%, transparent)", border:"1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Browse freely.</span>{" "}
              Login to save projects and view full details.
            </p>
            <Link to="/login">
              <button className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background:"var(--primary)", color:"var(--primary-foreground)" }}>
                Sign In
              </button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(9)].map((_,i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Building2 className="h-12 w-12 mx-auto" style={{ color:"color-mix(in srgb, var(--muted-foreground) 40%, transparent)" }} />
            <p className="text-muted-foreground">No active projects yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.slice(0,9).map(p => (
                <ProjectCard key={p._id} project={p} isLoggedIn={isLoggedIn} />
              ))}
            </div>
            {/* View All CTA */}
            <div className="text-center mt-10">
              <Link to="/projects">
                <button className="inline-flex items-center gap-2 btn-primary px-8 py-3 rounded-xl text-sm font-semibold">
                  View All Projects <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <div className="section-divider" />
      <section style={{ background:"var(--muted)" }} className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:"var(--primary)" }}>Simple Process</p>
            <h2 className="display-font text-3xl font-bold text-foreground">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { step:"01", title:"Browse Projects", desc:"Explore RERA-verified projects from trusted builders. Filter by location, price, and plot type." },
              { step:"02", title:"Compare Plots",   desc:"View detailed plot info — size, facing, road width, legal documents, and layout images." },
              { step:"03", title:"Express Interest",desc:"Save projects and connect directly with builders. No middlemen, complete transparency." },
            ].map(s => (
              <div key={s.step} className="space-y-3">
                <span className="display-font text-5xl font-black" style={{ color:"color-mix(in srgb, var(--primary) 20%, transparent)" }}>{s.step}</span>
                <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          {!isLoggedIn && (
            <Link to="/signup">
              <button className="btn-primary px-10 py-3 rounded-xl text-sm font-semibold mt-4">
                Get Started Free →
              </button>
            </Link>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div className="section-divider" />
      <footer className="py-8" style={{ background:"var(--card)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} PlotVest · All Rights Reserved
          </p>
          <div className="flex gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider"
              style={{ background:"var(--muted)", color:"var(--muted-foreground)" }}>RERA Compliant</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider"
              style={{ background:"var(--muted)", color:"var(--muted-foreground)" }}>SEBI Registered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
