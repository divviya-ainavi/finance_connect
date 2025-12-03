import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Loader2, Search, Users, Clock, LogOut, Star, MessageSquare, Settings, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/reviews/ReviewForm";

interface BusinessProfile {
  id: string;
  company_name: string;
}

interface ConnectionRequest {
  id: string;
  status: string;
  hours_per_week: number;
  created_at: string;
  worker_profile_id: string;
  worker_profiles: {
    name: string;
    pseudonym: string;
    visibility_mode: string;
    profile_id: string;
  };
}

const BusinessDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profileData) {
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("profile_id", profileData.id)
          .single();

        if (businessProfile) {
          setProfile(businessProfile);

          // Fetch connection requests
          const { data: requestsData } = await supabase
            .from("connection_requests")
            .select(`
              *,
              worker_profiles (name, pseudonym, visibility_mode, profile_id)
            `)
            .eq("business_profile_id", businessProfile.id)
            .order("created_at", { ascending: false })
            .limit(5);

          setRequests(requestsData || []);

          // Fetch shortlist count
          const { count } = await supabase
            .from("shortlists")
            .select("*", { count: "exact", head: true })
            .eq("business_profile_id", businessProfile.id);

          setShortlistCount(count || 0);

          // Fetch business profile reviews
          const { data: profileData2 } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user?.id)
            .single();

          if (profileData2) {
            const { data: reviewsData, count: reviewsCount } = await supabase
              .from("reviews")
              .select("rating", { count: "exact" })
              .eq("reviewee_profile_id", profileData2.id);

            if (reviewsData && reviewsData.length > 0) {
              const avg = reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length;
              setAverageRating(avg);
            }
            setReviewCount(reviewsCount || 0);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (worker: ConnectionRequest["worker_profiles"]) => {
    if (worker.visibility_mode === "anonymous" && worker.pseudonym) {
      return worker.pseudonym;
    }
    return worker.name;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
    };
    const config = statusMap[status] || statusMap.pending;
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
      const connection = requests.find((r) => r.id === selectedConnection && r.status === "accepted");
      if (!connection) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profileData) return;

      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("profile_id")
        .eq("profile_id", profileData.id)
        .single();

      const { data: workerProfile } = await supabase
        .from("worker_profiles")
        .select("profile_id")
        .eq("id", connection.worker_profile_id)
        .single();

      if (!businessProfile || !workerProfile) return;

      const { error } = await supabase.from("reviews").insert({
        connection_request_id: selectedConnection,
        reviewer_profile_id: businessProfile.profile_id,
        reviewee_profile_id: workerProfile.profile_id,
        reviewer_type: "business",
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
            <span className="text-xl font-semibold">Business Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/business/profile")}>
              <Building2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/business/settings")}>
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
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.company_name}!</h1>
          <p className="text-muted-foreground">Find and connect with finance professionals.</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortlist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shortlistCount}</div>
              <p className="text-xs text-muted-foreground">Saved candidates</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter((r) => r.status === "accepted").length}
              </div>
              <p className="text-xs text-muted-foreground">Accepted connections</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {reviewCount > 0 ? (
                <>
                  <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">No reviews yet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Talent
              </CardTitle>
              <CardDescription>
                Browse our database of verified finance professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="hero"
                onClick={() => navigate("/search")}
              >
                Browse Candidates
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Shortlist
              </CardTitle>
              <CardDescription>
                View and manage your saved candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/business/shortlist")}
              >
                View Shortlist ({shortlistCount})
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Connection Requests */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Connection Requests</CardTitle>
            <CardDescription>Track your outreach to candidates</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No connection requests yet. Start by browsing candidates!
                </p>
                <Button variant="outline" onClick={() => navigate("/search")}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Candidates
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {getDisplayName(request.worker_profiles)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {request.hours_per_week} hours/week • {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {request.status === "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConnection(request.id);
                            setReviewFormOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Form Dialog */}
        {reviewFormOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewForm
                reviewerType="business"
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

export default BusinessDashboard;
