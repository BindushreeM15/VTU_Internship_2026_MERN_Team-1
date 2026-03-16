import { Navigate } from 'react-router-dom';

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const payload = parseJwt(token);
    if (!payload || !allowedRoles.includes(payload.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
