import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../utils/api";
import {
  Search, MapPin, SlidersHorizontal, X, Building2,
  ChevronLeft, ChevronRight, Eye, Heart, ArrowRight, Filter,
} from "lucide-react";
import { Button } from "../components/ui/button";

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


// ── Image Slideshow (same as Home) ────────────────────────────────────────────
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
  if (!images.length) {
    const initials = companyName?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "SP";
    return (
      <div className="w-full h-full flex flex-col items-center justify-center"
        style={{ background:"color-mix(in srgb, var(--primary) 12%, var(--muted))" }}>
        <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-base font-bold"
          style={{ borderColor:"var(--primary)", color:"var(--primary)" }}>{initials}</div>
        <span className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">{companyName}</span>
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button onClick={e=>go(-1,e)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity">
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button onClick={e=>go(1,e)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity">
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_,i) => (
              <button key={i} onClick={e=>{e.stopPropagation();clearInterval(timer.current);setIdx(i);start();}}
                className={`rounded-full transition-all ${i===idx?"w-4 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/50"}`}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectCard({ project, isLoggedIn }) {
  const navigate = useNavigate();
  const allImages = [
    ...(project.sketchImage ? [project.sketchImage.url] : []),
    ...(project.projectImages || []).map(i => i.url),
    ...(project.plotImages || []).map(i => i.url),
  ];

  return (
    <div onClick={() => { if (!isLoggedIn) { navigate("/login"); return; } navigate(`/projects/${project._id}`); }}
      className="card-sp cursor-pointer flex flex-col overflow-hidden group">
      <div className="relative h-44 bg-muted shrink-0 overflow-hidden">
  <Slideshow images={allImages} companyName={project.builder?.companyName} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ background:"var(--primary)", color:"var(--primary-foreground)" }}>Active</span>
          {(project.availableCount||0) > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm">
              {project.availableCount} avail.
            </span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          <span className="flex items-center gap-0.5 bg-black/50 text-white text-[10px] rounded px-1.5 py-0.5">
            <Eye className="h-2.5 w-2.5" />{project.viewCount||0}
          </span>
          <span className="flex items-center gap-0.5 bg-black/50 text-white text-[10px] rounded px-1.5 py-0.5">
            <Heart className="h-2.5 w-2.5" />{project.interestCount||0}
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 space-y-2">
        <div>
          <h3 className="display-font font-bold text-foreground group-hover:text-primary transition-colors" style={{ fontSize:"1rem" }}>
            {project.projectName}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3 shrink-0" />{project.builder?.companyName}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0 text-primary" />{project.location}
          </p>
        </div>
        <div className="flex items-end justify-between mt-auto pt-1">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Price</p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(project.minPlotPrice)}
              {project.maxPlotPrice !== project.minPlotPrice &&
                <span className="text-muted-foreground font-normal"> – {formatPrice(project.maxPlotPrice)}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color:"var(--primary)" }}>
            View <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllProjects() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = localStorage.getItem("token");
  const isLoggedIn     = !!token;

  const [projects,    setProjects]    = useState([]);
  const [pagination,  setPagination]  = useState({ total:0, page:1, totalPages:1 });
  const [filterData,  setFilterData]  = useState({ locations:[], facingOptions:[], minPrice:0, maxPrice:10000000 });
  const [isLoading,   setIsLoading]   = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search,   setSearch]   = useState(searchParams.get("search") || "");
  const [sortBy,   setSortBy]   = useState("trending");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [facing,   setFacing]   = useState("");

  const fetchProjects = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ sortBy, page, limit:12 });
      if (search)   params.set("search",   search);
      if (location) params.set("location", location);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (facing)   params.set("facing",   facing);
      const r = await api.get(`/api/public/projects?${params}`);
      setProjects(r.data.projects || []);
      setPagination(r.data.pagination || {});
    } catch (_) {}
    finally { setIsLoading(false); }
  }, [search, sortBy, location, minPrice, maxPrice, facing]);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  useEffect(() => {
    api.get("/api/public/filters").then(r => setFilterData(r.data)).catch(() => {});
  }, []);

  const activeFilters = [search, location, minPrice, maxPrice, facing].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(""); setLocation(""); setMinPrice(""); setMaxPrice(""); setFacing("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"var(--primary)" }}>Explore</p>
        <h1 className="display-font text-3xl font-bold text-foreground">All Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">{pagination.total} project{pagination.total !== 1 ? "s" : ""} found</p>
      </div>

      {/* Search + controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search City Name */}
        <div className="relative flex-1">
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search project name or city…"
            className="form-input pl-10 w-full"
          />
        </div>
        {/* Select Locations */}
        <select value={location} onChange={e=>setLocation(e.target.value)}
          className="form-input sm:w-44">
          <option value="">All Cities</option>
          {filterData.locations?.map(l=><option key={l} value={l}>{l}</option>)}
        </select>
        {/* Select Trending */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          className="form-input sm:w-44">
          <option value="trending">🔥 Trending</option>
          <option value="newest">✨ Newest</option>
          <option value="price_asc">₹ Low to High</option>
          <option value="price_desc">₹ High to Low</option>
        </select>
        {/* Filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all"
          style={{
            background: activeFilters > 0 ? "var(--primary)" : "var(--card)",
            color: activeFilters > 0 ? "var(--primary-foreground)" : "var(--foreground)",
            borderColor: activeFilters > 0 ? "var(--primary)" : "var(--border)",
          }}>
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border p-5 space-y-4" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Advanced Filters
            </h3>
            <div className="flex gap-2">
              <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors">Reset all</button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label mb-1.5 block">Min Price (₹)</label>
              <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)}
                placeholder="e.g. 500000" className="form-input" />
            </div>
            <div>
              <label className="form-label mb-1.5 block">Max Price (₹)</label>
              <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}
                placeholder="e.g. 5000000" className="form-input" />
            </div>
            <div>
              <label className="form-label mb-1.5 block">Plot Facing</label>
              <select value={facing} onChange={e=>setFacing(e.target.value)} className="form-input">
                <option value="">Any Facing</option>
                {filterData.facingOptions?.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            search && { label:`"${search}"`, clear:()=>setSearch("") },
            location && { label:`📍 ${location}`, clear:()=>setLocation("") },
            (minPrice||maxPrice) && { label:`₹${minPrice||"0"} – ₹${maxPrice||"∞"}`, clear:()=>{setMinPrice("");setMaxPrice("");} },
            facing && { label:`⬡ ${facing}`, clear:()=>setFacing("") },
          ].filter(Boolean).map((chip, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
              style={{ background:"color-mix(in srgb, var(--primary) 10%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
              {chip.label}
              <button onClick={chip.clear}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(12)].map((_,i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Building2 className="h-12 w-12 mx-auto" style={{ color:"color-mix(in srgb, var(--muted-foreground) 40%, transparent)" }} />
          <p className="text-muted-foreground">No projects match your filters.</p>
          <button onClick={resetFilters} className="text-sm font-medium" style={{ color:"var(--primary)" }}>
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map(p => <ProjectCard key={p._id} project={p} isLoggedIn={isLoggedIn} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={pagination.page<=1}
            onClick={()=>fetchProjects(pagination.page-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={pagination.page>=pagination.totalPages}
            onClick={()=>fetchProjects(pagination.page+1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
