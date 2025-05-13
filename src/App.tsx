import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";

// Import Issues page directly instead of lazy loading it
import Issues from "./pages/Issues";

// Lazy load all other pages for better performance
const Auth = React.lazy(() => import("./pages/Auth"));
const Projects = React.lazy(() => import("./pages/Projects"));
const ProjectDetails = React.lazy(() => import("./pages/ProjectDetails"));
const Resources = React.lazy(() => import("./pages/Resources"));
const Team = React.lazy(() => import("./pages/Team"));
const Schedule = React.lazy(() => import("./pages/Schedule"));
const Finances = React.lazy(() => import("./pages/Finances"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Documents = React.lazy(() => import("./pages/Documents"));
const Settings = React.lazy(() => import("./pages/Settings"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-construction-600" />
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes - require authentication */}
                <Route element={<RequireAuth />}>
                  <Route path="/" element={<Index />} />
                  
                  {/* Regular user routes */}
                  <Route path="/projects/:projectId" element={<ProjectDetails />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/issues" element={<Issues />} />
                  
                  {/* Admin-only routes */}
                  <Route element={<RequireAdmin />}>
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/finances" element={<Finances />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
