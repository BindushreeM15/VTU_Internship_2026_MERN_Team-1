import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "sonner";
import {
  BookmarkCheck, Building2, MapPin, Heart, Eye,
  ArrowRight, Loader2, Bookmark,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge }  from "../components/ui/badge";

const formatPrice = (price) => {
  if (!price && price !== 0) return "—";
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000)   return `₹${(price / 100000).toFixed(1)}L`;
  return `₹${Number(price).toLocaleString("en-IN")}`;
};

export default function SavedProjects() {
  const navigate    = useNavigate();
  const [saved,     setSaved]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/api/interests/my-saved")
      .then((r) => setSaved(r.data.saved || []))
      .catch(() => toast.error("Failed to load saved projects"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUnsave = async (projectId) => {
    try {
      await api.post(`/api/interests/${projectId}/toggle`);
      setSaved((prev) => prev.filter((p) => p._id !== projectId));
      toast.success("Removed from saved projects");
    } catch (err) {
      toast.error("Failed to unsave");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">Investor</p>
        <h1 className="display-font text-3xl font-bold text-foreground flex items-center gap-3">
          <BookmarkCheck className="h-8 w-8 text-primary" />
          Saved Projects
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projects you've saved for later review.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Bookmark className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-medium text-foreground">No saved projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse projects and click the Save button to add them here.
            </p>
          </div>
          <Button onClick={() => navigate("/")} className="gap-2 mt-2">
            Browse Projects <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((project) => (
            <div
              key={project._id}
              className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="h-44 bg-muted relative overflow-hidden">
                {project.sketchImage || project.projectImages?.[0] ? (
                  <img
                    src={project.sketchImage?.url || project.projectImages[0]?.url}
                    alt={project.projectName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary/40">
                        {project.builderId?.companyName?.slice(0, 2).toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{project.projectName}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" /> {project.builderId?.companyName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary" /> {project.location}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {project.viewCount || 0}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {project.interestCount || 0}</span>
                </div>

                {project.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.amenities.slice(0, 2).map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                    ))}
                    {project.amenities.length > 2 && <Badge variant="secondary" className="text-[10px]">+{project.amenities.length - 2}</Badge>}
                  </div>
                )}

                <div className="flex gap-2 pt-1 mt-auto">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnsave(project._id)}
                    className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    <Heart className="h-3.5 w-3.5" /> Unsave
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
