import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight, Layers, Grid, Building, MapPin, CheckCircle } from "lucide-react";
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

    const activeTab = location.pathname.includes("plots") ? "plots" : "projects";

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

            const reservedPlots = plots.filter(plot => plot.status === 'reserved').length;
            const soldPlots = plots.filter(plot => plot.status === 'sold').length;

            setStats({
                totalProjects: projects.length,
                totalPlots: plots.length,
                availablePlots: plots.filter(plot => plot.status === 'available').length,
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
                        Manage your projects and plot listings from one place. Create a
                        new project, update details, or work with plots all from here.
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
                            <CardTitle className="text-xl">Builder Dashboard</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Use the tabs below to switch between projects and plots.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-border bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <Building className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {loading ? "..." : stats.totalProjects}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Total Projects
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {loading ? "..." : stats.totalPlots}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Total Plots
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {loading ? "..." : stats.availablePlots}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Available Plots
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-secondary/10 p-2">
                                        <CheckCircle className="h-5 w-5 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {loading ? "..." : stats.reservedPlots}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Reserved Plots
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-destructive/10 p-2">
                                        <CheckCircle className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {loading ? "..." : stats.soldPlots}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                            Sold Plots
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
