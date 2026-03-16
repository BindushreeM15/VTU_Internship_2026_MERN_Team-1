import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BuilderDashboard from './pages/BuilderDashboard';
import BuilderProjects from './pages/BuilderProjects';
import BuilderPlots from './pages/BuilderPlots';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/builder/*"
            element={
              <ProtectedRoute allowedRoles={["builder"]}>
                <BuilderDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<BuilderProjects />} />
            <Route path="projects/plots" element={<BuilderPlots />} />
          </Route>
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
