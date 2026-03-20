import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge }  from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Layers, Grid, AlertCircle, Clock, XCircle, ShieldCheck,
  ChevronRight, FolderKanban, MapPin, CheckCircle2, Ban, TrendingUp,
} from "lucide-react";
import api from "../utils/api";

const parseJwt = (token) => {
  try {
    const p = token.split(".")[1];
    return p ? JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/"))) : null;
  } catch { return null; }
};

function KYCBanner({ kycStatus, companyName, onVerifyClick }) {
  if (kycStatus === "verified") return null;
  const configs = {
    unsubmitted:  { icon: AlertCircle, cls: "border-amber-300/40 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300", msg: `Verify ${companyName} to unlock all features.`, action: "Verify Now" },
    under_review: { icon: Clock,       cls: "border-blue-300/40 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300",  msg: "Company documents are under admin review.", action: "View Status" },
    rejected:     { icon: XCircle,     cls: "border-red-300/40 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300",    msg: "KYC was rejected. Resubmit corrected documents.", action: "Resubmit" },
  };
  const cfg  = configs[kycStatus];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${cfg.cls}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{cfg.msg}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onVerifyClick} className="shrink-0 gap-1 text-xs border-current hover:bg-transparent">
        {cfg.action} <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BuilderDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const token      = localStorage.getItem("token");
  const payload    = parseJwt(token);
  const kycStatus  = payload?.kycStatus   || "unsubmitted";
  const companyName= payload?.companyName || "your company";
  const isVerified = kycStatus === "verified";

  const [stats, setStats] = useState({ projects: 0, plots: 0, available: 0, blocked: 0, sold: 0 });

  useEffect(() => {
    if (!isVerified) return;
    const fetchStats = async () => {
      try {
        const [projRes, plotsRes] = await Promise.all([
          api.get("/api/projects/my-projects"),
          api.get("/api/projects/plots/all"),
        ]);
        const plots = plotsRes.data.plots || [];
        setStats({
          projects:  projRes.data.projects?.length || 0,
          plots:     plots.length,
          available: plots.filter((p) => p.status === "available").length,
          blocked:   plots.filter((p) => p.status === "blocked").length,
          sold:      plots.filter((p) => p.status === "sold").length,
        });
      } catch (_) {}
    };
    fetchStats();
  }, [isVerified]);

  const isOnPlots    = location.pathname.includes("plots");
  const activeTab    = isOnPlots ? "plots" : "projects";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* KYC banner */}
      <KYCBanner
        kycStatus={kycStatus}
        companyName={companyName}
        onVerifyClick={() => navigate("/dashboard/builder/kyc")}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">Builder</p>
          <h1 className="display-font text-3xl font-bold text-foreground">Builder Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your projects and plot inventory.</p>
        </div>
        {isVerified && (
          <Badge className="gap-1.5 bg-green-500/10 text-green-700 border border-green-400/30 text-xs dark:text-green-400 dark:border-green-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            {companyName} Verified
          </Badge>
        )}
      </div>

      {/* Stats grid */}
      {isVerified && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={FolderKanban}  label="Total Projects" value={stats.projects} color="text-primary" />
          <StatCard icon={MapPin}        label="Total Plots"    value={stats.plots}    color="text-primary" />
          <StatCard icon={CheckCircle2}  label="Available"      value={stats.available} color="text-green-600 dark:text-green-400" />
          <StatCard icon={Clock}         label="Reserved"       value={stats.blocked}   color="text-amber-600 dark:text-amber-400" />
          <StatCard icon={TrendingUp}    label="Sold"           value={stats.sold}      color="text-blue-600 dark:text-blue-400" />
        </div>
      )}

      {/* Main content card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isVerified ? "Dashboard" : "Complete Verification"}
            </CardTitle>
            {isVerified && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => navigate("/dashboard/builder/projects")}
              >
                <Grid className="h-3.5 w-3.5" /> All Projects
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {!isVerified ? (
            <Alert className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                {kycStatus === "under_review"
                  ? "Your verification is under review. You can access all features once approved."
                  : "Complete company verification to create projects and manage plots."}
                {kycStatus !== "under_review" && (
                  <button
                    onClick={() => navigate("/dashboard/builder/kyc")}
                    className="ml-1.5 text-primary font-medium underline underline-offset-2"
                  >
                    Start verification →
                  </button>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  navigate(v === "projects"
                    ? "/dashboard/builder/projects"
                    : "/dashboard/builder/projects/plots")
                }
              >
                <TabsList className="mb-2">
                  <TabsTrigger value="projects" className="gap-2 text-sm">
                    <Layers className="h-4 w-4" /> Projects
                  </TabsTrigger>
                  <TabsTrigger value="plots" className="gap-2 text-sm">
                    <Grid className="h-4 w-4" /> Plots
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Outlet */}
              <Outlet />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
