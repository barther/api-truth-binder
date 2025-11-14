import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import VacancyChecker from "./pages/VacancyChecker";
import DispatcherRoster from "./pages/DispatcherRoster";
import DispatcherAdmin from "./pages/DispatcherAdmin";
import DeskAdmin from "./pages/DeskAdmin";
import MarkOffTool from "./pages/MarkOffTool";
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
            <Route index element={<VacancyChecker />} />
            <Route path="dispatchers" element={<DispatcherRoster />} />
            <Route path="mark-off" element={<MarkOffTool />} />
            <Route path="admin/dispatchers" element={<DispatcherAdmin />} />
            <Route path="admin/desks" element={<DeskAdmin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
