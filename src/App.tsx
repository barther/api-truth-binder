import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DragDropDeskBoard } from "./components/DragDropDeskBoard";
import { DispatchersPage } from "./pages/DispatchersPage";
import { VacanciesPage } from "./pages/VacanciesPage";
import { HoldDownsPage } from "./pages/HoldDownsPage";
import { AuditPage } from "./pages/AuditPage";
import TricksPage from "./pages/TricksPage";
import ATWPage from "./pages/ATWPage";
import AdminDesksPage from "./pages/AdminDesksPage";
import AdminDispatchersPage from "./pages/AdminDispatchersPage";
import { SettingsPage } from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DragDropDeskBoard />} />
            <Route path="dispatchers" element={<DispatchersPage />} />
            <Route path="vacancies" element={<VacanciesPage />} />
            <Route path="hold-downs" element={<HoldDownsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="tricks" element={<TricksPage />} />
            <Route path="atw" element={<ATWPage />} />
            <Route path="admin/desks" element={<AdminDesksPage />} />
            <Route path="admin/dispatchers" element={<AdminDispatchersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
