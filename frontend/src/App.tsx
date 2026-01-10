import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CreateProfile from "./pages/CreateProfile";
import Dashboard from "./pages/Dashboard";
import CreateNFT from "./pages/CreateNFT";
import Lobby from "./pages/Lobby";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import MatchResult from "./pages/MatchResult";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-nft" element={<CreateNFT />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/match-result" element={<MatchResult />} />
          <Route path="/game" element={<Game />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
