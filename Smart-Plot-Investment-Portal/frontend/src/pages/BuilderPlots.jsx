import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit3, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import api from "../utils/api";

// ── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ plot, onConfirm, onCancel }) {
    if (!plot) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />
            {/* Dialog */}
            <div className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-border bg-card shadow-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-destructive/10 p-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Delete Plot</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {plot.plotNumber}
                            </span>{" "}
                            from{" "}
                            <span className="font-medium text-foreground">
                                {plot.projectName}
                            </span>
                            ? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>
                        Delete Plot
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BuilderPlots() {
    const [plots, setPlots] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [addForm, setAddForm] = useState({
        projectId: "",
        plotNumber: "",
        size: "",
        price: "",
        facingDirection: "",
        roadWidth: "",
    });

    const [editingPlot, setEditingPlot] = useState(null);
    const [editForm, setEditForm] = useState({
        plotNumber: "",
        size: "",
        price: "",
        status: "",
        facingDirection: "",
        roadWidth: "",
    });

    // Plot pending deletion (drives modal)
    const [deletingPlot, setDeletingPlot] = useState(null);

    // ── Data fetching ──────────────────────────────────────────────────────
    const fetchProjects = async () => {
        try {
            const res = await api.get("/api/projects/my-projects");
            setProjects(res.data.projects || []);
            if (!addForm.projectId && res.data.projects?.length) {
                setAddForm((prev) => ({ ...prev, projectId: res.data.projects[0]._id }));
            }
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load projects");
        }
    };

    const fetchPlots = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/api/projects/all-plots");
            setPlots(res.data.plots || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load plots");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchPlots();
    }, []);

    // ── Add ────────────────────────────────────────────────────────────────
    const handleAddChange = (e) =>
        setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAddPlot = async () => {
        if (
            !addForm.projectId ||
            !addForm.plotNumber.trim() ||
            !addForm.size.trim() ||
            !addForm.price
        ) {
            setError("All fields are required to add a plot.");
            return;
        }
        try {
            await api.post("/api/projects/add-plot", {
                projectId: addForm.projectId,
                plotNumber: addForm.plotNumber,
                size: addForm.size,
                price: Number(addForm.price),
                facingDirection: addForm.facingDirection,
                roadWidth: addForm.roadWidth,
            });
            setAddForm((prev) => ({ ...prev, plotNumber: "", size: "", price: "", facingDirection: "", roadWidth: "" }));
            fetchPlots();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add plot");
        }
    };

    // ── Edit ───────────────────────────────────────────────────────────────
    const startEdit = (plot) => {
        setEditingPlot(plot);
        setEditForm({
            plotNumber: plot.plotNumber || "",
            size: plot.size || "",
            price: plot.price || "",
            status: plot.status || "",
            facingDirection: plot.facingDirection || "",
            roadWidth: plot.roadWidth || "",
        });
    };

    const cancelEdit = () => {
        setEditingPlot(null);
        setEditForm({ plotNumber: "", size: "", price: "", status: "", facingDirection: "", roadWidth: "" });
    };

    const handleEditChange = (e) =>
        setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleUpdate = async () => {
        if (!editingPlot) return;
        try {
            await api.put("/api/projects/update-plot", {
                projectId: editingPlot.projectId,
                plotId: editingPlot.plotId,
                plotNumber: editForm.plotNumber,
                size: editForm.size,
                price: Number(editForm.price),
                status: editForm.status,
                facingDirection: editForm.facingDirection,
                roadWidth: editForm.roadWidth,
            });
            cancelEdit();
            fetchPlots();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update plot");
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deletingPlot) return;
        try {
            await api.delete("/api/projects/delete-plot", {
                data: {
                    projectId: deletingPlot.projectId,
                    plotId: deletingPlot.plotId,
                },
            });
            setDeletingPlot(null);
            fetchPlots();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete plot");
            setDeletingPlot(null);
        }
    };

    // ── Plot cards ─────────────────────────────────────────────────────────
    const plotCards = useMemo(() => {
        if (!plots.length) {
            return (
                <p className="text-sm text-muted-foreground col-span-2">
                    No plots created yet. Add a plot above.
                </p>
            );
        }

        return plots.map((plot) => (
            <Card
                key={plot.plotId}
                className="group relative border-border bg-card/70 hover:border-primary/30 hover:shadow-lg transition-all"
            >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="relative pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {plot.plotNumber}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {plot.projectName}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="uppercase text-xs tracking-wider">
                                {plot.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                ₹{Number(plot.price).toLocaleString("en-IN")}
                            </Badge>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Size: {plot.size}
                        {plot.roadWidth ? (
                            <span className="inline-block ml-4">Road: {plot.roadWidth}</span>
                        ) : null}
                        {plot.facingDirection ? (
                            <span className="inline-block ml-4">Facing: {plot.facingDirection}</span>
                        ) : null}
                    </p>

                    <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(plot)}
                            className="gap-1.5"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingPlot(plot)}
                            className="gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ));
    }, [plots]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            {/* Delete confirmation modal */}
            <DeleteModal
                plot={deletingPlot}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingPlot(null)}
            />

            <div className="space-y-6">
                <Card className="border-border bg-card/70 shadow-sm shadow-primary/5">
                    <CardHeader>
                        <CardTitle>
                            {editingPlot ? (
                                <span className="flex items-center gap-2">
                                    <Edit3 className="h-4 w-4 text-primary" />
                                    Edit Plot — {editingPlot.plotNumber}
                                </span>
                            ) : (
                                "Plots"
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {editingPlot
                                ? "Update the plot's details below."
                                : "Manage your project plots. Update status, price, or delete."}
                        </p>
                    </CardHeader>

                    <CardContent>
                        {/* ── ADD FORM (hidden while editing) ── */}
                        {!editingPlot && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">
                                    Add Plot
                                </h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Project
                                        </label>
                                        <Select
                                            value={addForm.projectId}
                                            onValueChange={(value) =>
                                                setAddForm((prev) => ({
                                                    ...prev,
                                                    projectId: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Select project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map((project) => (
                                                    <SelectItem
                                                        key={project._id}
                                                        value={project._id}
                                                    >
                                                        {project.projectName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Plot #
                                        </label>
                                        <input
                                            name="plotNumber"
                                            value={addForm.plotNumber}
                                            onChange={handleAddChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. A-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Size
                                        </label>
                                        <input
                                            name="size"
                                            value={addForm.size}
                                            onChange={handleAddChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. 1200 sq ft"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Price (₹)
                                        </label>
                                        <input
                                            name="price"
                                            type="number"
                                            value={addForm.price}
                                            onChange={handleAddChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. 150000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Facing Direction
                                        </label>
                                        <select
                                            name="facingDirection"
                                            value={addForm.facingDirection}
                                            onChange={handleAddChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        >
                                            <option value="">Select direction</option>
                                            <option value="north">North</option>
                                            <option value="south">South</option>
                                            <option value="east">East</option>
                                            <option value="west">West</option>
                                            <option value="northeast">Northeast</option>
                                            <option value="northwest">Northwest</option>
                                            <option value="southeast">Southeast</option>
                                            <option value="southwest">Southwest</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Road Width
                                        </label>
                                        <input
                                            name="roadWidth"
                                            value={addForm.roadWidth}
                                            onChange={handleAddChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. 30 feet"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddPlot}
                                    className="gap-2 mt-1"
                                    disabled={isLoading}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Plot
                                </Button>
                            </div>
                        )}

                        {/* ── EDIT FORM (full width, replaces add form) ── */}
                        {editingPlot && (
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Plot #
                                        </label>
                                        <input
                                            name="plotNumber"
                                            value={editForm.plotNumber}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. A-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Size
                                        </label>
                                        <input
                                            name="size"
                                            value={editForm.size}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. 1200 sq ft"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Price (₹)
                                        </label>
                                        <input
                                            name="price"
                                            type="number"
                                            value={editForm.price}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="Price in INR"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={editForm.status}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        >
                                            <option value="available">Available</option>
                                            <option value="reserved">Reserved</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Facing Direction
                                        </label>
                                        <select
                                            name="facingDirection"
                                            value={editForm.facingDirection}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        >
                                            <option value="">Select direction</option>
                                            <option value="north">North</option>
                                            <option value="south">South</option>
                                            <option value="east">East</option>
                                            <option value="west">West</option>
                                            <option value="northeast">Northeast</option>
                                            <option value="northwest">Northwest</option>
                                            <option value="southeast">Southeast</option>
                                            <option value="southwest">Southwest</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                            Road Width
                                        </label>
                                        <input
                                            name="roadWidth"
                                            value={editForm.roadWidth}
                                            onChange={handleEditChange}
                                            className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder="e.g. 30 feet"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <Button onClick={handleUpdate} disabled={isLoading} className="gap-2">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving…
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                    <Button variant="secondary" onClick={cancelEdit} className="gap-2">
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {error && (
                    <p className="text-sm text-destructive font-medium">{error}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2">{plotCards}</div>
            </div>
        </>
    );
}