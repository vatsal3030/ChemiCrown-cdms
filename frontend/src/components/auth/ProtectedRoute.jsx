import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in at all, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific set of roles is required and the user doesn't have it
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or dashboard home
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">403 Forbidden</h1>
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        </div>
      </div>
    );
  }

  // User is authorized
  return <Outlet />;
}
