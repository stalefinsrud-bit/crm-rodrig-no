// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthCallback from "@/pages/AuthCallback";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

import { AuthPage } from "@/components/AuthPage";
import { AppLayout } from "@/components/AppLayout";

import Dashboard from "@/pages/Dashboard";
import Companies from "@/pages/Companies";
import CompanyDetail from "@/pages/CompanyDetail";
import CallMode from "@/pages/CallMode";
import Forecast from "@/pages/Forecast";
import BoardReport from "@/pages/BoardReport";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;
  if (roleLoading) return <LoadingScreen text="Loading permissions..." />;

  const isAdmin = role === "owner";

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report" element={<BoardReport />} />

        <Route path="/companies" element={isAdmin ? <Companies /> : <Navigate to="/" replace />} />
        <Route path="/companies/:id" element={isAdmin ? <CompanyDetail /> : <Navigate to="/" replace />} />
        <Route path="/prospects" element={<Navigate to="/companies" replace />} />
        <Route path="/call-mode" element={isAdmin ? <CallMode /> : <Navigate to="/" replace />} />
        <Route path="/forecast" element={isAdmin ? <Forecast /> : <Navigate to="/" replace />} />

        <Route path="*" element={isAdmin ? <NotFound /> : <Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/*" element={<AuthenticatedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}