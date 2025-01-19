import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
}

export function StarRating({ value, onChange, maxStars = 5 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = hoverValue !== null 
          ? starValue <= hoverValue
          : starValue <= value;

        return (
          <button
            key={index}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(starValue)}
          >
            <Star 
              className={`w-6 h-6 transition-colors ${
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
} 