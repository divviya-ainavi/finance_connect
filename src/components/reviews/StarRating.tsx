import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = 20,
  interactive = false,
  onRatingChange 
}: StarRatingProps) => {
  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isPartial = starValue > rating && starValue - 1 < rating;
        
        return (
          <Star
            key={index}
            className={`${interactive ? "cursor-pointer transition-colors" : ""} ${
              isFilled ? "fill-accent text-accent" : "text-muted"
            }`}
            size={size}
            onClick={() => handleClick(starValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
