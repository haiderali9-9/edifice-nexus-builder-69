
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const RequireAuth = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Debugging auth state
    console.log("Auth state in RequireAuth:", { user, isLoading });
  }, [user, isLoading]);

  if (isLoading) {
    // Show loading indicator while checking authentication
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-xl">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect to login page and preserve 
    // the intended destination for post-login redirect
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default RequireAuth;
