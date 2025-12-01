import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";
import StarRating from "./StarRating";
import { format } from "date-fns";

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
  ratingCategories?: Record<string, number>;
  helpfulCount: number;
  onHelpfulClick?: () => void;
}

const ReviewCard = ({
  reviewerName,
  rating,
  title,
  content,
  createdAt,
  ratingCategories,
  helpfulCount,
  onHelpfulClick,
}: ReviewCardProps) => {
  const initials = reviewerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{reviewerName}</h4>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(createdAt), "MMMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={rating} size={16} />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>

            {title && <h3 className="font-semibold text-lg">{title}</h3>}

            <p className="text-foreground leading-relaxed">{content}</p>

            {ratingCategories && Object.keys(ratingCategories).length > 0 && (
              <div className="space-y-2 pt-2">
                {Object.entries(ratingCategories).map(([category, score]) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-40 capitalize">
                      {category.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onHelpfulClick}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Helpful ({helpfulCount})
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
