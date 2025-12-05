import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Loader2, CheckCircle, Clock, FileText, User, LogOut, Star, MessageSquare, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/reviews/ReviewForm";

interface WorkerProfile {
  id: string;
  name: string;
  roles: string[];
  location: string;
  visibility_mode: string;
}

interface VerificationStatus {
  testing_status: string;
  references_status: string;
  interview_status: string;
}

interface ConnectionRequest {
  id: string;
  message: string;
  hours_per_week: number;
  status: string;
  payment_status: string;
  created_at: string;
  business_profile_id: string;
  business_profiles: {
    company_name: string;
    profile_id: string;
  };
}

const WorkerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<ConnectionRequest[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profileData) {
        const { data: workerProfile } = await supabase
          .from("worker_profiles")
          .select("*")
          .eq("profile_id", profileData.id)
          .single();

        if (workerProfile) {
          setProfile(workerProfile);
          calculateProfileCompletion(workerProfile);

          // Fetch verification status
          const { data: verificationData } = await supabase
            .from("verification_statuses")
            .select("*")
            .eq("worker_profile_id", workerProfile.id)
            .single();

          setVerification(verificationData);

          // Fetch connection requests
          const { data: requestsData } = await supabase
            .from("connection_requests")
            .select(`
              *,
              business_profiles (company_name, profile_id)
            `)
            .eq("worker_profile_id", workerProfile.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          setRequests(requestsData || []);
          
          // Fetch accepted connection requests
          const { data: acceptedData } = await supabase
            .from("connection_requests")
            .select(`
              *,
              business_profiles (company_name, profile_id)
            `)
            .eq("worker_profile_id", workerProfile.id)
            .eq("status", "accepted")
            .order("updated_at", { ascending: false });

          setAcceptedRequests(acceptedData || []);

          // Fetch worker profile reviews
          const { data: profileData2 } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user?.id)
            .single();

          if (profileData2) {
            const { data: reviewsData, count } = await supabase
              .from("reviews")
              .select("rating", { count: "exact" })
              .eq("reviewee_profile_id", profileData2.id);

            if (reviewsData && reviewsData.length > 0) {
              const avg = reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length;
              setAverageRating(avg);
            }
            setReviewCount(count || 0);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: WorkerProfile) => {
    let completion = 20; // Base for having a profile
    if (profile.roles && profile.roles.length > 0) completion += 20;
    if (profile.location) completion += 20;
    // Add more completion checks as needed
    setProfileCompletion(completion);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Request accepted",
        description: "The business has been notified.",
      });

      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: "declined" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Request declined",
        description: "The request has been declined.",
      });

      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      not_started: { variant: "secondary", label: "Not Started" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      verified: { variant: "default", label: "Verified" },
      passed: { variant: "default", label: "Passed" },
    };
    const config = statusMap[status] || statusMap.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSubmitReview = async (reviewData: {
    rating: number;
    title: string;
    content: string;
    ratingCategories: Record<string, number>;
  }) => {
    if (!selectedConnection) return;

    try {
      const connection = acceptedRequests.find((r) => r.id === selectedConnection);
      if (!connection) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profileData) return;

      const { data: workerProfile } = await supabase
        .from("worker_profiles")
        .select("profile_id")
        .eq("profile_id", profileData.id)
        .single();

      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("profile_id")
        .eq("id", connection.business_profile_id)
        .single();

      if (!workerProfile || !businessProfile) return;

      const { error } = await supabase.from("reviews").insert({
        connection_request_id: selectedConnection,
        reviewer_profile_id: workerProfile.profile_id,
        reviewee_profile_id: businessProfile.profile_id,
        reviewer_type: "worker",
        rating: reviewData.rating,
        title: reviewData.title || null,
        content: reviewData.content,
        rating_categories: reviewData.ratingCategories,
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      setReviewFormOpen(false);
      setSelectedConnection(null);
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Worker Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/messages")}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/worker/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Manage your profile and review connection requests.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Completion */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Completion
              </CardTitle>
              <CardDescription>Complete your profile to attract more businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-medium">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} />
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/worker/profile")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/worker/verification")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verification
              </Button>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>Stand out with verified badges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Skills Testing</span>
                {verification && getStatusBadge(verification.testing_status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">References</span>
                {verification && getStatusBadge(verification.references_status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Interview</span>
                {verification && getStatusBadge(verification.interview_status)}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Complete verification steps to increase your visibility to businesses.
              </p>
            </CardContent>
          </Card>

          {/* Reviews Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                My Reviews
              </CardTitle>
              <CardDescription>Your reputation score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewCount > 0 ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-1">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(averageRating)
                                ? "fill-accent text-accent"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/reviews/worker/${profile?.id}`)}
                  >
                    View All Reviews
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reviews yet. Complete work to receive reviews from businesses.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Requests */}
        <Card className="mt-6 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Connection Requests
            </CardTitle>
            <CardDescription>Review requests from businesses</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending requests. Complete your profile to increase visibility!
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/business/${request.business_profile_id}`)}
                          >
                            {request.business_profiles.company_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.hours_per_week} hours/week
                          </p>
                        </div>
                        <Badge variant="secondary">New</Badge>
                      </div>
                      {request.message && (
                        <p className="text-sm mb-4 p-3 bg-muted rounded-lg">
                          {request.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted Connections */}
        {acceptedRequests.length > 0 && (
          <Card className="mt-6 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Accepted Connections
              </CardTitle>
              <CardDescription>Businesses you're working with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {acceptedRequests.map((request) => (
                  <Card key={request.id} className="border bg-accent/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{request.business_profiles.company_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.hours_per_week} hours/week
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.payment_status === "paid" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Paid - Ready to Chat
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Awaiting Payment
                            </Badge>
                          )}
                        </div>
                      </div>
                      {request.message && (
                        <p className="text-sm mb-2 p-3 bg-muted rounded-lg">
                          {request.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        Connected on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        {request.payment_status === "paid" && (
                          <Button
                            size="sm"
                            onClick={() => navigate("/messages")}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat with Business
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConnection(request.id);
                            setReviewFormOpen(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Leave Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form Dialog */}
        {reviewFormOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewForm
                reviewerType="worker"
                onSubmit={handleSubmitReview}
                onCancel={() => {
                  setReviewFormOpen(false);
                  setSelectedConnection(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
