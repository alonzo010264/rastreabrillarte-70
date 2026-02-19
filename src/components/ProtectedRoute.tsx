import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "agent" | "moderator";
}

const ProtectedRoute = ({ children, requiredRole = "admin" }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus("unauthorized");
          return;
        }

        // Check if user has the required role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!roleData || roleData.role !== requiredRole) {
          setStatus("unauthorized");
          return;
        }

        // Check if user profile is verified
        const { data: profile } = await supabase
          .from("profiles")
          .select("verificado, confirmado")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile?.verificado || !profile?.confirmado) {
          setStatus("unauthorized");
          return;
        }

        setStatus("authorized");
      } catch {
        setStatus("unauthorized");
      }
    };

    checkAccess();
  }, [requiredRole]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
