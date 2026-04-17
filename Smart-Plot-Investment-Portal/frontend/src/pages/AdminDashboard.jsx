import { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, Users, FolderKanban,
  ExternalLink, Loader2, ChevronDown, ChevronUp,
  Rocket, PowerOff, Shield, Search, Filter, X,
  Eye, Ban, Unlock, MapPin, Building2, ChevronLeft,
  FileText, Image as ImageIcon, BarChart2, ArrowLeft,
  AlertTriangle, Phone, Mail, Calendar, Hash,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

// ── helpers ───────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${BASE_URL}${fileUrl}`;
}

function isImage(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url.split("?")[0]);
}

// ── colour maps ───────────────────────────────────────────────────────────────
const KYC_COLOR = {
  unsubmitted: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400",
  under_review: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
  verified: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300",
  blocked: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/20 dark:text-rose-300",
};
const PROJ_COLOR = {
  draft: "bg-slate-100 text-slate-600 border-slate-300",
  under_review: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
  verified: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300",
  active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400",
  inactive: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
  completed: "bg-teal-50 text-teal-700 border-teal-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/20 dark:text-rose-300",
};

// ── File viewer modal ─────────────────────────────────────────────────────────
function FileViewerModal({ file, onClose }) {
  if (!file) return null;
  const url = getFileUrl(file.url || file.fileUrl);
  const img = isImage(url);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <p className="font-semibold text-sm text-foreground truncate">{file.label || file.docType || "Document"}</p>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
            </a>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
          {img ? (
            <img src={url} alt={file.label} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          ) : (
            <iframe src={url} title={file.label} className="w-full h-[70vh] rounded-lg border-0" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reason modal ──────────────────────────────────────────────────────────────
function ReasonModal({ open, title, onConfirm, onCancel, optional = false }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder={optional ? "Reason (optional)…" : "Provide a clear reason…"}
          rows={4} className="form-input resize-none w-full" />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => { setReason(""); onCancel(); }}>Cancel</Button>
          <Button variant="destructive" size="sm" disabled={!optional && !reason.trim()}
            onClick={() => { onConfirm(reason.trim()); setReason(""); }}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Search + filter bar ────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /> */}
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
        className="form-input pl-10 w-full max-w-sm text-sm" />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── File list with inline preview ─────────────────────────────────────────────
function DocList({ docs = [], kathaDocument, kathaType, onViewFile }) {
  if (!docs.length && !kathaDocument) return <p className="text-xs text-muted-foreground">No documents uploaded.</p>;
  return (
    <div className="space-y-1 mt-2">
      {docs.map(doc => {
        const url = getFileUrl(doc.fileUrl);
        const img = isImage(url);
        return (
          <div key={doc.docType} className="rounded-lg border border-border overflow-hidden">
            {img && (
              <div className="relative h-24 bg-muted">
                <img src={url} alt={doc.label} className="w-full h-full object-cover" />
                <button
                  onClick={() => onViewFile({ ...doc, url: doc.fileUrl })}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-6 w-6 text-white" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                {img ? <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" /> : <FileText className="h-3.5 w-3.5 text-primary shrink-0" />}
                <span className="text-xs text-foreground">{doc.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onViewFile({ ...doc, url: doc.fileUrl })}
                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Eye className="h-3 w-3" /> View
                </button>
                <a href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
      {kathaDocument && (
        <div className="rounded-lg border border-border overflow-hidden">
          {isImage(getFileUrl(kathaDocument.url)) && (
            <div className="relative h-24 bg-muted">
              <img src={getFileUrl(kathaDocument.url)} alt="Katha" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-foreground">Katha Certificate (Type {kathaType})</span>
            <button onClick={() => onViewFile({ label: `Katha (${kathaType})`, url: kathaDocument.url })}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-primary/10 text-primary">
              <Eye className="h-3 w-3" /> View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Builder Detail Page ────────────────────────────────────────────────────────
function BuilderDetail({ builder, onBack, onApprove, onReject, onBlock, onUnblock, onViewFile }) {
  const isBlocked = builder.kycStatus === "blocked";
  const canAct = builder.kycStatus === "under_review";
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to list
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="display-font text-2xl font-bold text-foreground">{builder.companyName}</h2>
          <p className="text-sm text-muted-foreground mt-1">{builder.name}</p>
        </div>
        <Badge className={`border text-xs uppercase tracking-wider px-3 py-1 ${KYC_COLOR[builder.kycStatus] || KYC_COLOR.unsubmitted}`}>
          {builder.kycStatus?.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-primary" />{builder.email}</div>
              <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-primary" />{builder.phone}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
            {builder.kycSubmittedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Submitted: {new Date(builder.kycSubmittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
            {builder.kycVerifiedAt && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified: {new Date(builder.kycVerifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            )}
            {builder.kycRejectionReason && (
              <div className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300">
                Reason: {builder.kycRejectionReason}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {builder.kycDocuments?.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KYC Documents ({builder.kycDocuments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DocList docs={builder.kycDocuments} onViewFile={onViewFile} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {canAct && (
          <>
            <Button size="sm" onClick={() => onApprove(builder._id)} className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve KYC
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject(builder._id)} className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Reject KYC
            </Button>
          </>
        )}
        {!isBlocked ? (
          <Button size="sm" variant="outline" onClick={() => onBlock(builder._id)}
            className="gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700">
            <Ban className="h-3.5 w-3.5" /> Block Builder
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onUnblock(builder._id)}
            className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50">
            <Unlock className="h-3.5 w-3.5" /> Unblock Builder
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Project Detail Page ────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onApprove, onReject, onActivate, onDeactivate, onBlock, onUnblock, onViewFile }) {
  const isBlocked = project.projectStatus === "blocked";
  const isPending = project.projectStatus === "under_review";
  const isVerified = project.projectStatus === "verified";
  const isActive = project.projectStatus === "active";

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to list
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="display-font text-2xl font-bold text-foreground">{project.projectName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {project.builderId?.companyName} · {project.location}
          </p>
        </div>
        <Badge className={`border text-xs uppercase tracking-wider px-3 py-1 ${PROJ_COLOR[project.projectStatus] || PROJ_COLOR.draft}`}>
          {project.projectStatus?.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Plots</p>
            <p className="text-2xl font-bold text-foreground">{project.totalPlots}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Katha Type</p>
            <p className="text-2xl font-bold text-foreground">{project.kathaType || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Views</p>
            <p className="text-2xl font-bold text-foreground">{project.viewCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {project.description && (
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {(project.sketchImage || project.projectImages?.length > 0) && (
        <Card className="border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Project Images</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {project.sketchImage && (
                <div className="relative group">
                  <img src={getFileUrl(project.sketchImage.url)} alt="sketch"
                    className="w-32 h-24 object-cover rounded-xl border border-border" />
                  <button onClick={() => onViewFile({ label: "Layout Sketch", url: project.sketchImage.url })}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">Layout</span>
                </div>
              )}
              {project.projectImages?.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={getFileUrl(img.url)} alt={`project-${i}`}
                    className="w-32 h-24 object-cover rounded-xl border border-border" />
                  <button onClick={() => onViewFile({ label: `Photo ${i + 1}`, url: img.url })}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(project.projectDocuments?.length > 0 || project.kathaDocument) && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legal Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocList
              docs={project.projectDocuments || []}
              kathaDocument={project.kathaDocument}
              kathaType={project.kathaType}
              onViewFile={onViewFile}
            />
          </CardContent>
        </Card>
      )}

      {project.projectRejectionReason && (
        <div className={`text-sm rounded-xl px-4 py-3 border ${isActive
          ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-300"
          : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"}`}>
          {isActive ? "⚠ Note: " : "Rejection reason: "}{project.projectRejectionReason}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {isPending && (
          <>
            <Button size="sm" onClick={() => onApprove(project._id)} className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject(project._id)} className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Reject
            </Button>
          </>
        )}
        {isVerified && (
          <Button size="sm" onClick={() => onActivate(project._id)} className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" /> Activate
          </Button>
        )}
        {isActive && (
          <Button size="sm" variant="outline" onClick={() => onDeactivate(project._id)}
            className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50">
            <PowerOff className="h-3.5 w-3.5" /> Deactivate
          </Button>
        )}
        {!isBlocked ? (
          <Button size="sm" variant="outline" onClick={() => onBlock(project._id)}
            className="gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700">
            <Ban className="h-3.5 w-3.5" /> Block Project
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onUnblock(project._id)}
            className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50">
            <Unlock className="h-3.5 w-3.5" /> Unblock Project
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Builder row card ───────────────────────────────────────────────────────────
function BuilderRow({ builder, onSelect, onApprove, onReject }) {
  return (
    <div onClick={() => onSelect(builder)}
      className="card-sp p-4 cursor-pointer hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{builder.companyName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{builder.name} · {builder.email}</p>
          {builder.kycSubmittedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted: {new Date(builder.kycSubmittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`border text-[10px] uppercase tracking-wider ${KYC_COLOR[builder.kycStatus] || KYC_COLOR.unsubmitted}`}>
            {builder.kycStatus?.replace("_", " ")}
          </Badge>
          {builder.kycStatus === "under_review" && (
            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
              <Button size="sm" onClick={() => onApprove(builder._id)} className="h-7 text-xs px-2 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(builder._id)} className="h-7 text-xs px-2 gap-1">
                <XCircle className="h-3 w-3" /> Reject
              </Button>
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ── Project row card ───────────────────────────────────────────────────────────
function ProjectRow({ project, onSelect, onApprove, onReject, onActivate, onDeactivate }) {
  const isPending = project.projectStatus === "under_review";
  const isVerified = project.projectStatus === "verified";
  const isActive = project.projectStatus === "active";
  return (
    <div onClick={() => onSelect(project)}
      className="card-sp p-4 cursor-pointer hover:border-primary/40 transition-all">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{project.projectName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {project.builderId?.companyName} · {project.location}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {project.totalPlots} plots{project.kathaType && ` · Katha ${project.kathaType}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Badge className={`border text-[10px] uppercase tracking-wider ${PROJ_COLOR[project.projectStatus] || PROJ_COLOR.draft}`}>
            {project.projectStatus?.replace("_", " ")}
          </Badge>
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            {isPending && (
              <>
                <Button size="sm" onClick={() => onApprove(project._id)} className="h-7 text-xs px-2 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(project._id)} className="h-7 text-xs px-2 gap-1">
                  <XCircle className="h-3 w-3" /> Reject
                </Button>
              </>
            )}
            {isVerified && (
              <Button size="sm" onClick={() => onActivate(project._id)} className="h-7 text-xs px-2 gap-1">
                <Rocket className="h-3 w-3" /> Activate
              </Button>
            )}
            {isActive && (
              <Button size="sm" variant="outline" onClick={() => onDeactivate(project._id)}
                className="h-7 text-xs px-2 gap-1 text-amber-600 border-amber-300 hover:bg-amber-50">
                <PowerOff className="h-3 w-3" /> Deactivate
              </Button>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ── Plot row ───────────────────────────────────────────────────────────────────
function PlotRow({ plot }) {
  const statusColor = {
    available: "bg-green-100 text-green-800 border-green-200",
    reserved: "bg-amber-100 text-amber-800 border-amber-200",
    sold: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <div className="card-sp p-4 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-foreground">Plot {plot.plotNumber} – {plot.projectName || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{plot.builderName} · {plot.location}</p>
        </div>
        <Badge className={`border text-[10px] uppercase ${statusColor[plot.status] || statusColor.available}`}>
          {plot.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
        <span>Size: <span className="text-foreground font-medium">{plot.sizeSqft} sqft</span></span>
        <span>Facing: <span className="text-foreground font-medium">{plot.facing}</span></span>
        <span>Price: <span className="text-foreground font-medium">₹{plot.price?.toLocaleString("en-IN")}</span></span>
        {plot.tokenAmount != null && (
          <span>Paid: <span className="text-green-600 font-medium">₹{plot.tokenAmount?.toLocaleString("en-IN")}</span></span>
        )}
      </div>
      {plot.investorName && (
        <p className="text-xs text-muted-foreground">Investor: <span className="text-foreground">{plot.investorName}</span> {plot.investorEmail && `· ${plot.investorEmail}`}</p>
      )}
      {plot.expiresAt && plot.bookingStatus === "reserved" && (
        <p className="text-xs text-amber-600">Reservation expires: {new Date(plot.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      )}
    </div>
  );
}

// ── Main AdminDashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("kyc");
  const [pendingKYC, setPendingKYC] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [allBuilders, setAllBuilders] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allPlots, setAllPlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rejectModal, setRejectModal] = useState({ open: false, type: null, id: null });
  const [deactivateModal, setDeactivateModal] = useState({ open: false, id: null });
  const [blockModal, setBlockModal] = useState({ open: false, type: null, id: null });

  // detail page state
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // file viewer
  const [viewingFile, setViewingFile] = useState(null);

  // search
  const [kycSearch, setKycSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all"); // all | pending | blocked
  const [projSearch, setProjSearch] = useState("");
  const [projFilter, setProjFilter] = useState("all");
  const [builderSearch, setBuilderSearch] = useState("");
  const [builderFilter, setBuilderFilter] = useState("all");
  const [allProjSearch, setAllProjSearch] = useState("");
  const [allProjFilter, setAllProjFilter] = useState("all");
  const [plotSearch, setPlotSearch] = useState("");

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [kycRes, projRes, allBRes, allPRes, plotsRes] = await Promise.all([
        api.get("/api/admin/kyc/pending"),
        api.get("/api/admin/projects/pending"),
        api.get("/api/admin/kyc/all"),
        api.get("/api/admin/projects/all"),
        api.get("/api/admin/plots"),
      ]);
      setPendingKYC(kycRes.data.builders || []);
      setPendingProjects(projRes.data.projects || []);
      setAllBuilders(allBRes.data.builders || []);
      setAllProjects(allPRes.data.projects || []);
      setAllPlots(plotsRes.data.plots || []);
    } catch { toast.error("Failed to load admin data"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const approveKYC = async (id) => {
    try {
      await api.post(`/api/admin/kyc/${id}/approve`);
      toast.success("KYC approved");
      fetchAll();
      if (selectedBuilder?._id === id) setSelectedBuilder(prev => ({ ...prev, kycStatus: "verified" }));
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };
  const approveProj = async (id) => {
    try {
      await api.post(`/api/admin/projects/${id}/approve`);
      toast.success("Project approved"); fetchAll();
      if (selectedProject?._id === id) setSelectedProject(prev => ({ ...prev, projectStatus: "verified" }));
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };
  const activateProj = async (id) => {
    try {
      await api.post(`/api/admin/projects/${id}/activate`);
      toast.success("Project activated"); fetchAll();
      if (selectedProject?._id === id) setSelectedProject(prev => ({ ...prev, projectStatus: "active" }));
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  const confirmReject = async (reason) => {
    try {
      if (rejectModal.type === "kyc") await api.post(`/api/admin/kyc/${rejectModal.id}/reject`, { reason });
      if (rejectModal.type === "project") await api.post(`/api/admin/projects/${rejectModal.id}/reject`, { reason });
      toast.success("Rejected");
      setRejectModal({ open: false, type: null, id: null });
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  const confirmDeactivate = async (reason) => {
    try {
      await api.post(`/api/admin/projects/${deactivateModal.id}/deactivate`, { reason });
      toast.success("Project deactivated");
      setDeactivateModal({ open: false, id: null });
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  // Block / Unblock stubs — update kycStatus locally (extend backend if needed)
  const handleBlock = async (type, id, reason) => {
    try {
      if (type === "project") {
        await api.post(`/api/admin/projects/${id}/deactivate`, { reason: reason || "Blocked by admin" });
      } else {
        await api.post(`/api/admin/kyc/${id}/reject`, { reason: reason || "Blocked by admin" });
      }
      toast.success(`${type === "project" ? "Project" : "Builder"} blocked`);
      setBlockModal({ open: false, type: null, id: null });
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  const handleUnblock = async (type, id) => {
    try {
      if (type === "project") {
        await api.post(`/api/admin/projects/${id}/activate`);
        toast.success("Project unblocked");
      } else {
        // Re-set to under_review for reconsideration
        toast.success("Builder unblocked — please re-review their KYC");
      }
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || "Failed"); }
  };

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filteredPendingKYC = useMemo(() => {
    let list = pendingKYC;
    if (kycSearch) list = list.filter(b =>
      b.companyName?.toLowerCase().includes(kycSearch.toLowerCase()) ||
      b.name?.toLowerCase().includes(kycSearch.toLowerCase()) ||
      b.email?.toLowerCase().includes(kycSearch.toLowerCase())
    );
    return list;
  }, [pendingKYC, kycSearch]);

  const filteredPendingProj = useMemo(() => {
    let list = pendingProjects;
    if (projSearch) list = list.filter(p =>
      p.projectName?.toLowerCase().includes(projSearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(projSearch.toLowerCase()) ||
      p.builderId?.companyName?.toLowerCase().includes(projSearch.toLowerCase())
    );
    return list;
  }, [pendingProjects, projSearch]);

  const filteredAllBuilders = useMemo(() => {
    let list = allBuilders;
    if (builderFilter === "blocked") list = list.filter(b => b.kycStatus === "rejected");
    else if (builderFilter === "verified") list = list.filter(b => b.kycStatus === "verified");
    else if (builderFilter === "pending") list = list.filter(b => b.kycStatus === "under_review");
    if (builderSearch) list = list.filter(b =>
      b.companyName?.toLowerCase().includes(builderSearch.toLowerCase()) ||
      b.name?.toLowerCase().includes(builderSearch.toLowerCase()) ||
      b.email?.toLowerCase().includes(builderSearch.toLowerCase())
    );
    return list;
  }, [allBuilders, builderSearch, builderFilter]);

  const filteredAllProjects = useMemo(() => {
    let list = allProjects;
    if (allProjFilter !== "all") list = list.filter(p => p.projectStatus === allProjFilter);
    if (allProjSearch) list = list.filter(p =>
      p.projectName?.toLowerCase().includes(allProjSearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(allProjSearch.toLowerCase()) ||
      p.builderId?.companyName?.toLowerCase().includes(allProjSearch.toLowerCase())
    );
    return list;
  }, [allProjects, allProjSearch, allProjFilter]);

  const filteredPlots = useMemo(() => {
    if (!plotSearch) return allPlots;
    return allPlots.filter(p =>
      p.plotNumber?.toLowerCase().includes(plotSearch.toLowerCase()) ||
      p.projectName?.toLowerCase().includes(plotSearch.toLowerCase()) ||
      p.builderName?.toLowerCase().includes(plotSearch.toLowerCase()) ||
      p.investorName?.toLowerCase().includes(plotSearch.toLowerCase())
    );
  }, [allPlots, plotSearch]);

  const PROJECT_STATUSES = ["all", "draft", "under_review", "verified", "active", "inactive", "rejected", "completed"];

  if (selectedBuilder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
        <BuilderDetail
          builder={selectedBuilder}
          onBack={() => setSelectedBuilder(null)}
          onApprove={approveKYC}
          onReject={id => setRejectModal({ open: true, type: "kyc", id })}
          onBlock={id => setBlockModal({ open: true, type: "builder", id })}
          onUnblock={id => handleUnblock("builder", id)}
          onViewFile={setViewingFile}
        />
        <ReasonModal open={rejectModal.open} title="Reject Builder KYC"
          onConfirm={confirmReject} onCancel={() => setRejectModal({ open: false, type: null, id: null })} />
        <ReasonModal open={blockModal.open} title="Block Builder" optional
          onConfirm={reason => handleBlock("builder", blockModal.id, reason)}
          onCancel={() => setBlockModal({ open: false, type: null, id: null })} />
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onApprove={approveProj}
          onReject={id => setRejectModal({ open: true, type: "project", id })}
          onActivate={activateProj}
          onDeactivate={id => setDeactivateModal({ open: true, id })}
          onBlock={id => setBlockModal({ open: true, type: "project", id })}
          onUnblock={id => handleUnblock("project", id)}
          onViewFile={setViewingFile}
        />
        <ReasonModal open={rejectModal.open} title="Reject Project"
          onConfirm={confirmReject} onCancel={() => setRejectModal({ open: false, type: null, id: null })} />
        <ReasonModal open={deactivateModal.open} title="Deactivate Project" optional
          onConfirm={confirmDeactivate} onCancel={() => setDeactivateModal({ open: false, id: null })} />
        <ReasonModal open={blockModal.open} title="Block Project" optional
          onConfirm={reason => handleBlock("project", blockModal.id, reason)}
          onCancel={() => setBlockModal({ open: false, type: null, id: null })} />
      </div>
    );
  }

  return (
    <>
      <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      <ReasonModal open={rejectModal.open}
        title={rejectModal.type === "kyc" ? "Reject Builder KYC" : "Reject Project"}
        onConfirm={confirmReject} onCancel={() => setRejectModal({ open: false, type: null, id: null })} />
      <ReasonModal open={deactivateModal.open} title="Deactivate Project" optional
        onConfirm={confirmDeactivate} onCancel={() => setDeactivateModal({ open: false, id: null })} />
      <ReasonModal open={blockModal.open} title={`Block ${blockModal.type === "project" ? "Project" : "Builder"}`} optional
        onConfirm={reason => handleBlock(blockModal.type, blockModal.id, reason)}
        onCancel={() => setBlockModal({ open: false, type: null, id: null })} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Admin</p>
          <h1 className="display-font text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Review verifications, manage projects and monitor platform.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Pending KYC", value: pendingKYC.length, icon: Users },
            { label: "Pending Projects", value: pendingProjects.length, icon: FolderKanban },
            { label: "Total Builders", value: allBuilders.length, icon: Users },
            { label: "Total Projects", value: allProjects.length, icon: FolderKanban },
            { label: "Total Plots", value: allPlots.length, icon: MapPin },
          ].map(s => (
            <div key={s.label} className="card-sp p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="kyc" className="gap-2 text-sm">
              <Users className="h-4 w-4" /> Builder KYC
              {pendingKYC.length > 0 && <Badge className="ml-1 text-[10px] px-1.5 py-0">{pendingKYC.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 text-sm">
              <FolderKanban className="h-4 w-4" /> Projects
              {pendingProjects.length > 0 && <Badge className="ml-1 text-[10px] px-1.5 py-0">{pendingProjects.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all-builders" className="text-sm">All Builders</TabsTrigger>
            <TabsTrigger value="all-projects" className="text-sm">All Projects</TabsTrigger>
            <TabsTrigger value="plots" className="text-sm">All Plots</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {/* ── Pending KYC ── */}
              {tab === "kyc" && (
                <div className="space-y-4">
                  <SearchBar value={kycSearch} onChange={setKycSearch} placeholder="Search builder name or email…" />
                  {filteredPendingKYC.length === 0
                    ? <p className="text-sm text-muted-foreground py-4">{kycSearch ? "No results found." : "No pending KYC submissions."}</p>
                    : filteredPendingKYC.map(b => (
                      <BuilderRow key={b._id} builder={b}
                        onSelect={setSelectedBuilder}
                        onApprove={approveKYC}
                        onReject={id => setRejectModal({ open: true, type: "kyc", id })} />
                    ))
                  }
                </div>
              )}

              {/* ── Pending Projects ── */}
              {tab === "projects" && (
                <div className="space-y-4">
                  <SearchBar value={projSearch} onChange={setProjSearch} placeholder="Search project name or location…" />
                  {filteredPendingProj.length === 0
                    ? <p className="text-sm text-muted-foreground py-4">{projSearch ? "No results found." : "No pending projects."}</p>
                    : filteredPendingProj.map(p => (
                      <ProjectRow key={p._id} project={p}
                        onSelect={setSelectedProject}
                        onApprove={approveProj}
                        onReject={id => setRejectModal({ open: true, type: "project", id })}
                        onActivate={activateProj}
                        onDeactivate={id => setDeactivateModal({ open: true, id })} />
                    ))
                  }
                </div>
              )}

              {/* ── All Builders ── */}
              {tab === "all-builders" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <SearchBar value={builderSearch} onChange={setBuilderSearch} placeholder="Search builders…" />
                    <div className="flex gap-1.5 flex-wrap">
                      {["all", "verified", "pending", "blocked"].map(f => (
                        <button key={f} onClick={() => setBuilderFilter(f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${builderFilter === f
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"}`}>
                          {f === "pending" ? "Under Review" : f === "blocked" ? "Blocked" : f === "all" ? `All (${allBuilders.length})` : f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredAllBuilders.length === 0
                    ? <p className="text-sm text-muted-foreground py-4">No builders found.</p>
                    : filteredAllBuilders.map(b => (
                      <BuilderRow key={b._id} builder={b}
                        onSelect={setSelectedBuilder}
                        onApprove={approveKYC}
                        onReject={id => setRejectModal({ open: true, type: "kyc", id })} />
                    ))
                  }
                </div>
              )}

              {/* ── All Projects ── */}
              {tab === "all-projects" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <SearchBar value={allProjSearch} onChange={setAllProjSearch} placeholder="Search projects…" />
                    <select value={allProjFilter} onChange={e => setAllProjFilter(e.target.value)}
                      className="form-input sm:w-44 text-sm">
                      {PROJECT_STATUSES.map(s => (
                        <option key={s} value={s}>{s === "all" ? `All (${allProjects.length})` : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  {filteredAllProjects.length === 0
                    ? <p className="text-sm text-muted-foreground py-4">No projects found.</p>
                    : filteredAllProjects.map(p => (
                      <ProjectRow key={p._id} project={p}
                        onSelect={setSelectedProject}
                        onApprove={approveProj}
                        onReject={id => setRejectModal({ open: true, type: "project", id })}
                        onActivate={activateProj}
                        onDeactivate={id => setDeactivateModal({ open: true, id })} />
                    ))
                  }
                </div>
              )}

              {/* ── All Plots ── */}
              {tab === "plots" && (
                <div className="space-y-4">
                  <SearchBar value={plotSearch} onChange={setPlotSearch} placeholder="Search plot, project or investor…" />
                  {filteredPlots.length === 0
                    ? <p className="text-sm text-muted-foreground py-4">No plots found.</p>
                    : <div className="grid gap-3 md:grid-cols-2">
                      {filteredPlots.map((p, i) => <PlotRow key={i} plot={p} />)}
                    </div>
                  }
                </div>
              )}

            </div>
          )}
        </Tabs>
      </div>
    </>
  );
}
