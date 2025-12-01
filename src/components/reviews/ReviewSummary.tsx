import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  onViewAll?: () => void;
}

const ReviewSummary = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  onViewAll,
}: ReviewSummaryProps) => {
  const maxCount = Math.max(...Object.values(ratingDistribution));

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} size={24} />
          <p className="text-sm text-muted-foreground mt-2">
            Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;
            const percentage = totalReviews > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-8 text-right">{stars}★</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            );
          })}
        </div>

        {onViewAll && totalReviews > 0 && (
          <Button variant="outline" className="w-full" onClick={onViewAll}>
            See all {totalReviews} reviews →
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSummary;
