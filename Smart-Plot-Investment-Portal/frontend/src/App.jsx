import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar          from './components/Navbar';
import Home            from './pages/Home';
import Signup          from './pages/Signup';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import BuilderDashboard from './pages/BuilderDashboard';
import BuilderProjects from './pages/BuilderProjects';
import BuilderPlots    from './pages/BuilderPlots';
import BuilderKYC      from './pages/BuilderKYC';
import AdminDashboard  from './pages/AdminDashboard';
import AllProjects     from './pages/AllProjects';
import ProjectDetail   from './pages/ProjectDetail';
import PlotDetail      from './pages/PlotDetail';
import SavedProjects   from './pages/SavedProjects';
import MyBookings     from './pages/MyBookings';
import ProtectedRoute  from './components/ProtectedRoute';
import './index.css';
import { Toaster } from 'sonner';
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <Routes>
          {/* ── Public ───────────────────────────────────────────────── */}
          <Route path="/"        element={<Home />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/login"   element={<Login />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* All projects listing page */}
          <Route path="/projects" element={<AllProjects />} />

          {/* Project & plot detail — public (login required to interact) */}
          <Route path="/projects/:projectId"               element={<ProjectDetail />} />
          <Route path="/projects/:projectId/plots/:plotId" element={<PlotDetail />} />

          {/* ── Protected ────────────────────────────────────────────── */}
          <Route path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route path="/saved-projects"
            element={<ProtectedRoute allowedRoles={["investor"]}><SavedProjects /></ProtectedRoute>}
          />
          <Route path="/my-bookings"
            element={<ProtectedRoute allowedRoles={["investor"]}><MyBookings /></ProtectedRoute>}
          />
          <Route path="/dashboard/admin"
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>}
          />
          <Route path="/dashboard/builder/kyc"
            element={<ProtectedRoute allowedRoles={["builder"]}><BuilderKYC /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/builder/*"
            element={<ProtectedRoute allowedRoles={["builder"]}><BuilderDashboard /></ProtectedRoute>}
          >

            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects"       element={<BuilderProjects />} />
            <Route path="projects/plots" element={<BuilderPlots />} />
          </Route>
        </Routes>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
