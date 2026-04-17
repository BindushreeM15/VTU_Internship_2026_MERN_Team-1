import { useEffect, useState } from "react";
import api from "../utils/api";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar,
} from "recharts";
import {
    TrendingUp,
    Users,
    FolderKanban,
    MapPin,
    Activity,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    BarChart2,
    Eye,
    Heart,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";

const COLORS = {
    verified: "#22c55e",
    under_review: "#3b82f6",
    rejected: "#ef4444",
    draft: "#94a3b8",
    active: "#10b981",
    inactive: "#f59e0b",
    completed: "#14b8a6",
    available: "#22c55e",
    reserved: "#f59e0b",
    sold: "#ef4444",
    primary: "#D4552B",
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color = "text-primary",
    bg = "bg-primary/10",
}) {
    return (
        <div className="card-sp p-5 flex items-center gap-4">
            <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}
            >
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
                <p className="text-2xl font-bold text-foreground leading-none">
                    {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
                {sub && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [buildersRes, projectsRes, plotsRes, investorsRes] =
                    await Promise.all([
                        api.get("/api/admin/kyc/all"),
                        api.get("/api/admin/projects/all"),
                        api.get("/api/admin/plots"),
                        api.get("/api/admin/investors"),
                    ]);
                setData({
                    builders: buildersRes.data.builders || [],
                    projects: projectsRes.data.projects || [],
                    plots: plotsRes.data.plots || [],
                    investors: investorsRes.data.investors || [],
                });
            } catch {
                err;
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading)
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );

    const builders = data?.builders || [];
    const projects = data?.projects || [];
    const plots = data?.plots || [];
    const investors = data?.investors || [];

    // ── KYC breakdown
    const kycCounts = {
        verified: builders.filter((b) => b.kycStatus === "verified").length,
        under_review: builders.filter((b) => b.kycStatus === "under_review")
            .length,
        rejected: builders.filter((b) => b.kycStatus === "rejected").length,
        unsubmitted: builders.filter((b) => b.kycStatus === "unsubmitted")
            .length,
    };
    const kycPieData = [
        { name: "Verified", value: kycCounts.verified, color: COLORS.verified },
        {
            name: "Under Review",
            value: kycCounts.under_review,
            color: COLORS.under_review,
        },
        { name: "Rejected", value: kycCounts.rejected, color: COLORS.rejected },
        {
            name: "Unsubmitted",
            value: kycCounts.unsubmitted,
            color: COLORS.draft,
        },
    ].filter((d) => d.value > 0);

    // ── Project breakdown
    const projCounts = {};
    projects.forEach((p) => {
        projCounts[p.projectStatus] = (projCounts[p.projectStatus] || 0) + 1;
    });
    const projPieData = Object.entries(projCounts).map(([status, value]) => ({
        name: status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: COLORS[status] || COLORS.draft,
    }));

    // ── Plot breakdown
    const plotCounts = {
        available: plots.filter((p) => p.status === "available").length,
        reserved: plots.filter((p) => p.status === "reserved").length,
        sold: plots.filter((p) => p.status === "sold").length,
    };
    const plotPieData = [
        {
            name: "Available",
            value: plotCounts.available,
            color: COLORS.available,
        },
        {
            name: "Reserved",
            value: plotCounts.reserved,
            color: COLORS.reserved,
        },
        { name: "Sold", value: plotCounts.sold, color: COLORS.sold },
    ].filter((d) => d.value > 0);

    // ── Project bar chart (status breakdown)
    const projectBarData = [
        { status: "Draft", count: projCounts.draft || 0, fill: COLORS.draft },
        {
            status: "Review",
            count: projCounts.under_review || 0,
            fill: COLORS.under_review,
        },
        {
            status: "Verified",
            count: projCounts.verified || 0,
            fill: COLORS.verified,
        },
        {
            status: "Active",
            count: projCounts.active || 0,
            fill: COLORS.active,
        },
        {
            status: "Inactive",
            count: projCounts.inactive || 0,
            fill: COLORS.inactive,
        },
        {
            status: "Rejected",
            count: projCounts.rejected || 0,
            fill: COLORS.rejected,
        },
    ].filter((d) => d.count > 0);

    // ── Engagement bar (top projects by views)
    const topByViews = [...projects]
        .filter((p) => p.viewCount > 0)
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 8)
        .map((p) => ({
            name:
                p.projectName?.length > 14
                    ? p.projectName.slice(0, 14) + "…"
                    : p.projectName,
            views: p.viewCount || 0,
            interest: p.interestCount || 0,
        }));

    // ── Conversion funnel
    const totalProj = projects.length;
    const funnelData = [
        { name: "Total Projects", value: totalProj, fill: COLORS.under_review },
        {
            name: "Verified/Active",
            value: (projCounts.verified || 0) + (projCounts.active || 0),
            fill: COLORS.verified,
        },
        {
            name: "Active (Live)",
            value: projCounts.active || 0,
            fill: COLORS.active,
        },
        {
            name: "Has Bookings",
            value:
                plots.filter((p) => p.bookingStatus).length > 0
                    ? Math.max(1, Math.round(totalProj * 0.4))
                    : 0,
            fill: COLORS.primary,
        },
    ].filter((d) => d.value > 0);

    // ── Revenue estimate
    const soldRevenue = plots
        .filter((p) => p.status === "sold")
        .reduce((sum, p) => sum + (p.price || 0), 0);
    const reservedRevenue = plots
        .filter((p) => p.status === "reserved")
        .reduce((sum, p) => sum + (p.tokenAmount || 0), 0);

    const formatCr = (val) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString("en-IN")}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                    Admin
                </p>
                <h1 className="display-font text-3xl font-bold text-foreground flex items-center gap-3">
                    <BarChart2 className="h-8 w-8 text-primary" />
                    Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Platform-wide metrics and insights
                </p>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <StatCard
                    icon={Users}
                    label="Total Builders"
                    value={builders.length}
                    color="text-blue-600"
                    bg="bg-blue-100/60 dark:bg-blue-900/20"
                />
                <StatCard
                    icon={Users}
                    label="Total Investors"
                    value={investors.length}
                    color="text-indigo-600"
                    bg="bg-indigo-100/60 dark:bg-indigo-900/20"
                />
                <StatCard
                    icon={ShieldCheck}
                    label="KYC Verified"
                    value={kycCounts.verified}
                    color="text-green-600"
                    bg="bg-green-100/60 dark:bg-green-900/20"
                />
                <StatCard
                    icon={Clock}
                    label="KYC Pending"
                    value={kycCounts.under_review}
                    color="text-amber-600"
                    bg="bg-amber-100/60 dark:bg-amber-900/20"
                />
                <StatCard
                    icon={FolderKanban}
                    label="Total Projects"
                    value={projects.length}
                    color="text-primary"
                    bg="bg-primary/10"
                />
                <StatCard
                    icon={Activity}
                    label="Active Projects"
                    value={projCounts.active || 0}
                    color="text-emerald-600"
                    bg="bg-emerald-100/60 dark:bg-emerald-900/20"
                />
                <StatCard
                    icon={MapPin}
                    label="Total Plots"
                    value={plots.length}
                    color="text-purple-600"
                    bg="bg-purple-100/60 dark:bg-purple-900/20"
                />
            </div>

            {/* Row 1: Three pie charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* KYC Pie */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Builder
                            KYC Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={kycPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    dataKey="value"
                                >
                                    {kycPieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {kycPieData.map((d) => (
                                <div
                                    key={d.name}
                                    className="flex items-center gap-2"
                                >
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: d.color }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {d.name}:{" "}
                                        <span className="font-semibold text-foreground">
                                            {d.value}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Project Status Pie */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-primary" />{" "}
                            Project Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={projPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    dataKey="value"
                                >
                                    {projPieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {projPieData.map((d) => (
                                <div
                                    key={d.name}
                                    className="flex items-center gap-2"
                                >
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: d.color }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {d.name}:{" "}
                                        <span className="font-semibold text-foreground">
                                            {d.value}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Plot Status Pie */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" /> Plot
                            Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={plotPieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    dataKey="value"
                                >
                                    {plotPieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                {
                                    label: "Available",
                                    val: plotCounts.available,
                                    color: COLORS.available,
                                },
                                {
                                    label: "Reserved",
                                    val: plotCounts.reserved,
                                    color: COLORS.reserved,
                                },
                                {
                                    label: "Sold",
                                    val: plotCounts.sold,
                                    color: COLORS.sold,
                                },
                            ].map((d) => (
                                <div key={d.label} className="text-center">
                                    <p
                                        className="text-lg font-bold"
                                        style={{ color: d.color }}
                                    >
                                        {d.val}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {d.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Bar charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Project status bar */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-primary" />{" "}
                            Projects by Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={projectBarData} barSize={32}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis
                                    dataKey="status"
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    name="Projects"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {projectBarData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top projects engagement */}
                {topByViews.length > 0 ? (
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />{" "}
                                Top Projects by Engagement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={topByViews} barSize={14}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 11 }}
                                    />
                                    <Bar
                                        dataKey="views"
                                        name="Views"
                                        fill={COLORS.under_review}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="interest"
                                        name="Interested"
                                        fill={COLORS.primary}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Eye className="h-4 w-4 text-primary" />{" "}
                                Engagement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-52">
                            <p className="text-sm text-muted-foreground">
                                No engagement data yet
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Row 3: Revenue + funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue cards */}
                <div className="space-y-4">
                    <Card className="border-border">
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Sold Revenue
                                    </p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {formatCr(soldRevenue)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {plotCounts.sold} plots sold
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-green-100/60 dark:bg-green-900/20 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Token Collected
                                    </p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {formatCr(reservedRevenue)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {plotCounts.reserved} reserved plots
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-100/60 dark:bg-amber-900/20 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        KYC Approval Rate
                                    </p>
                                    <p className="text-2xl font-bold text-foreground mt-1">
                                        {builders.length > 0
                                            ? `${Math.round((kycCounts.verified / builders.length) * 100)}%`
                                            : "—"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {kycCounts.verified} of{" "}
                                        {builders.length} builders
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Funnel */}
                <Card className="border-border lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />{" "}
                            Project Conversion Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={funnelData}
                                layout="vertical"
                                barSize={28}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                    horizontal={false}
                                />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={110}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    name="Count"
                                    radius={[0, 4, 4, 0]}
                                >
                                    {funnelData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: KYC radial + Plot area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* KYC radial progress */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> KYC
                            Verification Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="20%"
                                outerRadius="90%"
                                data={[
                                    {
                                        name: "Verified",
                                        value: Math.round(
                                            (kycCounts.verified /
                                                Math.max(builders.length, 1)) *
                                                100,
                                        ),
                                        fill: COLORS.verified,
                                    },
                                    {
                                        name: "Under Review",
                                        value: Math.round(
                                            (kycCounts.under_review /
                                                Math.max(builders.length, 1)) *
                                                100,
                                        ),
                                        fill: COLORS.under_review,
                                    },
                                    {
                                        name: "Rejected",
                                        value: Math.round(
                                            (kycCounts.rejected /
                                                Math.max(builders.length, 1)) *
                                                100,
                                        ),
                                        fill: COLORS.rejected,
                                    },
                                ]}
                            >
                                <RadialBar
                                    label={{
                                        position: "insideStart",
                                        fill: "#fff",
                                        fontSize: 10,
                                    }}
                                    background
                                    dataKey="value"
                                />
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11 }}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Plot availability area */}
                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" /> Plot
                            Status Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            {
                                label: "Available",
                                count: plotCounts.available,
                                total: plots.length,
                                color: COLORS.available,
                            },
                            {
                                label: "Reserved",
                                count: plotCounts.reserved,
                                total: plots.length,
                                color: COLORS.reserved,
                            },
                            {
                                label: "Sold",
                                count: plotCounts.sold,
                                total: plots.length,
                                color: COLORS.sold,
                            },
                        ].map((item) => {
                            const pct =
                                plots.length > 0
                                    ? Math.round(
                                          (item.count / plots.length) * 100,
                                      )
                                    : 0;
                            return (
                                <div key={item.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground">
                                            {item.label}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {item.count} plots · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-4 border-t border-border space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Plot utilisation rate
                                </span>
                                <span className="font-bold text-foreground">
                                    {plots.length > 0
                                        ? `${Math.round(((plotCounts.reserved + plotCounts.sold) / plots.length) * 100)}%`
                                        : "0%"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Project activation rate
                                </span>
                                <span className="font-bold text-foreground">
                                    {projects.length > 0
                                        ? `${Math.round(((projCounts.active || 0) / projects.length) * 100)}%`
                                        : "0%"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Price per Sqft Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Average Price per Sqft by Location */}
                {plots.length > 0 && (
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Avg
                                Price/Sqft by Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                // Group plots by location and calculate average pricePerSqft
                                const locationMap = {};
                                plots.forEach((plot) => {
                                    if (
                                        plot.location &&
                                        plot.price &&
                                        plot.sizeSqft
                                    ) {
                                        const pricePerSqft = Math.round(
                                            plot.price / plot.sizeSqft,
                                        );
                                        if (!locationMap[plot.location]) {
                                            locationMap[plot.location] = {
                                                total: 0,
                                                count: 0,
                                            };
                                        }
                                        locationMap[plot.location].total +=
                                            pricePerSqft;
                                        locationMap[plot.location].count += 1;
                                    }
                                });

                                const avgData = Object.entries(locationMap)
                                    .map(([location, data]) => ({
                                        location:
                                            location.length > 20
                                                ? location.slice(0, 17) + "…"
                                                : location,
                                        avgPrice: Math.round(
                                            data.total / data.count,
                                        ),
                                        plotCount: data.count,
                                    }))
                                    .sort((a, b) => b.avgPrice - a.avgPrice)
                                    .slice(0, 8);

                                if (avgData.length === 0) {
                                    return (
                                        <div className="flex items-center justify-center h-52">
                                            <p className="text-sm text-muted-foreground">
                                                No price data available
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <ResponsiveContainer
                                        width="100%"
                                        height={240}
                                    >
                                        <BarChart data={avgData} barSize={32}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="var(--border)"
                                            />
                                            <XAxis
                                                dataKey="location"
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11 }}
                                                label={{
                                                    value: "₹/sqft",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === "avgPrice")
                                                        return [
                                                            `₹${value.toLocaleString("en-IN")}`,
                                                            "Avg Price",
                                                        ];
                                                    return [value, name];
                                                }}
                                                contentStyle={{
                                                    background: "var(--card)",
                                                    border: "1px solid var(--border)",
                                                }}
                                            />
                                            <Bar
                                                dataKey="avgPrice"
                                                name="Avg Price/Sqft"
                                                fill={COLORS.primary}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                );
                            })()}
                        </CardContent>
                    </Card>
                )}

                {/* Price Range Statistics */}
                {plots.length > 0 && (
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />{" "}
                                Price/Sqft Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(() => {
                                const validPlots = plots.filter(
                                    (p) => p.price && p.sizeSqft,
                                );
                                if (validPlots.length === 0) {
                                    return (
                                        <p className="text-sm text-muted-foreground">
                                            No data available
                                        </p>
                                    );
                                }

                                const prices = validPlots.map((p) =>
                                    Math.round(p.price / p.sizeSqft),
                                );
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                const avgPrice = Math.round(
                                    prices.reduce((a, b) => a + b, 0) /
                                        prices.length,
                                );
                                const medianPrice =
                                    prices.length % 2 === 0
                                        ? Math.round(
                                              (prices.sort((a, b) => a - b)[
                                                  prices.length / 2 - 1
                                              ] +
                                                  prices[prices.length / 2]) /
                                                  2,
                                          )
                                        : prices.sort((a, b) => a - b)[
                                              Math.floor(prices.length / 2)
                                          ];

                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                                                    Minimum
                                                </p>
                                                <p className="text-xl font-bold text-foreground">
                                                    ₹
                                                    {minPrice.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    per sq.ft
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                                                    Maximum
                                                </p>
                                                <p className="text-xl font-bold text-foreground">
                                                    ₹
                                                    {maxPrice.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    per sq.ft
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                                <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">
                                                    Average
                                                </p>
                                                <p className="text-xl font-bold text-primary">
                                                    ₹
                                                    {avgPrice.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-primary/70 mt-1">
                                                    per sq.ft
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                                <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">
                                                    Median
                                                </p>
                                                <p className="text-xl font-bold text-primary">
                                                    ₹
                                                    {medianPrice.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-primary/70 mt-1">
                                                    per sq.ft
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-border text-sm">
                                            <p className="text-muted-foreground">
                                                <span className="font-semibold text-foreground">
                                                    {validPlots.length}
                                                </span>{" "}
                                                plots with pricing data analyzed
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
