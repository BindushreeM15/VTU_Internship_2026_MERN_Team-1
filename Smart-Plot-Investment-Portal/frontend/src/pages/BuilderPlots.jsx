import { useEffect, useMemo, useState } from "react";
import {
  Trash2, Edit3, Loader2, Plus, X, AlertTriangle, Lock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge }  from "../components/ui/badge";
import { Input }  from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import api from "../utils/api";
import { toast } from "sonner";

const FACING_OPTIONS = [
  "North","South","East","West",
  "North-East","North-West","South-East","South-West",
];
const STATUS_OPTIONS = ["available","blocked","sold"];

const STATUS_STYLES = {
  available: "status-available",
  blocked:   "status-blocked",
  sold:      "status-sold",
};

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ plot, onConfirm, onCancel }) {
  if (!plot) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Plot</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Delete plot <span className="font-semibold text-foreground">{plot.plotNumber}</span>?
              {plot.status !== "available" && (
                <span className="text-destructive"> Only available plots can be deleted.</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={plot.status !== "available"}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Plot card ─────────────────────────────────────────────────────────────────
function PlotCard({ plot, onEdit, onDelete, onStatusChange }) {
  const projectName = plot.projectId?.projectName || "—";
  return (
    <div className="card-sp group p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
            {plot.plotNumber}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={STATUS_STYLES[plot.status]}>{plot.status}</span>
          <span className="text-xs font-semibold px-2 py-1 rounded-md border border-border text-foreground">
            ₹{Number(plot.price).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Size: <span className="text-foreground font-medium">{plot.sizeSqft} sq.ft</span></span>
        {plot.dimensions && <span>Dim: <span className="text-foreground font-medium">{plot.dimensions}</span></span>}
        <span>Facing: <span className="text-foreground font-medium">{plot.facing}</span></span>
        <span>Road: <span className="text-foreground font-medium">{plot.roadWidth}</span></span>
        {plot.cornerPlot && <span className="text-primary font-semibold col-span-2">✦ Corner Plot</span>}
      </div>

      {plot.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{plot.description}</p>
      )}
      {plot.locationLink && (
        <a href={plot.locationLink} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary w-fit">
          Plot Location <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {/* Quick status change + actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
        <select
          value={plot.status}
          onChange={(e) => onStatusChange(plot._id, e.target.value)}
          className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="flex gap-1.5 ml-auto">
          <Button size="sm" variant="outline" onClick={() => onEdit(plot)} className="gap-1 text-xs h-7">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
          {plot.status === "available"
            ? <Button size="sm" variant="outline" onClick={() => onDelete(plot)}
                className="gap-1 text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            : <span className="flex items-center gap-1 text-[10px] text-muted-foreground px-2">
                <Lock className="h-3 w-3" /> {plot.status}
              </span>}
        </div>
      </div>
    </div>
  );
}

// ── Form fields shared between add and edit ───────────────────────────────────
function PlotFormFields({ form, onChange, onSelectChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="form-label">Plot Number <span className="text-destructive">*</span></label>
        <Input name="plotNumber" value={form.plotNumber} onChange={onChange}
          placeholder="e.g. P101" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Size (sq.ft) <span className="text-destructive">*</span></label>
        <Input name="sizeSqft" type="number" min="1" value={form.sizeSqft} onChange={onChange}
          placeholder="e.g. 1200" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Dimensions</label>
        <Input name="dimensions" value={form.dimensions} onChange={onChange}
          placeholder="e.g. 30ft × 40ft" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Facing <span className="text-destructive">*</span></label>
        <Select value={form.facing} onValueChange={(v) => onSelectChange("facing", v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select facing" /></SelectTrigger>
          <SelectContent>
            {FACING_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="form-label">Road Width <span className="text-destructive">*</span></label>
        <Input name="roadWidth" value={form.roadWidth} onChange={onChange}
          placeholder="e.g. 30ft" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Price (₹) <span className="text-destructive">*</span></label>
        <Input name="price" type="number" min="0" value={form.price} onChange={onChange}
          placeholder="e.g. 500000" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Description</label>
        <Input name="description" value={form.description} onChange={onChange}
          placeholder="Plot overview" className="mt-1" />
      </div>
      <div>
        <label className="form-label">Location Link (Google Maps)</label>
        <Input name="locationLink" value={form.locationLink} onChange={onChange}
          placeholder="https://maps.google.com/..." className="mt-1" />
      </div>
      <div className="flex items-center gap-2 sm:col-span-2 pt-1">
        <input
          id="cornerPlot" type="checkbox" name="cornerPlot"
          checked={form.cornerPlot}
          onChange={onChange}
          className="h-4 w-4 rounded accent-primary cursor-pointer"
        />
        <label htmlFor="cornerPlot" className="text-sm text-foreground cursor-pointer select-none">
          Corner Plot
        </label>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BuilderPlots() {
  const [plots,        setPlots]        = useState([]);
  const [projects,     setProjects]     = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [deletingPlot, setDeletingPlot] = useState(null);
  const [editingPlot,  setEditingPlot]  = useState(null);
  const [plotCounts,   setPlotCounts]   = useState({});

  const emptyAdd = {
    projectId:"", plotNumber:"", sizeSqft:"", dimensions:"",
    facing:"", roadWidth:"", price:"", cornerPlot:false,
    description:"", locationLink:"",
  };
  const [addForm, setAddForm] = useState(emptyAdd);

  const emptyEdit = {
    plotNumber:"", sizeSqft:"", dimensions:"", facing:"",
    roadWidth:"", price:"", cornerPlot:false,
    description:"", locationLink:"", status:"available",
  };
  const [editForm, setEditForm] = useState(emptyEdit);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plotsRes, projRes] = await Promise.all([
        api.get("/api/projects/plots/all"),
        api.get("/api/projects/my-projects"),
      ]);
      const allPlots = plotsRes.data.plots || [];
      setPlots(allPlots);

      const eligible = (projRes.data.projects || []).filter(
        p => ["verified","active"].includes(p.projectStatus)
      );
      setProjects(eligible);

      // Plot count per project
      const counts = {};
      for (const proj of eligible) {
        const cnt = allPlots.filter(p => {
          const pid = typeof p.projectId === "object" ? p.projectId?._id : p.projectId;
          return String(pid) === String(proj._id);
        }).length;
        counts[proj._id] = { count: cnt, max: proj.totalPlots };
      }
      setPlotCounts(counts);

      if (!addForm.projectId && eligible.length) {
        setAddForm(prev => ({ ...prev, projectId: eligible[0]._id }));
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Add — send plain JSON ─────────────────────────────────────────────
  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddPlot = async () => {
    if (!addForm.projectId || !addForm.plotNumber.trim() || !addForm.sizeSqft ||
        !addForm.facing || !addForm.roadWidth || !addForm.price) {
      toast.error("Fill all required fields (Plot #, Size, Facing, Road Width, Price)");
      return;
    }
    const cap = plotCounts[addForm.projectId];
    if (cap && cap.count >= cap.max) {
      toast.error(`Plot limit reached (${cap.max}). Edit project to increase Total Plots.`);
      return;
    }
    try {
      // Send as plain JSON — no FormData needed (no images)
      await api.post("/api/projects/plots/add", {
        projectId:    addForm.projectId,
        plotNumber:   addForm.plotNumber.trim(),
        sizeSqft:     Number(addForm.sizeSqft),
        dimensions:   addForm.dimensions || undefined,
        facing:       addForm.facing,
        roadWidth:    addForm.roadWidth.trim(),
        price:        Number(addForm.price),
        cornerPlot:   addForm.cornerPlot,
        description:  addForm.description || undefined,
        locationLink: addForm.locationLink || undefined,
      });
      toast.success("Plot added!");
      setAddForm({ ...emptyAdd, projectId: addForm.projectId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add plot");
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────
  const startEdit = (plot) => {
    setEditingPlot(plot);
    setEditForm({
      plotNumber:   plot.plotNumber,
      sizeSqft:     String(plot.sizeSqft),
      dimensions:   plot.dimensions   || "",
      facing:       plot.facing,
      roadWidth:    plot.roadWidth,
      price:        String(plot.price),
      cornerPlot:   plot.cornerPlot   || false,
      description:  plot.description  || "",
      locationLink: plot.locationLink || "",
      status:       plot.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingPlot(null); setEditForm(emptyEdit); };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleUpdate = async () => {
    try {
      // Send as plain JSON
      await api.put("/api/projects/plots/update", {
        plotId:       editingPlot._id,
        plotNumber:   editForm.plotNumber.trim(),
        sizeSqft:     Number(editForm.sizeSqft),
        dimensions:   editForm.dimensions   || undefined,
        facing:       editForm.facing,
        roadWidth:    editForm.roadWidth.trim(),
        price:        Number(editForm.price),
        cornerPlot:   editForm.cornerPlot,
        description:  editForm.description  || undefined,
        locationLink: editForm.locationLink || undefined,
        status:       editForm.status,
      });
      toast.success("Plot updated!");
      cancelEdit();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    }
  };

  // ── Status quick change ────────────────────────────────────────────────
  const handleStatusChange = async (plotId, newStatus) => {
    try {
      await api.put("/api/projects/plots/update", { plotId, status: newStatus });
      toast.success(`Status → ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      await api.delete("/api/projects/plots/delete", { data: { plotId: deletingPlot._id } });
      toast.success("Plot deleted");
      setDeletingPlot(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
      setDeletingPlot(null);
    }
  };

  const selectedCap = plotCounts[addForm.projectId];

  return (
    <>
      <DeleteModal plot={deletingPlot} onConfirm={confirmDelete} onCancel={() => setDeletingPlot(null)} />

      <div className="space-y-6">
        {/* Form card */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingPlot
                ? <><Edit3 className="h-4 w-4 text-primary" /> Edit Plot — {editingPlot.plotNumber}</>
                : "Add Plot"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {editingPlot
                ? "Update plot details below."
                : "Plots can only be added to verified or active projects."}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ADD FORM */}
            {!editingPlot && (
              <>
                <div>
                  <label className="form-label">Project <span className="text-destructive">*</span></label>
                  {projects.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No verified projects yet. Get a project verified first.
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <Select
                        value={addForm.projectId}
                        onValueChange={v => setAddForm(p => ({ ...p, projectId: v }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p._id} value={p._id}>{p.projectName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCap && (
                        <Badge variant="outline"
                          className={`shrink-0 text-xs ${
                            selectedCap.count >= selectedCap.max
                              ? "border-destructive/40 text-destructive"
                              : "border-green-400/40 text-green-700 dark:text-green-400"
                          }`}>
                          {selectedCap.count} / {selectedCap.max}
                        </Badge>
                      )}
                    </div>
                  )}
                  {selectedCap?.count >= selectedCap?.max && (
                    <p className="mt-1 text-xs text-destructive">
                      Limit reached. Edit project to increase Total Plots.
                    </p>
                  )}
                </div>

                <PlotFormFields
                  form={addForm}
                  onChange={handleAddChange}
                  onSelectChange={(name, val) => setAddForm(p => ({ ...p, [name]: val }))}
                />

                <Button
                  onClick={handleAddPlot}
                  disabled={isLoading || projects.length === 0 || (selectedCap?.count >= selectedCap?.max)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Plot
                </Button>
              </>
            )}

            {/* EDIT FORM */}
            {editingPlot && (
              <>
                <PlotFormFields
                  form={editForm}
                  onChange={handleEditChange}
                  onSelectChange={(name, val) => setEditForm(p => ({ ...p, [name]: val }))}
                />

                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="form-input mt-1"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleUpdate} className="gap-2">Save Changes</Button>
                  <Button variant="outline" onClick={cancelEdit} className="gap-2">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Plots list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : plots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No plots yet. Add a plot to a verified project above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plots.map(plot => (
              <PlotCard
                key={plot._id}
                plot={plot}
                onEdit={startEdit}
                onDelete={setDeletingPlot}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
