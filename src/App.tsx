
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "./contexts/ThemeProvider";

// Import Issues and Auth pages directly instead of lazy loading them
import Issues from "./pages/Issues";
import Auth from "./pages/Auth";
import Index from "./pages/Index";

// Lazy load all other pages for better performance
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
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public auth route */}
                  <Route path="/auth" element={<Auth />} />

                  {/* All protected routes */}
                  <Route element={<RequireAuth />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/projects/:projectId" element={<ProjectDetails />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/issues" element={<Issues />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/finances" element={<Finances />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
