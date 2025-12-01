import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import StarRating from "./StarRating";

interface ReviewFormProps {
  reviewerType: "worker" | "business";
  onSubmit: (data: {
    rating: number;
    title: string;
    content: string;
    ratingCategories: Record<string, number>;
  }) => Promise<void>;
  onCancel?: () => void;
}

const WORKER_CATEGORIES = [
  { key: "communication", label: "Communication" },
  { key: "clarity_of_requirements", label: "Clarity of Requirements" },
  { key: "timeliness_of_payment", label: "Timeliness of Payment" },
  { key: "work_environment", label: "Work Environment" },
];

const BUSINESS_CATEGORIES = [
  { key: "communication", label: "Communication" },
  { key: "quality_of_work", label: "Quality of Work" },
  { key: "professionalism", label: "Professionalism" },
  { key: "punctuality", label: "Punctuality" },
  { key: "technical_skills", label: "Technical Skills" },
];

const ReviewForm = ({ reviewerType, onSubmit, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});

  const categories = reviewerType === "worker" ? WORKER_CATEGORIES : BUSINESS_CATEGORIES;

  const handleCategoryRating = (key: string, value: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (rating === 0 || content.length < 50) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        title,
        content,
        ratingCategories: categoryRatings,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = rating > 0 && content.length >= 50;

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>
          Share your experience to help others make informed decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Overall Rating *</Label>
          <StarRating
            rating={rating}
            interactive
            size={32}
            onRatingChange={setRating}
          />
        </div>

        <div>
          <Label htmlFor="title">Review Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience..."
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="content">Your Review *</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share details about your experience..."
            rows={6}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {content.length}/1000 characters (minimum 50)
          </p>
        </div>

        <div className="space-y-4">
          <Label>Rate Specific Aspects</Label>
          {categories.map((category) => (
            <div key={category.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{category.label}</span>
                <StarRating
                  rating={categoryRatings[category.key] || 0}
                  interactive
                  size={20}
                  onRatingChange={(value) => handleCategoryRating(category.key, value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
