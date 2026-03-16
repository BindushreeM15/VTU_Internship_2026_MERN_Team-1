import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import api from "../utils/api";

// ── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ project, onConfirm, onCancel }) {
    if (!project) return null;
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
                        <h3 className="font-semibold text-foreground">Delete Project</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {project.projectName}
                            </span>
                            ? All associated plots will also be removed. This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>
                        Delete Project
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BuilderProjects() {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        projectName: "",
        location: "",
        description: "",
    });
    const [editingId, setEditingId] = useState(null);

    // Project pending deletion (drives modal)
    const [deletingProject, setDeletingProject] = useState(null);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/api/projects/my-projects");
            setProjects(res.data.projects || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load projects");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.projectName.trim() || !form.location.trim() || !form.description.trim()) return;
        try {
            await api.post("/api/projects/create", form);
            setForm({ projectName: "", location: "", description: "" });
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create project");
        }
    };

    const confirmDelete = async () => {
        if (!deletingProject) return;
        try {
            await api.delete("/api/projects/delete-project", {
                data: { projectId: deletingProject._id },
            });
            setDeletingProject(null);
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete project");
            setDeletingProject(null);
        }
    };

    const startEdit = (project) => {
        setEditingId(project._id);
        setForm({
            projectName: project.projectName,
            location: project.location,
            description: project.description,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ projectName: "", location: "", description: "" });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            await api.put("/api/projects/update-project", {
                projectId: editingId,
                ...form,
            });
            setEditingId(null);
            setForm({ projectName: "", location: "", description: "" });
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update project");
        }
    };

    const projectCards = useMemo(() => {
        if (!projects.length) {
            return (
                <p className="text-sm text-muted-foreground">
                    No projects yet. Create one to get started.
                </p>
            );
        }

        return projects.map((project) => (
            <Card
                key={project._id}
                className="group relative border-border bg-card/70 hover:border-primary/30 hover:shadow-lg transition-all"
            >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="relative pt-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {project.projectName}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {project.location}
                            </p>
                        </div>
                        <Badge className="uppercase text-xs tracking-wider">
                            {project.status}
                        </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(project)}
                            className="gap-1.5"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingProject(project)}
                            className="gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ));
    }, [projects]);

    return (
        <>
            {/* Delete confirmation modal */}
            <DeleteModal
                project={deletingProject}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingProject(null)}
            />

            <div className="space-y-6">
                <Card className="border-border bg-card/70 shadow-sm shadow-primary/5">
                    <CardHeader>
                        <CardTitle>
                            {editingId ? (
                                <span className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4 text-primary" />
                                    Edit Project
                                </span>
                            ) : (
                                "New Project"
                            )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {editingId
                                ? "Update the project details below."
                                : "Create a new project to start adding plots."}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(); } : handleSubmit}
                            className="grid gap-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Project Name
                                    </label>
                                    <Input
                                        name="projectName"
                                        value={form.projectName}
                                        onChange={handleChange}
                                        placeholder="e.g. Sunrise Estates"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Location
                                    </label>
                                    <Input
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        placeholder="City, State"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Description
                                    </label>
                                    <Input
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Short project description"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={isLoading} className="gap-2">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingId ? "Updating…" : "Creating…"}
                                        </>
                                    ) : (
                                        <>
                                            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                            {editingId ? "Update Project" : "Create Project"}
                                        </>
                                    )}
                                </Button>
                                {editingId && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={cancelEdit}
                                        className="gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {error && (
                    <p className="text-sm text-destructive font-medium">{error}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2">{projectCards}</div>
            </div>
        </>
    );
}