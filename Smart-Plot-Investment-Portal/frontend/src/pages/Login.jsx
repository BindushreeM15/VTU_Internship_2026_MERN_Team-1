import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { Label }     from "../components/ui/label";
import { Input }     from "../components/ui/input";
import { Button }    from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { toast }     from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.email?.trim())    { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Enter a valid email"); return false; }
    if (!form.password?.trim()) { toast.error("Password is required"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      toast.success("Login successful!");
      setTimeout(() => {
        const role = res.data.user?.role;
        if (role === "builder") navigate("/dashboard/builder");
        else if (role === "admin") navigate("/dashboard/admin");
        else navigate("/dashboard");
      }, 600);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)" }} />

      <div className="relative w-full max-w-md anim-fadeup delay-0">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background:"color-mix(in srgb, var(--primary) 12%, transparent)", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
            <span className="display-font text-xl font-bold text-primary">S</span>
          </div> */}
          <h1 className="display-font text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your PlotVest account</p>
        </div>

        <div className="card-sp p-6 sm:p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="form-label">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="email" name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com" className="pl-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="form-label">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password} onChange={handleChange}
                  placeholder="Your password" className="pl-10 pr-10" />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                : <><LogIn className="h-4 w-4" /> Sign In</>}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline underline-offset-2">
              Create one
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
