import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "sonner";
import {
  Upload, FileCheck2, AlertCircle, Clock, CheckCircle2,
  XCircle, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button }    from "../components/ui/button";
import { Badge }     from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";

const KYC_DOCS = [
  { key:"gstCertificate",    label:"GST Certificate",                        description:"GST registration certificate of your company",          required:true  },
  { key:"companyPan",        label:"Company PAN Card",                       description:"PAN card issued to the company (not personal)",         required:true  },
  { key:"incorporationCert", label:"Certificate of Incorporation / Partnership Deed", description:"Proof that your company is legally registered", required:true  },
  { key:"directorId",        label:"Director / Owner ID",                    description:"Personal PAN or Aadhaar of the director / owner",       required:false },
  { key:"addressProof",      label:"Company Address Proof",                  description:"Utility bill or rent agreement of the company office",   required:false },
];

const STATUS_CONFIG = {
  unsubmitted:  { color:"border-amber-300/40 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300",   icon:AlertCircle,   label:"Not Submitted" },
  under_review: { color:"border-blue-300/40 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300",        icon:Clock,         label:"Under Review" },
  verified:     { color:"border-green-300/40 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300",   icon:CheckCircle2,  label:"Verified" },
  rejected:     { color:"border-red-300/40 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300",             icon:XCircle,       label:"Rejected" },
};

// ── Update token in localStorage with fresh one from server ──────────────────
const refreshTokenInStorage = async () => {
  try {
    const res = await api.get("/api/kyc/refresh-token");
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      // Notify same-tab components (storage event only fires cross-tab)
      window.dispatchEvent(new Event("tokenUpdated"));
      return res.data.kycStatus;
    }
  } catch (_) {}
  return null;
};

export default function BuilderKYC() {
  const navigate      = useNavigate();
  const [kycData,     setKycData]     = useState(null);
  const [files,       setFiles]       = useState({});
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const pollRef = useRef(null);

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get("/api/kyc/status");
      setKycData(res.data);
      return res.data.kycStatus;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load KYC status");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Poll every 10s when under_review ─────────────────────────────────────
  const startPolling = () => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      const freshStatus = await refreshTokenInStorage();
      if (freshStatus && freshStatus !== "under_review") {
        // Status changed — stop polling, reload page data
        clearInterval(pollRef.current);
        pollRef.current = null;
        await fetchKYCStatus();
        if (freshStatus === "verified") {
          toast.success("🎉 Your company has been verified! Redirecting to dashboard…");
          setTimeout(() => navigate("/dashboard/builder/projects"), 2000);
        } else if (freshStatus === "rejected") {
          toast.error("Your KYC was rejected. Please check the reason and resubmit.");
        }
      }
    }, 10000); // poll every 10 seconds
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchKYCStatus().then((status) => {
      if (status === "under_review") startPolling();
    });
    return () => stopPolling(); // cleanup on unmount
  }, []);

  // ── When status changes to under_review, start polling ───────────────────
  useEffect(() => {
    if (kycData?.kycStatus === "under_review") {
      startPolling();
    } else {
      stopPolling();
    }
  }, [kycData?.kycStatus]);

  const handleFileChange = (key, file) => setFiles(prev => ({ ...prev, [key]: file }));
  const uploadedCount = Object.keys(files).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadedCount < 3) { toast.error("Please upload at least 3 documents"); return; }
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => formData.append(key, file));
    try {
      await api.post("/api/kyc/submit", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Documents submitted! Awaiting admin review.");
      setFiles({});
      const status = await fetchKYCStatus();
      if (status === "under_review") startPolling();
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const status       = kycData?.kycStatus || "unsubmitted";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon   = statusConfig.icon;
  const canSubmit    = status === "unsubmitted" || status === "rejected";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Company Verification</p>
        <h1 className="display-font text-3xl font-bold text-foreground">
          Verify {kycData?.companyName}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Upload your company documents to get verified. Once approved by our admin team
          you'll have full access to create and manage projects.
        </p>
      </div>

      {/* Status card */}
      <div className={`flex items-start gap-4 rounded-xl border px-4 py-3.5 ${statusConfig.color}`}>
        <StatusIcon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="space-y-1 flex-1">
          <p className="font-semibold text-sm">
            Status: <span className="uppercase tracking-wider">{statusConfig.label}</span>
          </p>
          {status === "unsubmitted" && (
            <p className="text-xs">Submit at least 3 of the 5 documents below to begin verification.</p>
          )}
          {status === "under_review" && (
            <div className="space-y-1">
              <p className="text-xs">
                Documents submitted on{" "}
                {kycData?.kycSubmittedAt && new Date(kycData.kycSubmittedAt).toLocaleDateString("en-IN", {
                  day:"numeric", month:"short", year:"numeric",
                })}. Our team will review within 2–3 business days.
              </p>
              <p className="text-xs flex items-center gap-1.5 font-medium">
                <span className="shimmer inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                This page will update automatically when admin takes action — no need to refresh.
              </p>
            </div>
          )}
          {status === "verified" && (
            <p className="text-xs">Your company is verified. You can now create and manage projects.</p>
          )}
          {status === "rejected" && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Reason for rejection:</p>
              <p className="text-xs rounded-lg px-3 py-2 bg-red-500/5 border border-red-400/20">
                {kycData?.kycRejectionReason}
              </p>
              <p className="text-xs">Please re-upload corrected documents and resubmit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verified — redirect CTA */}
      {status === "verified" && (
        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard/builder/projects")} className="gap-2">
            Go to Projects <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
            Dashboard
          </Button>
        </div>
      )}

      {/* Under review — show submitted docs */}
      {status === "under_review" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Submitted Documents</CardTitle>
            <CardDescription>The following documents are being reviewed by our admin team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {kycData?.kycDocuments?.map(doc => (
              <div key={doc.docType}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{doc.label}</span>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-primary underline underline-offset-2">
                  View
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload form — unsubmitted or rejected */}
      {canSubmit && (
        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {status === "rejected" ? "Resubmit Documents" : "Upload Documents"}
                  </CardTitle>
                  <CardDescription>
                    Upload at least 3 of the 5 documents. Accepted: PDF, JPG, PNG (max 10 MB each).
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                  {uploadedCount} / 3 min
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-4">
              {KYC_DOCS.map(doc => (
                <div key={doc.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">{doc.label}</label>
                    {doc.required
                      ? <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Recommended</Badge>
                      : <Badge variant="secondary" className="text-[10px]">Optional</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                  <div className={`relative flex items-center gap-3 border rounded-lg px-4 py-2.5 transition-colors cursor-pointer ${
                    files[doc.key]
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-input hover:border-primary/30"
                  }`}>
                    {files[doc.key] ? (
                      <>
                        <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{files[doc.key].name}</span>
                        <button type="button"
                          onClick={() => setFiles(prev => { const n={...prev}; delete n[doc.key]; return n; })}
                          className="text-muted-foreground hover:text-destructive text-xs shrink-0">
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">Click to upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => { if (e.target.files?.[0]) handleFileChange(doc.key, e.target.files[0]); }}
                    />
                  </div>
                </div>
              ))}

              {uploadedCount < 3 && (
                <Alert className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/10">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-xs">
                    Upload at least {3 - uploadedCount} more document{3 - uploadedCount !== 1 ? "s" : ""} to submit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting || uploadedCount < 3} className="gap-2">
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : status === "rejected"
                      ? <><RefreshCw className="h-4 w-4" /> Resubmit for Review</>
                      : <><Upload className="h-4 w-4" /> Submit for Verification</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
