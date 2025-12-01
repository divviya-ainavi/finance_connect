import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ReviewCard from "./ReviewCard";

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
    worker_profiles?: { name: string }[] | null;
    business_profiles?: { company_name: string }[] | null;
  } | null;
}

interface ReviewListProps {
  reviews: Review[];
  reviewerType: "worker" | "business";
  onHelpful?: (reviewId: string) => void;
}

type SortOption = "recent" | "highest" | "lowest" | "helpful";

const ReviewList = ({ reviews, reviewerType, onHelpful }: ReviewListProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterRating, setFilterRating] = useState<string>("all");

  const getReviewerName = (review: Review) => {
    if (reviewerType === "business") {
      return review.profiles?.business_profiles?.[0]?.company_name || "Anonymous";
    }
    return review.profiles?.worker_profiles?.[0]?.name || "Anonymous";
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      case "helpful":
        return b.helpful_count - a.helpful_count;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const filteredReviews = sortedReviews.filter((review) => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              reviewerName={getReviewerName(review)}
              rating={review.rating}
              title={review.title}
              content={review.content}
              createdAt={review.created_at}
              ratingCategories={review.rating_categories}
              helpfulCount={review.helpful_count}
              onHelpfulClick={() => onHelpful?.(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
