import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, ExternalLink, Loader2,
  ChevronLeft, ChevronRight, Compass, Ruler, Lock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import BlockPlotModal from "../components/BlockPlotModal";

const formatPrice = (p) => {
  if (!p && p !== 0) return "—";
  if (p >= 10000000) return `₹${(p/10000000).toFixed(2)} Cr`;
  if (p >= 100000)   return `₹${(p/100000).toFixed(2)} L`;
  return `₹${Number(p).toLocaleString("en-IN")}`;
};

const STATUS_STYLES = {
  available: "status-available",
  blocked:   "status-blocked",
  sold:      "status-sold",
};

// ── Project image slideshow (shown on every plot page) ────────────────────────
function ProjectImageSlideshow({ sketchImage, projectImages, companyName }) {
  const allImages = [
    ...(sketchImage ? [{ url: sketchImage.url, label: "Layout" }] : []),
    ...(projectImages || []).map(i => ({ url: i.url, label: "Photo" })),
  ];
  const [idx,  setIdx]  = useState(0);
  const timer = useRef(null);
  const start = useCallback(() => {
    if (allImages.length <= 1) return;
    timer.current = setInterval(() => setIdx(i => (i+1) % allImages.length), 4000);
  }, [allImages.length]);
  useEffect(() => { start(); return () => clearInterval(timer.current); }, [start]);

  const go = (dir) => {
    clearInterval(timer.current);
    setIdx(i => (i + dir + allImages.length) % allImages.length);
    start();
  };

  if (!allImages.length) {
    const initials = companyName?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"SP";
    return (
      <div className="w-full h-64 rounded-2xl flex flex-col items-center justify-center border"
        style={{ background:"color-mix(in srgb, var(--primary) 10%, var(--muted))", borderColor:"var(--border)" }}>
        <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold mb-2"
          style={{ borderColor:"var(--primary)", color:"var(--primary)" }}>{initials}</div>
        <span className="text-xs text-muted-foreground">{companyName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden h-64 bg-muted group">
        {allImages.map((img, i) => (
          <img key={i} src={img.url} alt={img.label}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i===idx?"opacity-100":"opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm">
            {allImages[idx]?.label} · {idx+1}/{allImages.length}
          </span>
        </div>
        {allImages.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => go(1)} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button key={i} onClick={() => { clearInterval(timer.current); setIdx(i); start(); }}
              className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                i===idx ? "border-primary" : "border-border opacity-50 hover:opacity-100"
              }`}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpecRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor:"var(--border)" }}>
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function PlotDetail() {
  const { projectId, plotId } = useParams();
  const navigate = useNavigate();

  const [plot,      setPlot]      = useState(null);
  const [project,   setProject]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    api.get(`/api/public/projects/${projectId}/plots/${plotId}`)
      .then(r => { setPlot(r.data.plot); setProject(r.data.project); })
      .catch(() => { toast.error("Plot not found"); navigate(`/projects/${projectId}`); })
      .finally(() => setIsLoading(false));
  }, [projectId, plotId]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color:"var(--primary)" }} />
    </div>
  );
  if (!plot || !project) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <button onClick={() => navigate("/")} className="hover:text-foreground">Home</button>
        <span>/</span>
        <button onClick={() => navigate("/projects")} className="hover:text-foreground">Projects</button>
        <span>/</span>
        <button onClick={() => navigate(`/projects/${projectId}`)} className="hover:text-foreground">{project.projectName}</button>
        <span>/</span>
        <span className="text-foreground font-medium">Plot {plot.plotNumber}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: project images (same for all plots in this project) */}
        <div className="space-y-3">
          <ProjectImageSlideshow
            sketchImage={project.sketchImage}
            projectImages={project.projectImages}
            companyName={project.builderId?.companyName}
          />
          <p className="text-[11px] text-center text-muted-foreground">
            Layout and site images for {project.projectName}
          </p>
        </div>

        {/* Right: plot details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[plot.status]}`}>
                {plot.status}
              </span>
              {plot.cornerPlot && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
                  ✦ Corner Plot
                </span>
              )}
            </div>
            <h1 className="display-font text-3xl font-bold text-foreground">Plot {plot.plotNumber}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.projectName} · {project.builderId?.companyName}
            </p>
          </div>

          {/* Price */}
          <div className="rounded-xl p-4"
            style={{ background:"color-mix(in srgb, var(--primary) 8%, var(--card))", border:"1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Price</p>
            <p className="display-font text-3xl font-bold text-foreground">{formatPrice(plot.price)}</p>
            {plot.sizeSqft && (
              <p className="text-xs text-muted-foreground mt-1">
                ₹{Math.round(plot.price / plot.sizeSqft).toLocaleString("en-IN")} per sq.ft
              </p>
            )}
          </div>

          {/* Specs */}
          <div className="rounded-xl border px-4" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
            <SpecRow icon={Ruler}   label="Size"       value={plot.sizeSqft ? `${plot.sizeSqft} sq.ft` : null} />
            <SpecRow icon={Ruler}   label="Dimensions" value={plot.dimensions} />
            <SpecRow icon={Compass} label="Facing"     value={plot.facing} />
            <SpecRow icon={MapPin}  label="Road Width" value={plot.roadWidth} />
          </div>

          {plot.description && (
            <div>
              <p className="form-label mb-1.5">Overview</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{plot.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {plot.status === "available" && (
              <Button onClick={() => setShowBlockModal(true)} className="gap-2">
                <Lock className="h-4 w-4" /> Block Plot
              </Button>
            )}
            {plot.locationLink && (
              <Button asChild variant="outline" className="gap-2">
                <a href={plot.locationLink} target="_blank" rel="noreferrer">
                  <MapPin className="h-4 w-4" /> Plot Location <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Project
            </Button>
          </div>
        </div>
      </div>

      {/* Block Plot Modal */}
      {showBlockModal && (
        <BlockPlotModal
          plot={plot}
          onClose={() => setShowBlockModal(false)}
          onSuccess={(booking) => {
            toast.success("Plot blocked successfully! Booking expires in 30 days.");
            setShowBlockModal(false);
            // Refresh plot status
            setPlot(prev => ({ ...prev, status: "reserved" }));
          }}
        />
      )}
    </div>
  );
}
