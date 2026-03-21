import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import {
  User, Mail, Lock, Phone, ShieldCheck,
  Loader2, ArrowRight, EyeOff, Eye, Building2,
} from "lucide-react";
import { Label }     from "../components/ui/label";
import { Input }     from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Button }    from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { toast }     from "sonner";

const ROLES = [
  { value:"investor", label:"Investor", icon:"◈", desc:"Browse & invest in plots" },
  { value:"builder",  label:"Builder",  icon:"◉", desc:"List your projects" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name:"", email:"", password:"", confirmPassword:"",
    phone:"", role:"", companyName:"",
  });

  const handleChange      = (e)     => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRoleChange  = (value) => setForm({ ...form, role: value });

  const validate = () => {
    if (!form.name?.trim())    { toast.error("Name is required"); return false; }
    if (!form.email?.trim())   { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Enter a valid email"); return false; }
    if (!form.password?.trim()) { toast.error("Password is required"); return false; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    if (form.password.trim() !== form.confirmPassword.trim()) { toast.error("Passwords do not match"); return false; }
    if (!form.phone?.trim())   { toast.error("Phone is required"); return false; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error("Phone must be 10 digits"); return false; }
    if (!form.role)            { toast.error("Please select a role"); return false; }
    if (form.role === "builder" && !form.companyName?.trim()) {
      toast.error("Company name is required for builders"); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const endpoint = form.role === "builder" ? "/api/builders/register" : "/api/auth/signup";
      const payload  = form.role === "builder"
        ? { name:form.name, email:form.email, password:form.password, phone:form.phone, companyName:form.companyName }
        : { name:form.name, email:form.email, password:form.password, phone:form.phone, role:form.role };
      await api.post(endpoint, payload);
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12">
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background:"color-mix(in srgb, var(--primary) 20%, transparent)" }} />

      <div className="relative w-full max-w-md anim-fadeup delay-0">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
            <span className="display-font text-xl font-bold text-primary">S</span>
          </div> */}
          <h1 className="display-font text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join India's premier plot investment platform</p>
        </div>

        <div className="card-sp p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="form-label">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="name" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" className="pl-10" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="form-label">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="email" name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com" className="pl-10" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="form-label">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="confirmPassword" name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password" className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="form-label">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10-digit mobile number" className="pl-10" />
              </div>
            </div>

            {/* Role selector — first */}
            <div className="space-y-1.5">
              <Label className="form-label">I am a <span className="text-destructive">*</span></Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{r.icon}</span>
                        <span>{r.label}</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline">— {r.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Name — builder only */}
            {form.role === "builder" && (
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="form-label">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="companyName" name="companyName" value={form.companyName}
                    onChange={handleChange} placeholder="Your registered company name" className="pl-10" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : <><ArrowRight className="h-4 w-4" /> Create Account</>}
            </Button>
          </form>

          <Separator className="my-4" />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mt-6">
          RERA Compliant · Secure · Trusted Platform
        </p>
      </div>
    </div>
  );
}
