import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ProjectsPage } from "../pages/ProjectsPage";
import { NewProjectPage } from "../pages/NewProjectPage";
import { ProjectLayout } from "../pages/ProjectLayout";
import { DashboardTab } from "../pages/tabs/DashboardTab";
import { StoryTab } from "../pages/tabs/StoryTab";
import { CharactersTab } from "../pages/tabs/CharactersTab";
import { ScenesTab } from "../pages/tabs/ScenesTab";
import { ScheduleTab } from "../pages/tabs/ScheduleTab";
import { ExportTab } from "../pages/tabs/ExportTab";
import { WorldSettingTab } from "../pages/tabs/WorldSettingTab";
import { LandingPage } from "../pages/LandingPage";
import { AuthPage } from "../pages/AuthPage";
import { ProfilePage } from "../pages/ProfilePage";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">계정 정보를 확인하고 있습니다...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/projects/new" element={<ProtectedRoute><NewProjectPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardTab />} />
              <Route path="story" element={<StoryTab />} />
              <Route path="characters" element={<CharactersTab />} />
              <Route path="world" element={<WorldSettingTab />} />
              <Route path="scenes" element={<ScenesTab />} />
              <Route path="schedule" element={<ScheduleTab />} />
              <Route path="export" element={<ExportTab />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
