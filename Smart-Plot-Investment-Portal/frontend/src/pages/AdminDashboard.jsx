import { useEffect, useState } from "react";
import api from "../utils/api";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, Users, FolderKanban,
  ExternalLink, Loader2, ChevronDown, ChevronUp,
  Rocket, PowerOff, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge }  from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

// ── Shared colour maps ────────────────────────────────────────────────────────
const KYC_COLOR = {
  unsubmitted:  "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600",
  under_review: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700",
  verified:     "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-700",
  rejected:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700",
};
const PROJ_COLOR = {
  draft:        "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600",
  under_review: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700",
  verified:     "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700",
  rejected:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700",
  active:       "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-700",
  inactive:     "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700",
  completed:    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-700",
};

// ── Reject / reason modal ─────────────────────────────────────────────────────
function ReasonModal({ open, title, onConfirm, onCancel, optional = false }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={optional ? "Reason (optional)…" : "Provide a clear reason…"}
          rows={4}
          className="form-input resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => { setReason(""); onCancel(); }}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!optional && !reason.trim()}
            onClick={() => { onConfirm(reason.trim()); setReason(""); }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Doc list ──────────────────────────────────────────────────────────────────
function DocList({ docs = [], kathaDocument, kathaType }) {
  if (!docs.length && !kathaDocument) {
    return <p className="text-xs text-muted-foreground">No documents uploaded.</p>;
  }
  return (
    <div className="space-y-1 mt-2">
      {docs.map(doc => (
        <div key={doc.docType} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
          <span className="text-sm text-foreground">{doc.label}</span>
          <a href={doc.fileUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-primary underline underline-offset-2">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ))}
      {kathaDocument && (
        <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
          <span className="text-sm text-foreground">Katha Certificate (Type {kathaType})</span>
          <a href={kathaDocument.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-primary underline underline-offset-2">
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// ── Builder KYC card ──────────────────────────────────────────────────────────
function BuilderKYCCard({ builder, onApprove, onReject, showActions = false }) {
  const [expanded, setExpanded] = useState(false);
  // Show approve/reject if kycStatus is under_review OR if we're on the pending tab (showActions=true)
  const canAct = showActions || builder.kycStatus === "under_review";
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">{builder.companyName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {builder.name} · {builder.email} · {builder.phone}
            </p>
            {builder.kycSubmittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(builder.kycSubmittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
              </p>
            )}
            {builder.kycVerifiedAt && (
              <p className="text-xs text-muted-foreground">
                Verified: {new Date(builder.kycVerifiedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
              </p>
            )}
            {builder.kycRejectionReason && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Rejection: {builder.kycRejectionReason}
              </p>
            )}
          </div>
          {canAct && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => onApprove(builder._id)} className="gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(builder._id)} className="gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          )}
        </div>

        {/* Expandable docs — visible always if docs exist */}
        {builder.kycDocuments?.length > 0 && (
          <>
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary font-medium">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Hide" : "View"} Documents ({builder.kycDocuments.length})
            </button>
            {expanded && <DocList docs={builder.kycDocuments} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project review card ───────────────────────────────────────────────────────
function ProjectCard({ project, onApprove, onReject, onActivate, onDeactivate, showActions = false }) {
  const [expanded, setExpanded] = useState(false);
  // Show approve/reject if projectStatus is under_review OR we're on the pending tab (showActions=true)
  const isPending  = showActions || !project.projectStatus || project.projectStatus === "under_review";
  const isVerified = project.projectStatus === "verified";
  const isActive   = project.projectStatus === "active";
  const hasDocs    = (project.projectDocuments?.length || 0) + (project.kathaDocument ? 1 : 0) > 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">{project.projectName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.builderId?.companyName} · {project.location}
            </p>
            <p className="text-xs text-muted-foreground">
              {project.totalPlots} plots
              {project.kathaType && ` · Katha ${project.kathaType}`}
              {project.projectSubmittedAt && ` · Submitted ${new Date(project.projectSubmittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}`}
            </p>
            {project.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {project.amenities.slice(0,3).map(a => (
                  <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                ))}
              </div>
            )}
            {project.projectRejectionReason && (
              <p className={`text-xs mt-1 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {isActive ? "⚠ Note: " : "Reason: "}{project.projectRejectionReason}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            {isPending && (
              <>
                <Button size="sm" onClick={() => onApprove(project._id)} className="gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(project._id)} className="gap-1.5 text-xs">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </>
            )}
            {isVerified && (
              <Button size="sm" onClick={() => onActivate(project._id)} className="gap-1.5 text-xs">
                <Rocket className="h-3.5 w-3.5" /> Activate
              </Button>
            )}
            {isActive && (
              <Button size="sm" variant="outline" onClick={() => onDeactivate(project._id)}
                className="gap-1.5 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700">
                <PowerOff className="h-3.5 w-3.5" /> Deactivate
              </Button>
            )}
          </div>
        </div>

        {/* Expandable docs — always visible if docs exist */}
        {hasDocs && (
          <>
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary font-medium">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Hide" : "View"} Documents ({(project.projectDocuments?.length||0) + (project.kathaDocument?1:0)})
            </button>
            {expanded && (
              <>
                {project.description && (
                  <p className="text-xs text-muted-foreground border-l-2 pl-3" style={{ borderColor:"var(--primary)" }}>
                    {project.description}
                  </p>
                )}
                <DocList
                  docs={project.projectDocuments}
                  kathaDocument={project.kathaDocument}
                  kathaType={project.kathaType}
                />
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab,             setTab]             = useState("kyc");
  const [pendingKYC,      setPendingKYC]      = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [allBuilders,     setAllBuilders]     = useState([]);
  const [allProjects,     setAllProjects]     = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [rejectModal,     setRejectModal]     = useState({ open:false, type:null, id:null });
  const [deactivateModal, setDeactivateModal] = useState({ open:false, id:null });
  const [allPlots, setAllPlots] = useState([]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [kycRes, projRes, allBRes, allPRes, plotsRes] = await Promise.all([
        api.get("/api/admin/kyc/pending"),
        api.get("/api/admin/projects/pending"),
        api.get("/api/admin/kyc/all"),
        api.get("/api/admin/projects/all"),
        api.get("/api/admin/plots"),
      ]);
      setPendingKYC(kycRes.data.builders || []);
      setPendingProjects(projRes.data.projects || []);
      setAllBuilders(allBRes.data.builders || []);
      setAllProjects(allPRes.data.projects || []);
      setAllPlots(plotsRes.data.plots || []);
    } catch { toast.error("Failed to load admin data"); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const approveKYC    = async (id) => { try { await api.post(`/api/admin/kyc/${id}/approve`); toast.success("KYC approved"); fetchAll(); } catch(e) { toast.error(e.response?.data?.error); } };
  const approveProj   = async (id) => { try { await api.post(`/api/admin/projects/${id}/approve`); toast.success("Project approved"); fetchAll(); } catch(e) { toast.error(e.response?.data?.error); } };
  const activateProj  = async (id) => { try { await api.post(`/api/admin/projects/${id}/activate`); toast.success("Project activated"); fetchAll(); } catch(e) { toast.error(e.response?.data?.error); } };

  const confirmReject = async (reason) => {
    try {
      if (rejectModal.type === "kyc")     await api.post(`/api/admin/kyc/${rejectModal.id}/reject`, { reason });
      if (rejectModal.type === "project") await api.post(`/api/admin/projects/${rejectModal.id}/reject`, { reason });
      toast.success("Rejected");
      setRejectModal({ open:false, type:null, id:null });
      fetchAll();
    } catch(e) { toast.error(e.response?.data?.error); }
  };

  const confirmDeactivate = async (reason) => {
    try {
      await api.post(`/api/admin/projects/${deactivateModal.id}/deactivate`, { reason });
      toast.success("Project deactivated");
      setDeactivateModal({ open:false, id:null });
      fetchAll();
    } catch(e) { toast.error(e.response?.data?.error); }
  };

  return (
    <>
      <ReasonModal
        open={rejectModal.open}
        title={rejectModal.type === "kyc" ? "Reject Builder KYC" : "Reject Project"}
        onConfirm={confirmReject}
        onCancel={() => setRejectModal({ open:false, type:null, id:null })}
      />
      <ReasonModal
        open={deactivateModal.open}
        title="Deactivate Project"
        optional
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateModal({ open:false, id:null })}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Admin</p>
          <h1 className="display-font text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Review builder verifications and project approvals.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label:"Pending KYC",      value:pendingKYC.length,     icon:Users },
            { label:"Pending Projects", value:pendingProjects.length, icon:FolderKanban },
            { label:"Total Builders",   value:allBuilders.length,     icon:Users },
            { label:"Total Projects",   value:allProjects.length,     icon:FolderKanban },
            { label:"Total Plots",      value:allPlots.length,        icon:FolderKanban },
          ].map(s => (
            <div key={s.label} className="card-sp p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="kyc" className="gap-2 text-sm">
              <Users className="h-4 w-4" /> Builder KYC
              {pendingKYC.length > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 py-0">{pendingKYC.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 text-sm">
              <FolderKanban className="h-4 w-4" /> Projects
              {pendingProjects.length > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 py-0">{pendingProjects.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-builders" className="text-sm">All Builders</TabsTrigger>
            <TabsTrigger value="all-projects"  className="text-sm">All Projects</TabsTrigger>
            <TabsTrigger value="plots" className="text-sm">All Plots</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {/* Pending KYC */}
              {tab === "kyc" && (
                pendingKYC.length === 0
                  ? <p className="text-sm text-muted-foreground">No pending KYC.</p>
                  : pendingKYC.map(b => (
                      <BuilderKYCCard key={b._id} builder={b}
                        showActions
                        onApprove={approveKYC}
                        onReject={id => setRejectModal({ open:true, type:"kyc", id })}
                      />
                    ))
              )}

              {/* Pending Projects */}
              {tab === "projects" && (
                pendingProjects.length === 0
                  ? <p className="text-sm text-muted-foreground">No pending projects.</p>
                  : pendingProjects.map(p => (
                      <ProjectCard key={p._id} project={p}
                        showActions
                        onApprove={approveProj}
                        onReject={id => setRejectModal({ open:true, type:"project", id })}
                        onActivate={activateProj}
                        onDeactivate={id => setDeactivateModal({ open:true, id })}
                      />
                    ))
              )}

              {/* All Builders — with expandable docs */}
              {tab === "all-builders" && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">All Builders ({allBuilders.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {allBuilders.map(b => (
                      <BuilderKYCCard key={b._id} builder={b}
                        onApprove={approveKYC}
                        onReject={id => setRejectModal({ open:true, type:"kyc", id })}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* All Projects — with expandable docs */}
              {tab === "all-projects" && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">All Projects ({allProjects.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {allProjects.map(p => (
                      <ProjectCard key={p._id} project={p}
                        onApprove={approveProj}
                        onReject={id => setRejectModal({ open:true, type:"project", id })}
                        onActivate={activateProj}
                        onDeactivate={id => setDeactivateModal({ open:true, id })}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

                      {tab === "plots" && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">All Plots ({allPlots.length})</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {allPlots.map((p, index) => (
                      <div key={index} className="border-b py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">Plot {p.plotNumber} – {p.projectName}</p>
                          <p className="text-muted-foreground">Builder: {p.builderName}</p>
                          <p className="text-muted-foreground">
                            Size: {p.sizeSqft} sqft | Facing: {p.facing} | Price: ₹{p.price.toLocaleString("en-IN")}
                          </p>
                          <p className="text-muted-foreground">Status: {p.status}</p>
                          {p.tokenAmount != null && (
                            <p className="text-muted-foreground">Paid: ₹{p.tokenAmount.toLocaleString("en-IN")} ({p.bookingStatus})</p>
                          )}
                          {p.investorName && (
                            <p className="text-muted-foreground">Investor: {p.investorName} {p.investorEmail && `· ${p.investorEmail}`}</p>
                          )}
                          {p.expiresAt && p.bookingStatus === "reserved" && (
                            <p className="text-xs text-amber-700">
                              Reservation expires on {new Date(p.expiresAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </Tabs>
      </div>
    </>
  );
}
