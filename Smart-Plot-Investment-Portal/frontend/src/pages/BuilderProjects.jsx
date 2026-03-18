import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Trash2, Pencil, Loader2, X, AlertTriangle } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import api from "../utils/api";
import MapComponent from "../components/MapComponent";
import { Upload } from "lucide-react";

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
                        <h3 className="font-semibold text-foreground">
                            Delete Project
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {project.projectName}
                            </span>
                            ? All associated plots will also be removed. This
                            action cannot be undone.
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
    const fileInputRef = useRef(null);

    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const [form, setForm] = useState({
        projectName: "",
        location: "",
        latitude: "",
        longitude: "",
        description: "",
        amenities: "",
        images: [],
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

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "images") {
            setForm({ ...form, images: Array.from(files) });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles([...e.target.files]);
        handleChange(e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !form.projectName.trim() ||
            !form.location.trim() ||
            !form.description.trim()
        )
            return;

        const formData = new FormData();
        formData.append("projectName", form.projectName);
        formData.append("location", form.location);
        formData.append("latitude", form.latitude);
        formData.append("longitude", form.longitude);
        formData.append("description", form.description);
        formData.append(
            "amenities",
            JSON.stringify(
                form.amenities
                    .split(",")
                    .map((a) => a.trim())
                    .filter((a) => a),
            ),
        );

        form.images.forEach((image) => {
            formData.append("images", image);
        });

        try {
            await api.post("/api/projects/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setForm({
                projectName: "",
                location: "",
                latitude: "",
                longitude: "",
                description: "",
                amenities: "",
                images: [],
            });
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
            latitude: project.latitude || "",
            longitude: project.longitude || "",
            description: project.description,
            amenities: project.amenities ? project.amenities.join(", ") : "",
            images: [],
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            projectName: "",
            location: "",
            latitude: "",
            longitude: "",
            description: "",
            amenities: "",
            images: [],
        });
    };

    const handleUpdate = async () => {
        if (!editingId) return;

        const formData = new FormData();
        formData.append("projectId", editingId);
        formData.append("projectName", form.projectName);
        formData.append("location", form.location);
        formData.append("latitude", form.latitude);
        formData.append("longitude", form.longitude);
        formData.append("description", form.description);
        formData.append(
            "amenities",
            JSON.stringify(
                form.amenities
                    .split(",")
                    .map((a) => a.trim())
                    .filter((a) => a),
            ),
        );

        form.images.forEach((image) => {
            formData.append("images", image);
        });

        try {
            await api.put("/api/projects/update-project", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setEditingId(null);
            setForm({
                projectName: "",
                location: "",
                latitude: "",
                longitude: "",
                description: "",
                amenities: "",
                images: [],
            });
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

                    {/* Project Images */}
                    {project.images && project.images.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                                Project Images
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {project.images
                                    .slice(0, 4)
                                    .map((image, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-center p-2"
                                        >
                                            <img
                                                src={`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/${image}`}
                                                alt={`Project ${index + 1}`}
                                                className="w-60 h-40 object-cover rounded-md border"
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Amenities */}
                    {project.amenities && project.amenities.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                                Amenities
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {project.amenities.map((amenity, index) => (
                                    <Badge
                                        key={index}
                                        variant="default"
                                        className="text-xs capitalize"
                                    >
                                        {amenity}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    {project.latitude && project.longitude && (
                        <div className="mt-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                                Location
                            </p>
                            <MapComponent
                                latitude={project.latitude}
                                longitude={project.longitude}
                                projectName={project.projectName}
                            />
                        </div>
                    )}

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
                            onSubmit={
                                editingId
                                    ? (e) => {
                                          e.preventDefault();
                                          handleUpdate();
                                      }
                                    : handleSubmit
                            }
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
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Latitude
                                    </label>
                                    <Input
                                        name="latitude"
                                        type="number"
                                        step="any"
                                        value={form.latitude}
                                        onChange={handleChange}
                                        placeholder="e.g. 12.9716"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Longitude
                                    </label>
                                    <Input
                                        name="longitude"
                                        type="number"
                                        step="any"
                                        value={form.longitude}
                                        onChange={handleChange}
                                        placeholder="e.g. 77.5946"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                        Amenities
                                    </label>
                                    <Input
                                        name="amenities"
                                        value={form.amenities}
                                        onChange={handleChange}
                                        placeholder="park, water, security (comma separated)"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-wide uppercase text-muted-foreground font-medium">
                                    Project Images
                                </label>

                                {/* Hidden Input */}
                                <input
                                    ref={fileInputRef}
                                    name="images"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {/* Custom Button */}
                                <div className="flex gap-2 w-full items-center flex-wrap p-1 border rounded-lg">
                                <Button
                                    type="button"
                                    // variant="outline"
                                    onClick={handleButtonClick}
                                    className="flex items-center justify-center gap-2 border-primary/40 hover:border-primary hover:bg-primary/5"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Image
                                </Button>
                                {selectedFiles.length > 0 && (
                                    <div className="text-base text-muted-foreground space-y-1">
                                        {selectedFiles.map((file, i) => (
                                            <p key={i}>{file.name}</p>
                                        ))}
                                    </div>
                                )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingId
                                                ? "Updating…"
                                                : "Creating…"}
                                        </>
                                    ) : (
                                        <>
                                            {editingId ? (
                                                <Pencil className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                            {editingId
                                                ? "Update Project"
                                                : "Create Project"}
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
                    <p className="text-sm text-destructive font-medium">
                        {error}
                    </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">{projectCards}</div>
            </div>
        </>
    );
}
