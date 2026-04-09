import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Pencil, Loader2, X, AlertTriangle,
  Upload, FileCheck2, Send, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, ExternalLink, Image, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input }     from "../components/ui/input";
import { Button }    from "../components/ui/button";
import { Badge }     from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import api from "../utils/api";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_AMENITIES = [
  "Tar Roads", "Park / Garden", "Water Supply", "Underground Drainage",
  "Street Lighting", "Electricity", "Clubhouse", "Security / CCTV",
  "Children's Play Area", "Jogging Track", "Compound Wall", "CCTV Surveillance",
];

const PROJECT_DOCS = [
  { key: "reraCertificate",        label: "RERA Certificate",           required: true  },
  { key: "landTitle",              label: "Land Title / Sale Deed",     required: true  },
  { key: "dcConversion",           label: "DC Conversion Certificate",  required: true  },
  { key: "approvedLayoutPlan",     label: "Approved Layout Plan",       required: true  },
  { key: "encumbranceCertificate", label: "Encumbrance Certificate",    required: true  },
];

const KATHA_TYPES = ["A", "B", "NA"];

const STATUS_CONFIG = {
  draft:        { label: "Draft",        cls: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600" },
  under_review: { label: "Under Review", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700" },
  verified:     { label: "Verified",     cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700" },
  rejected:     { label: "Rejected",     cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700" },
  active:       { label: "Active",       cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700" },
  inactive:     { label: "Inactive",     cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700" },
  completed:    { label: "Completed",    cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-700" },
};

// ── File upload field ─────────────────────────────────────────────────────────
function FileField({ label, file, onChange, onRemove, accept = ".pdf,.jpg,.jpeg,.png", note }) {
  return (
    <div className="space-y-1.5">
      <label className="form-label">{label}</label>
      {note && <p className="text-[11px] text-muted-foreground italic">{note}</p>}
      <div className={`relative flex items-center gap-3 border rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
        file ? "border-primary/50 bg-primary/5" : "border-border bg-input hover:border-primary/30"
      }`}>
        {file ? (
          <>
            <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive text-xs shrink-0">Remove</button>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
          </>
        )}
        <input type="file" accept={accept} className="absolute inset-0 opacity-0 cursor-pointer" onChange={onChange} />
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ project, onConfirm, onCancel }) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Project</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Delete <span className="font-medium text-foreground">{project.projectName}</span>? All plots will also be removed. This cannot be undone.
            </p>
            {!["draft","rejected"].includes(project?.projectStatus) && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-800 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-300">
                ⚠ This project is currently <strong>{project?.projectStatus}</strong>. Deleting it will remove it permanently.
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── Submit for review modal ───────────────────────────────────────────────────
function SubmitReviewModal({ project, onClose, onSuccess }) {
  const [files,     setFiles]     = useState({});
  const [kathaType, setKathaType] = useState(project?.kathaType || "");
  const [kathaDoc,  setKathaDoc]  = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!project) return null;
  const allDocsUploaded = PROJECT_DOCS.every((d) => files[d.key]);

  const handleSubmit = async () => {
  if (!allDocsUploaded) { toast.error("All 5 documents are required"); return; }
  if (!kathaType)        { toast.error("Katha type is required"); return; }
  
  setSubmitting(true);
  const fd = new FormData();

  // 1. Explicitly stringify the ID to ensure it's sent correctly
  fd.append("projectId", project._id.toString());
  fd.append("kathaType", kathaType);
  
  // 2. Only append kathaDoc if the user actually selected a file
  if (kathaDoc instanceof File) {
    fd.append("kathaDocument", kathaDoc);
  }

  // 3. Append required docs
  Object.entries(files).forEach(([k, v]) => {
    if (v) fd.append(k, v);
  });

  try {
    await api.post("/api/projects/submit-for-review", fd, { 
      headers: { "Content-Type": "multipart/form-data" } 
    });
    toast.success("Project submitted for review!");
    onSuccess();
    onClose();
  } catch (err) {
    // 4. Enhanced error reporting
    const errorMsg = err.response?.data?.error || "Submission failed. Please check your connection.";
    toast.error(errorMsg);
    console.error("Upload Error:", err.response?.data);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Submit for Verification</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload all 5 documents for <span className="font-medium">{project.projectName}</span>.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <Separator />

        {/* Katha Type — required */}
        <div className="space-y-2">
          <label className="form-label">Katha Type <span className="text-destructive">*</span></label>
          <div className="flex gap-2">
            {KATHA_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setKathaType(t)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  kathaType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Katha document — optional */}
        <FileField
          label="Katha Certificate (optional)"
          file={kathaDoc}
          onChange={(e) => setKathaDoc(e.target.files?.[0] || null)}
          onRemove={() => setKathaDoc(null)}
          note="💡 Uploading document increases trust with investors"
        />

        <Separator />

        {/* Legal documents */}
        <p className="text-sm font-medium text-foreground">Legal Documents <span className="text-destructive">*</span></p>
        {PROJECT_DOCS.map((doc) => (
          <FileField
            key={doc.key}
            label={doc.label}
            file={files[doc.key]}
            onChange={(e) => { if (e.target.files?.[0]) setFiles((prev) => ({ ...prev, [doc.key]: e.target.files[0] })); }}
            onRemove={() => setFiles((prev) => { const n = {...prev}; delete n[doc.key]; return n; })}
          />
        ))}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={submitting || !allDocsUploaded || !kathaType} className="gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit for Review</>}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, onSubmitReview, onToggleStatus }) {
  const [docsOpen, setDocsOpen] = useState(false);
  const sc = STATUS_CONFIG[project.projectStatus] || STATUS_CONFIG.draft;

  const canEdit   = !["under_review","completed"].includes(project.projectStatus);
  const canDelete = project.projectStatus !== "completed";
  const canSubmit = ["draft","rejected"].includes(project.projectStatus);
  const canToggle = ["active","inactive","verified"].includes(project.projectStatus);

  const plotCount = project.totalPlots || 0;

  return (
    <Card className="border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate">{project.projectName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{project.location}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide shrink-0 ${sc.cls}`}>
            {sc.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Plots: <span className="text-foreground font-medium">{plotCount}</span></span>
          {project.kathaType && <span>Katha: <span className="text-foreground font-medium">{project.kathaType}</span></span>}
          {project.locationLink && (
            <a href={project.locationLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary">
              Map <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Images */}
        {(project.sketchImage || project.projectImages?.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {project.sketchImage && (
              <img src={project.sketchImage.url} alt="sketch" className="w-14 h-10 object-cover rounded-md border border-border shrink-0" />
            )}
            {project.projectImages?.map((img) => (
              <img key={img.publicId} src={img.url} alt="project" className="w-14 h-10 object-cover rounded-md border border-border shrink-0" />
            ))}
          </div>
        )}

        {/* Amenities */}
        {project.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.amenities.slice(0, 4).map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px] px-2 py-0">{a}</Badge>
            ))}
            {project.amenities.length > 4 && <Badge variant="secondary" className="text-[10px] px-2 py-0">+{project.amenities.length - 4}</Badge>}
          </div>
        )}

        {/* Rejection reason */}
        {project.projectStatus === "rejected" && project.projectRejectionReason && (
          <div className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300">
            <span className="font-medium">Rejected:</span> {project.projectRejectionReason}
          </div>
        )}

        {/* Admin deactivation reason */}
        {project.projectStatus === "inactive" && project.projectRejectionReason && (
          <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-300">
            <span className="font-medium">⚠ Deactivated by Admin:</span> {project.projectRejectionReason}
          </div>
        )}

        {/* Documents toggle */}
        {project.projectDocuments?.length > 0 && (
          <button onClick={() => setDocsOpen(!docsOpen)} className="flex items-center gap-1 text-xs text-primary">
            {docsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {docsOpen ? "Hide" : "View"} Docs ({project.projectDocuments.length})
          </button>
        )}
        {docsOpen && (
          <div className="space-y-1.5 border-t border-border pt-2">
            {project.projectDocuments.map((doc) => (
              <div key={doc.docType} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground">{doc.label}</span>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1">
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          {canSubmit && (
            <Button size="sm" onClick={() => onSubmitReview(project)} className="gap-1.5 text-xs h-7">
              <Send className="h-3 w-3" />
              {project.projectStatus === "rejected" ? "Resubmit" : "Submit for Review"}
            </Button>
          )}
          {canToggle && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus(project)}
              className={`gap-1.5 text-xs h-7 ${project.projectStatus === "active" ? "text-amber-600 border-amber-300 hover:bg-amber-50" : "text-green-600 border-green-300 hover:bg-green-50"}`}
            >
              {project.projectStatus === "active"
                ? <><ToggleRight className="h-3.5 w-3.5" /> Set Inactive</>
                : <><ToggleLeft className="h-3.5 w-3.5" /> Set Active</>}
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(project)} className="gap-1.5 text-xs h-7">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(project)} className="gap-1.5 text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5">
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BuilderProjects() {
  const [projects,        setProjects]        = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [editingId,       setEditingId]       = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [reviewProject,   setReviewProject]   = useState(null);

  // Custom amenity input
  const [customAmenity, setCustomAmenity] = useState("");

  const [form, setForm] = useState({
    projectName: "", location: "", locationLink: "",
    description: "", amenities: [], totalPlots: "", kathaType: "",
  });
  const [sketchFile,    setSketchFile]    = useState(null);
  const [projectImages, setProjectImages] = useState(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/projects/my-projects");
      setProjects(res.data.projects || []);
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleAmenity = (a) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const addCustomAmenity = () => {
    const val = customAmenity.trim();
    if (!val) return;
    if (form.amenities.includes(val)) { toast.error("Already added"); return; }
    setForm((prev) => ({ ...prev, amenities: [...prev.amenities, val] }));
    setCustomAmenity("");
  };

  const resetForm = () => {
    setForm({ projectName:"", location:"", locationLink:"", description:"", amenities:[], totalPlots:"", kathaType:"" });
    setSketchFile(null);
    setProjectImages(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim() || !form.location.trim() || !form.description.trim() || !form.totalPlots) {
      toast.error("Please fill all required fields"); return;
    }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "amenities") fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (sketchFile)    fd.append("sketchImage", sketchFile);
      if (projectImages) Array.from(projectImages).forEach((f) => fd.append("projectImages", f));

      if (editingId) {
        fd.append("projectId", editingId);
        await api.put("/api/projects/update", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Project updated");
        setEditingId(null);
      } else {
        await api.post("/api/projects/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Project created as draft");
      }
      resetForm();
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save project");
    }
  };

  const startEdit = (project) => {
    setEditingId(project._id);
    setForm({
      projectName:  project.projectName,
      location:     project.location,
      locationLink: project.locationLink || "",
      description:  project.description,
      amenities:    project.amenities || [],
      totalPlots:   String(project.totalPlots),
      kathaType:    project.kathaType || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); resetForm(); };

  const confirmDelete = async () => {
    try {
      await api.delete("/api/projects/delete", { data: { projectId: deletingProject._id } });
      toast.success("Project deleted");
      setDeletingProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
      setDeletingProject(null);
    }
  };

  const handleToggleStatus = async (project) => {
    const newStatus = project.projectStatus === "active" ? "inactive" : "active";
    try {
      await api.put("/api/projects/update", { projectId: project._id, projectStatus: newStatus });
      toast.success(`Project set to ${newStatus}`);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const projectCards = useMemo(() => {
    if (!projects.length) return <p className="text-sm text-muted-foreground col-span-2">No projects yet.</p>;
    return projects.map((p) => (
      <ProjectCard
        key={p._id} project={p}
        onEdit={startEdit}
        onDelete={setDeletingProject}
        onSubmitReview={setReviewProject}
        onToggleStatus={handleToggleStatus}
      />
    ));
  }, [projects]);

  return (
    <>
      <DeleteModal project={deletingProject} onConfirm={confirmDelete} onCancel={() => setDeletingProject(null)} />
      <SubmitReviewModal project={reviewProject} onClose={() => setReviewProject(null)} onSuccess={fetchProjects} />

      <div className="space-y-6">
        {/* Form card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingId ? <><Pencil className="h-4 w-4 text-primary" /> Edit Project</> : "New Project"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {editingId ? "Update project details." : "Create a draft. Add images and submit for admin review when ready."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Project Name <span className="text-destructive">*</span></label>
                  <Input name="projectName" value={form.projectName} onChange={handleChange} placeholder="e.g. Dream Estate" className="mt-1" />
                </div>
                <div>
                  <label className="form-label">Location <span className="text-destructive">*</span></label>
                  <Input name="location" value={form.location} onChange={handleChange} placeholder="City, Area" className="mt-1" />
                </div>
                <div>
                  <label className="form-label">Total Plots <span className="text-destructive">*</span></label>
                  <Input name="totalPlots" type="number" min="1" value={form.totalPlots} onChange={handleChange} placeholder="e.g. 20" className="mt-1" />
                </div>
                <div>
                  <label className="form-label">Google Maps Link</label>
                  <Input name="locationLink" value={form.locationLink} onChange={handleChange} placeholder="https://maps.google.com/..." className="mt-1" />
                </div>
              </div>

              <div>
                <label className="form-label">Description <span className="text-destructive">*</span></label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your project…"
                  rows={3}
                  className="form-input mt-1 resize-none"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <label className="form-label">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_AMENITIES.map((a) => (
                    <button
                      key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.amenities.includes(a)
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                  {/* Show custom amenities that aren't in DEFAULT_AMENITIES */}
                  {form.amenities
                    .filter((a) => !DEFAULT_AMENITIES.includes(a))
                    .map((a) => (
                      <button
                        key={a} type="button" onClick={() => toggleAmenity(a)}
                        className="px-3 py-1.5 rounded-full text-xs border bg-primary/10 border-primary/40 text-primary font-medium flex items-center gap-1"
                      >
                        {a} <X className="h-3 w-3" />
                      </button>
                    ))}
                </div>
                {/* Custom amenity input */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                    placeholder="Add custom amenity…"
                    className="text-sm h-8 max-w-xs"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustomAmenity} className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Click to select/deselect. Custom amenities are for this project only.</p>
              </div>

              {/* Katha type */}
              <div className="space-y-2">
                <label className="form-label">Katha Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm((p) => ({ ...p, kathaType: "" }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${!form.kathaType ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    Not set
                  </button>
                  {KATHA_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, kathaType: t }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.kathaType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project images */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="form-label">Layout / Sketch Image (optional)</label>
                  <div className={`relative flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    sketchFile ? "border-primary/50 bg-primary/5" : "border-border bg-input hover:border-primary/30"
                  }`}>
                    {sketchFile
                      ? <><FileCheck2 className="h-4 w-4 text-primary shrink-0" /><span className="text-sm truncate flex-1">{sketchFile.name}</span><button type="button" onClick={() => setSketchFile(null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button></>
                      : <><Image className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload sketch</span></>}
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setSketchFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">Project Images — up to 5 (optional)</label>
                  <div className={`relative flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    projectImages ? "border-primary/50 bg-primary/5" : "border-border bg-input hover:border-primary/30"
                  }`}>
                    {projectImages
                      ? <><FileCheck2 className="h-4 w-4 text-primary shrink-0" /><span className="text-sm truncate flex-1">{projectImages.length} file(s)</span><button type="button" onClick={() => setProjectImages(null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button></>
                      : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload up to 5 images</span></>}
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setProjectImages(e.target.files?.length ? e.target.files : null)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">These will show in the Home slideshow</p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" className="gap-2">
                  {editingId ? <><Pencil className="h-4 w-4" /> Update</> : <><Plus className="h-4 w-4" /> Create Project</>}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit} className="gap-2">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{projectCards}</div>
        )}
      </div>
    </>
  );
}