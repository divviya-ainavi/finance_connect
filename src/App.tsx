import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy-load ALL routes so a missing backend env doesn't crash the entire app at import-time.
const Landing = React.lazy(() => import("./pages/Landing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Search = React.lazy(() => import("./pages/Search"));
const WorkerDashboard = React.lazy(() => import("./pages/worker/Dashboard"));
const WorkerProfile = React.lazy(() => import("./pages/worker/Profile"));
const WorkerVerification = React.lazy(() => import("./pages/worker/Verification"));
const WorkerSettings = React.lazy(() => import("./pages/worker/Settings"));
const SkillsTest = React.lazy(() => import("./components/worker/SkillsTest"));
const BusinessDashboard = React.lazy(() => import("./pages/business/Dashboard"));
const BusinessShortlist = React.lazy(() => import("./pages/business/Shortlist"));
const BusinessProfile = React.lazy(() => import("./pages/business/Profile"));
const BusinessSettings = React.lazy(() => import("./pages/business/Settings"));
const BusinessDetail = React.lazy(() => import("./pages/BusinessDetail"));
const CandidateDetail = React.lazy(() => import("./pages/CandidateDetail"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Reviews = React.lazy(() => import("./pages/Reviews"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Admin routes
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const WorkersList = React.lazy(() => import("./pages/admin/workers/WorkersList"));
const WorkerDetail = React.lazy(() => import("./pages/admin/workers/WorkerDetail"));
const BusinessesList = React.lazy(() => import("./pages/admin/businesses/BusinessesList"));
const BusinessDetailAdmin = React.lazy(() => import("./pages/admin/businesses/BusinessDetail"));
const TestsManagement = React.lazy(() => import("./pages/admin/verification/TestsManagement"));
const ReferencesQueue = React.lazy(() => import("./pages/admin/verification/ReferencesQueue"));
const IdChecksQueue = React.lazy(() => import("./pages/admin/verification/IdChecksQueue"));
const QualificationsQueue = React.lazy(() => import("./pages/admin/verification/QualificationsQueue"));
const ReviewsModeration = React.lazy(() => import("./pages/admin/reviews/ReviewsModeration"));
const DisputesManagement = React.lazy(() => import("./pages/admin/disputes/DisputesManagement"));
const PlatformSettings = React.lazy(() => import("./pages/admin/settings/PlatformSettings"));
const AnalyticsDashboard = React.lazy(() => import("./pages/admin/analytics/AnalyticsDashboard"));
const LocationsMap = React.lazy(() => import("./pages/admin/map/LocationsMap"));

// If backend env vars are missing, avoid importing any route pages that would crash.
const hasBackendEnv =
  typeof import.meta !== "undefined" &&
  !!import.meta.env?.VITE_SUPABASE_URL &&
  !!import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

const MissingBackendConfig = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="max-w-xl w-full rounded-lg border bg-card p-6 text-card-foreground">
      <h1 className="text-xl font-semibold">Backend configuration missing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This preview can’t connect to the backend because the required environment variables aren’t
        available at runtime.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>Ensure <code>VITE_SUPABASE_URL</code> is set</li>
        <li>Ensure <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> is set</li>
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        After setting them, reload the preview.
      </p>
      <div className="mt-5 flex gap-3">
        <a className="underline text-sm" href="/">
          Go to home
        </a>
        <a className="underline text-sm" href="/admin/login">
          Go to admin login
        </a>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            {!hasBackendEnv ? (
              <Routes>
                <Route path="*" element={<MissingBackendConfig />} />
              </Routes>
            ) : (
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
                <Route path="/admin/map" element={<LocationsMap />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

