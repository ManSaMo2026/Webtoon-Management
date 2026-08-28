import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:id" element={<ProjectLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardTab />} />
            <Route path="story" element={<StoryTab />} />
            <Route path="characters" element={<CharactersTab />} />
            <Route path="scenes" element={<ScenesTab />} />
            <Route path="schedule" element={<ScheduleTab />} />
            <Route path="export" element={<ExportTab />} />
          </Route>
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
