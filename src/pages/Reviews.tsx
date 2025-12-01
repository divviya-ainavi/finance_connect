import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewSummary from "@/components/reviews/ReviewSummary";

interface Review {
  id: string;
  reviewer_profile_id: string;
  rating: number;
  title?: string | null;
  content: string;
  created_at: string;
  rating_categories: any;
  helpful_count: number;
  profiles?: {
    worker_profiles: { name: string }[] | null;
    business_profiles: { company_name: string }[] | null;
  } | null;
}

const Reviews = () => {
  const { profileType, profileId } = useParams<{ profileType: string; profileId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (profileId && profileType) {
      fetchReviews();
    }
  }, [profileId, profileType]);

  const fetchReviews = async () => {
    try {
      // Fetch profile name
      if (profileType === "worker") {
        const { data: workerProfile } = await supabase
          .from("worker_profiles")
          .select("name")
          .eq("id", profileId!)
          .single();
        setProfileName(workerProfile?.name || "");
      } else {
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("company_name")
          .eq("id", profileId!)
          .single();
        setProfileName(businessProfile?.company_name || "");
      }

      // Fetch reviews
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_reviewer_profile_id_fkey (
            worker_profiles (name),
            business_profiles (company_name)
          )
        `)
        .eq("reviewee_profile_id", profileId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data as any || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
      distribution[rating]++;
    });
    return distribution;
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reviews for {profileName}</h1>
          <p className="text-muted-foreground">
            See what others have to say about working with {profileName}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ReviewSummary
              averageRating={calculateAverageRating()}
              totalReviews={reviews.length}
              ratingDistribution={calculateRatingDistribution()}
            />
          </div>

          <div className="lg:col-span-2">
            <ReviewList
              reviews={reviews}
              reviewerType={profileType === "worker" ? "business" : "worker"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
