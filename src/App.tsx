import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import CourtDashboard from "@/pages/CourtDashboard";
import PlayersPage from "@/pages/PlayersPage";
import RankingsPage from "@/pages/RankingsPage";
import FeesPage from "@/pages/FeesPage";
import SettingsPage from "@/pages/SettingsPage";
import SessionsPage from "@/pages/SessionsPage";
import LoginPage from "@/pages/LoginPage";
import JoinGamePage from "@/pages/JoinGamePage";
import PlayerDashboard from "@/pages/PlayerDashboard";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppRoutes() {
  const { account, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-display tracking-widest text-muted-foreground">LOADING</span>
        </div>
      </div>
    );
  }

  if (!account) return <LoginPage />;

  // Player role → player interface
  if (account.role === 'player') {
    return (
      <Routes>
        <Route path="/" element={<JoinGamePage />} />
        <Route path="/dashboard" element={<PlayerDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Admin role → full admin interface
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<CourtDashboard />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <AppProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
