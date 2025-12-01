import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerProfile from "./pages/worker/Profile";
import WorkerVerification from "./pages/worker/Verification";
import SkillsTest from "./components/worker/SkillsTest";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessShortlist from "./pages/business/Shortlist";
import CandidateDetail from "./pages/CandidateDetail";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<Search />} />
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            <Route path="/worker/profile" element={<WorkerProfile />} />
            <Route path="/worker/verification" element={<WorkerVerification />} />
            <Route path="/worker/test/:role" element={<SkillsTest />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/business/shortlist" element={<BusinessShortlist />} />
            <Route path="/candidate/:id" element={<CandidateDetail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
