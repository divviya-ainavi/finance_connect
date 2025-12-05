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
import WorkerSettings from "./pages/worker/Settings";
import SkillsTest from "./components/worker/SkillsTest";
import BusinessDashboard from "./pages/business/Dashboard";
import BusinessShortlist from "./pages/business/Shortlist";
import BusinessProfile from "./pages/business/Profile";
import BusinessSettings from "./pages/business/Settings";
import BusinessDetail from "./pages/BusinessDetail";
import CandidateDetail from "./pages/CandidateDetail";
import ResetPassword from "./pages/ResetPassword";
import Reviews from "./pages/Reviews";
import Messages from "./pages/Messages";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
// Admin imports
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import WorkersList from "./pages/admin/workers/WorkersList";
import WorkerDetail from "./pages/admin/workers/WorkerDetail";
import BusinessesList from "./pages/admin/businesses/BusinessesList";
import BusinessDetailAdmin from "./pages/admin/businesses/BusinessDetail";
import TestsManagement from "./pages/admin/verification/TestsManagement";
import ReferencesQueue from "./pages/admin/verification/ReferencesQueue";
import IdChecksQueue from "./pages/admin/verification/IdChecksQueue";
import QualificationsQueue from "./pages/admin/verification/QualificationsQueue";
import ReviewsModeration from "./pages/admin/reviews/ReviewsModeration";
import DisputesManagement from "./pages/admin/disputes/DisputesManagement";
import PlatformSettings from "./pages/admin/settings/PlatformSettings";
import AnalyticsDashboard from "./pages/admin/analytics/AnalyticsDashboard";

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
            <Route path="/worker/settings" element={<WorkerSettings />} />
            <Route path="/worker/test/:role" element={<SkillsTest />} />
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/business/shortlist" element={<BusinessShortlist />} />
            <Route path="/business/profile" element={<BusinessProfile />} />
            <Route path="/business/settings" element={<BusinessSettings />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/candidate/:id" element={<CandidateDetail />} />
            <Route path="/reviews/:profileType/:profileId" element={<Reviews />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/pricing" element={<Pricing />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/workers" element={<WorkersList />} />
            <Route path="/admin/workers/:id" element={<WorkerDetail />} />
            <Route path="/admin/businesses" element={<BusinessesList />} />
            <Route path="/admin/businesses/:id" element={<BusinessDetailAdmin />} />
            <Route path="/admin/verification/tests" element={<TestsManagement />} />
            <Route path="/admin/verification/references" element={<ReferencesQueue />} />
            <Route path="/admin/verification/id-checks" element={<IdChecksQueue />} />
            <Route path="/admin/verification/qualifications" element={<QualificationsQueue />} />
            <Route path="/admin/reviews" element={<ReviewsModeration />} />
            <Route path="/admin/disputes" element={<DisputesManagement />} />
            <Route path="/admin/settings" element={<PlatformSettings />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
