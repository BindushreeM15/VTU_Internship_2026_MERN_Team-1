import { useEffect, useState } from "react";
import api from "../utils/api";
import {
  AlertCircle, TrendingUp, Activity, Clock,
  FolderKanban, MapPin, ArrowUpRight, UserCircle2,
  Phone, BadgeCheck, Building2, ShieldCheck, KeyRound,
  Pencil, X, Check, Loader2, Eye, EyeOff,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Badge }     from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Button }    from "../components/ui/button";
import { Link }      from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────
const roleConfig = {
  investor: { icon: "◈", label: "Investor", desc: "Browse & invest in plots" },
  builder:  { icon: "◉", label: "Builder",  desc: "Manage your listings" },
  admin:    { icon: "◎", label: "Admin",     desc: "Platform administration" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-56 rounded-md" />
        <Skeleton className="h-3 w-40 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card-sp px-5 py-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)" }}>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="display-font text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-2 gap-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs tracking-wider uppercase">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground text-right">{children || "—"}</div>
    </div>
  );
}

// ── Password input ────────────────────────────────────────────────────────────
function PasswordInput({ name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name} type={show ? "text" : "password"}
        value={value} onChange={onChange} placeholder={placeholder}
        className="form-input pr-9"
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────────────────────────
function ProfileCard({ user, role, onUserUpdate }) {
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [form, setForm] = useState({
    name:        user?.name        || "",
    phone:       user?.phone       || "",
    companyName: user?.companyName || "",
  });

  useEffect(() => {
    setForm({ name: user?.name||"", phone: user?.phone||"", companyName: user?.companyName||"" });
  }, [user]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setFormError("Name and phone are required."); return; }
    setSaving(true); setFormError(null);
    try {
      const endpoint = user.role === "builder" ? "/api/builders/update-profile" : "/api/auth/update-profile";
      const res = await api.put(endpoint, form);
      onUserUpdate(res.data.user);
      setFormSuccess("Profile updated.");
      setEditing(false);
      setTimeout(() => setFormSuccess(null), 3000);
    } catch(err) {
      setFormError(err.response?.data?.error || "Failed to update.");
    } finally { setSaving(false); }
  };

  const cancelEdit = () => {
    setForm({ name:user?.name||"", phone:user?.phone||"", companyName:user?.companyName||"" });
    setFormError(null); setEditing(false);
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)", color:"var(--primary)" }}>
              {role?.icon || "◈"}
            </div>
            <div>
              <CardTitle className="display-font text-lg font-bold">Your Profile</CardTitle>
              <CardDescription>Account information</CardDescription>
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-1">
        {!editing ? (
          <>
            <InfoRow icon={UserCircle2} label="Name">{user.name}</InfoRow>
            <InfoRow icon={Phone} label="Phone">{user.phone}</InfoRow>
            <InfoRow icon={BadgeCheck} label="Role">
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px] tracking-wider uppercase">
                {user.role}
              </Badge>
            </InfoRow>
            {user.role === "builder" && user.companyName && (
              <InfoRow icon={Building2} label="Company">{user.companyName}</InfoRow>
            )}
            {role && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 mt-2"
                style={{ background:"color-mix(in srgb, var(--primary) 8%, transparent)", border:"1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-primary">{role.desc}</span>
              </div>
            )}
            {formSuccess && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1.5 mt-2">
                <Check className="h-3.5 w-3.5" />{formSuccess}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3 pt-1">
            <div>
              <label className="form-label">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-input mt-1" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="form-input mt-1" />
            </div>
            {user.role === "builder" && (
              <div>
                <label className="form-label">Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} className="form-input mt-1" />
              </div>
            )}
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Change password card ───────────────────────────────────────────────────────
function ChangePasswordCard({ user }) {
  const [form, setForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required."); return;
    }
    setSaving(true); setError(null);
    try {
      const endpoint = user.role === "builder" ? "/api/builders/update-profile" : "/api/auth/update-profile";
      await api.put(endpoint, form);
      setSuccess("Password changed.");
      setForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
      setTimeout(() => setSuccess(null), 3000);
    } catch(err) {
      setError(err.response?.data?.error || "Failed.");
    } finally { setSaving(false); }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)" }}>
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="display-font text-lg font-bold">Change Password</CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="form-label">Current Password</label>
            <PasswordInput name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Current password" />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <PasswordInput name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="New password (min 6 chars)" />
          </div>
          <div>
            <label className="form-label">Confirm Password</label>
            <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
          </div>
          {error   && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" />{success}</p>}
          <Button type="submit" size="sm" disabled={saving} className="gap-1.5 mt-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Quick actions card ────────────────────────────────────────────────────────
function QuickActionsCard({ role }) {
  const links = {
    builder: [
      { to:"/dashboard/builder/projects", icon:FolderKanban, label:"My Projects" },
      { to:"/dashboard/builder/projects/plots", icon:MapPin, label:"Manage Plots" },
    ],
    investor: [
      { to:"/projects",        icon:Activity,    label:"Browse Projects" },
      { to:"/saved-projects",  icon:TrendingUp,  label:"Saved Projects" },
    ],
    admin: [
      { to:"/dashboard/admin", icon:ShieldCheck, label:"Admin Panel" },
    ],
  };

  const items = links[role] || [];
  if (!items.length) return null;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="display-font text-lg font-bold">Quick Actions</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 space-y-1">
        {items.map(l => (
          <Button key={l.to} asChild variant="ghost" className="w-full justify-between group text-sm font-normal h-10">
            <Link to={l.to}>
              <div className="flex items-center gap-2">
                <l.icon className="h-4 w-4 text-primary" />
                <span>{l.label}</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);
  const [user,      setUser]      = useState(null);
  const [stats,     setStats]     = useState({ plotCount:0, projectCount:0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/protected");
        setUser(res.data.user);
        if (res.data.user?.role === "builder") {
          try {
            const [plotsRes, projRes] = await Promise.all([
              api.get("/api/projects/plots/all"),
              api.get("/api/projects/my-projects"),
            ]);
            setStats({
              plotCount:    plotsRes.data.plots?.length    ?? 0,
              projectCount: projRes.data.projects?.length  ?? 0,
            });
          } catch { /* stats optional */ }
        }
      } catch(err) {
        setError(err.response?.data?.error || "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const role = user ? roleConfig[user.role] || roleConfig.investor : null;

  const statCards = user?.role === "builder"
    ? [
        { icon:FolderKanban, label:"Total Projects", value:String(stats.projectCount), sub:"Active listings" },
        { icon:MapPin,       label:"Total Plots",    value:String(stats.plotCount),    sub:"Across all projects" },
        { icon:Clock,        label:"Member Since",   value:formatDate(user?.createdAt), sub:"Account age" },
      ]
    : [
        { icon:TrendingUp, label:"Portfolio Value", value:"₹0",  sub:"No investments yet" },
        { icon:Activity,   label:"Active Plots",    value:"0",   sub:"Plots tracked" },
        { icon:Clock,      label:"Member Since",    value:formatDate(user?.createdAt), sub:"Account age" },
      ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="anim-fadeup delay-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
            {getGreeting()}
          </p>
          <h1 className="display-font text-3xl font-bold text-foreground tracking-tight">
            {user?.name || "Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user?.role === "builder" && user?.companyName
              ? `${user.companyName} · ${role?.desc}`
              : role?.desc}
          </p>
        </div>
        {role && (
          <Badge variant="outline"
            className="text-primary border-primary/30 text-[10px] tracking-widest uppercase px-4 py-2 flex items-center gap-2 w-fit">
            <span className="shimmer w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            {role.icon} {role.label}
          </Badge>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Stat strip */}
          <div className="anim-fadeup delay-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Cards grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {user && (
              <ProfileCard
                user={user} role={role}
                onUserUpdate={updated => setUser(prev => ({ ...prev, ...updated }))}
              />
            )}
            {user && <ChangePasswordCard user={user} />}
            <QuickActionsCard role={user?.role} />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
          SmartPlot · Secure Session
        </p>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-[10px] tracking-wider uppercase">RERA Compliant</Badge>
          <Badge variant="secondary" className="text-[10px] tracking-wider uppercase">SEBI Registered</Badge>
        </div>
      </div>
    </div>
  );
}
