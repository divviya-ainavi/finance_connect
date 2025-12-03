import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Building2, MapPin, Globe, Users, Briefcase, Star, 
  Loader2, Calendar, ExternalLink 
} from "lucide-react";
import StarRating from "@/components/reviews/StarRating";
import ReviewSummary from "@/components/reviews/ReviewSummary";

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_name: string;
  contact_role: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  profile_id: string;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  created_at: string;
}

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [projectsHired, setProjectsHired] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<{ 1: number; 2: number; 3: number; 4: number; 5: number }>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  useEffect(() => {
    if (id) {
      fetchBusinessData();
    }
  }, [id]);

  const fetchBusinessData = async () => {
    try {
      // Fetch business profile
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Fetch reviews for this business
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_profile_id", businessData.profile_id)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        const mappedReviews: Review[] = reviewsData.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          created_at: r.created_at || "",
        }));
        setReviews(mappedReviews);
        
        // Calculate average rating
        if (reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setAverageRating(avg);
          
          // Calculate distribution
          const dist: { 1: number; 2: number; 3: number; 4: number; 5: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          reviewsData.forEach(r => {
            const rating = r.rating as 1 | 2 | 3 | 4 | 5;
            if (rating >= 1 && rating <= 5) {
              dist[rating] = dist[rating] + 1;
            }
          });
          setRatingDistribution(dist);
        }
      }

      // Count accepted connection requests (projects hired)
      const { count } = await supabase
        .from("connection_requests")
        .select("*", { count: "exact", head: true })
        .eq("business_profile_id", id)
        .eq("status", "accepted");

      setProjectsHired(count || 0);
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Business Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Business Profile</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="shadow-soft mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={business.logo_url || ""} alt={business.company_name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(business.company_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{business.company_name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {averageRating > 0 ? (
                    <div className="flex items-center gap-2">
                      <StarRating rating={averageRating} size={18} />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">New on FinanceConnect</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {business.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {business.location}
                    </div>
                  )}
                  {business.industry && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {business.industry}
                    </div>
                  )}
                  {business.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {business.company_size} employees
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {new Date(business.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stats */}
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{projectsHired}</div>
              <p className="text-sm text-muted-foreground">Workers hired via FinanceConnect</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {averageRating > 0 ? averageRating.toFixed(1) : "-"}
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{reviews.length}</div>
              <p className="text-sm text-muted-foreground">Reviews from Workers</p>
            </CardContent>
          </Card>
        </div>

        {/* About */}
        {(business.description || business.contact_name || business.website) && (
          <Card className="shadow-soft mt-6">
            <CardHeader>
              <CardTitle>About {business.company_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {business.description && (
                <p className="text-muted-foreground">{business.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4">
                {business.contact_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">
                      {business.contact_name}
                      {business.contact_role && ` • ${business.contact_role}`}
                    </p>
                  </div>
                )}
                
                {business.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {business.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Summary */}
        {reviews.length > 0 && (
          <div className="mt-6">
            <ReviewSummary
              averageRating={averageRating}
              totalReviews={reviews.length}
              ratingDistribution={ratingDistribution}
              onViewAll={() => navigate(`/reviews/business/${business.profile_id}`)}
            />
          </div>
        )}

        {/* Recent Reviews */}
        <Card className="shadow-soft mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews from Workers
            </CardTitle>
            <CardDescription>What finance professionals say about working with {business.company_name}</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No reviews yet. Be the first to review after completing work!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} size={16} />
                      <span className="font-medium">{review.rating}/5</span>
                      <span className="text-sm text-muted-foreground">
                        • {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold mb-1">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground">{review.content}</p>
                  </div>
                ))}
                
                {reviews.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/reviews/business/${business.profile_id}`)}
                  >
                    View All {reviews.length} Reviews
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDetail;