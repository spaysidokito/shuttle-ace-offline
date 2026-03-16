import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/AppLayout";
import CourtDashboard from "@/pages/CourtDashboard";
import PlayersPage from "@/pages/PlayersPage";
import RankingsPage from "@/pages/RankingsPage";
import FeesPage from "@/pages/FeesPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<CourtDashboard />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
