import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight, Layers, Grid } from "lucide-react";

export default function BuilderDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname.includes("plots") ? "plots" : "projects";

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
