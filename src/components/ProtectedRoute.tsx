import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "moderator";
}

const ProtectedRoute = ({ children, requiredRole = "admin" }: ProtectedRouteProps) => {
  const { user, profile, isAdmin, isAgent, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Check role
  const hasRole = requiredRole === "admin" ? isAdmin : requiredRole === "agent" ? isAgent : false;
  if (!hasRole) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
