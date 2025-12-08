import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReviewList from "./ReviewList";
import ReviewSummary from "./ReviewSummary";

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
    worker_profiles?: { name: string }[] | { name: string } | null;
    business_profiles?: { company_name: string }[] | { company_name: string } | null;
  } | null;
}

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviews: Review[];
  averageRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  reviewerType: "worker" | "business";
  profileName: string;
  onHelpful?: (reviewId: string) => void;
}

const ReviewsDialog = ({
  open,
  onOpenChange,
  reviews,
  averageRating,
  ratingDistribution,
  reviewerType,
  profileName,
  onHelpful,
}: ReviewsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reviews for {profileName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            <ReviewSummary
              averageRating={averageRating}
              totalReviews={reviews.length}
              ratingDistribution={ratingDistribution}
            />
            <ReviewList
              reviews={reviews}
              reviewerType={reviewerType}
              onHelpful={onHelpful}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsDialog;
