import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    ArrowRight,
    Layers,
    Grid,
    Building,
    MapPin,
    CheckCircle,
} from "lucide-react";
import api from "../utils/api";

export default function BuilderDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalProjects: 0,
        totalPlots: 0,
        availablePlots: 0,
        reservedPlots: 0,
        soldPlots: 0,
    });
    const [loading, setLoading] = useState(true);

    const activeTab = location.pathname.includes("plots")
        ? "plots"
        : "projects";

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [projectsRes, plotsRes] = await Promise.all([
                api.get("/api/projects/my-projects"),
                api.get("/api/projects/all-plots"),
            ]);

            const projects = projectsRes.data.projects || [];
            const plots = plotsRes.data.plots || [];

            const reservedPlots = plots.filter(
                (plot) => plot.status === "reserved",
            ).length;
            const soldPlots = plots.filter(
                (plot) => plot.status === "sold",
            ).length;

            setStats({
                totalProjects: projects.length,
                totalPlots: plots.length,
                availablePlots: plots.filter(
                    (plot) => plot.status === "available",
                ).length,
                reservedPlots,
                soldPlots,
            });
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="display-font text-4xl font-bold text-foreground tracking-tight">
                        Builder Hub
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm max-w-xl">
                        Manage your projects and plot listings from one place.
                        Create a new project, update details, or work with plots
                        all from here.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    className="uppercase text-xs tracking-wider"
                    onClick={() => navigate("/dashboard/builder/projects")}
                >
                    <Grid className="h-4 w-4" />
                    Projects
                </Button>
            </div>

            <Card className="border-border bg-card/70 backdrop-blur-sm shadow-sm shadow-primary/5">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl">
                                Builder Dashboard
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Use the tabs below to switch between projects
                                and plots.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                label: "Total Projects",
                                value: stats.totalProjects,
                                icon: Building,
                                color: "from-blue-500/20 to-blue-500/5 text-blue-500",
                            },
                            {
                                label: "Total Plots",
                                value: stats.totalPlots,
                                icon: MapPin,
                                color: "from-purple-500/20 to-purple-500/5 text-purple-500",
                            },
                            {
                                label: "Available",
                                value: stats.availablePlots,
                                icon: CheckCircle,
                                color: "from-green-500/20 to-green-500/5 text-green-500",
                            },
                            {
                                label: "Reserved",
                                value: stats.reservedPlots,
                                icon: CheckCircle,
                                color: "from-yellow-500/20 to-yellow-500/5 text-yellow-500",
                            },
                            {
                                label: "Sold",
                                value: stats.soldPlots,
                                icon: CheckCircle,
                                color: "from-red-500/20 to-red-500/5 text-red-500",
                            },
                        ].map((item, i) => (
                            <Card
                                key={i}
                                className="group relative overflow-hidden border-border bg-card/60 backdrop-blur-sm 
      hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Glow Background */}
                                <div
                                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br ${item.color}`}
                                />

                                {/* Shine Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                                    <div className="absolute -left-1/2 top-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 animate-[shine_1.2s_ease]"></div>
                                </div>

                                <CardContent className="relative pt-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`rounded-xl p-3 bg-gradient-to-br ${item.color} shadow-inner`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-3xl font-bold tracking-tight text-foreground">
                                                {loading ? "..." : item.value}
                                            </p>

                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                                {item.label}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            navigate(
                                value === "projects"
                                    ? "/dashboard/builder/projects"
                                    : "/dashboard/builder/projects/plots",
                            )
                        }
                    >
                        <TabsList className="mb-4">
                            <TabsTrigger value="projects" className="text-sm">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    Projects
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="plots" className="text-sm">
                                <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    Plots
                                </div>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Outlet />
                </CardContent>
            </Card>
        </div>
    );
}
