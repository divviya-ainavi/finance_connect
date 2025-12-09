import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Review {
  rating: number;
  rating_categories?: {
    communication?: number;
    professionalism?: number;
    quality_of_work?: number;
    punctuality?: number;
  } | null;
  content?: string;
}

interface BehavioralInsightsProps {
  reviews: Review[];
  averageRating: number;
  projectsCompleted: number;
  className?: string;
}

interface InsightCard {
  title: string;
  value: string;
  score: number;
}

export function BehavioralInsights({ 
  reviews, 
  averageRating, 
  projectsCompleted,
  className 
}: BehavioralInsightsProps) {
  // Calculate category averages from reviews
  const getCategoryAverages = () => {
    const categories = {
      communication: [] as number[],
      professionalism: [] as number[],
      quality_of_work: [] as number[],
      punctuality: [] as number[],
    };

    reviews.forEach(review => {
      if (review.rating_categories) {
        const cats = review.rating_categories;
        if (cats.communication) categories.communication.push(cats.communication);
        if (cats.professionalism) categories.professionalism.push(cats.professionalism);
        if (cats.quality_of_work) categories.quality_of_work.push(cats.quality_of_work);
        if (cats.punctuality) categories.punctuality.push(cats.punctuality);
      }
    });

    return {
      communication: categories.communication.length > 0 
        ? categories.communication.reduce((a, b) => a + b, 0) / categories.communication.length 
        : null,
      professionalism: categories.professionalism.length > 0 
        ? categories.professionalism.reduce((a, b) => a + b, 0) / categories.professionalism.length 
        : null,
      quality_of_work: categories.quality_of_work.length > 0 
        ? categories.quality_of_work.reduce((a, b) => a + b, 0) / categories.quality_of_work.length 
        : null,
      punctuality: categories.punctuality.length > 0 
        ? categories.punctuality.reduce((a, b) => a + b, 0) / categories.punctuality.length 
        : null,
    };
  };

  const categoryAverages = getCategoryAverages();
  const hasData = reviews.length > 0;

  // Generate insight values based on scores
  const getInsightValue = (score: number | null, type: string): { value: string; score: number } => {
    if (score === null) {
      // Default placeholder values when no data
      const placeholders: Record<string, { value: string; score: number }> = {
        communication: { value: 'Direct & Concise', score: 75 },
        workStyle: { value: 'Detail-Oriented', score: 85 },
        teamCollaboration: { value: 'Highly Collaborative', score: 90 },
        problemSolving: { value: 'Analytical Approach', score: 80 },
        adaptability: { value: 'Flexible & Open', score: 70 },
        timeManagement: { value: 'Highly Organized', score: 88 },
      };
      return placeholders[type] || { value: 'Not Assessed', score: 0 };
    }

    const percentage = (score / 5) * 100;

    switch (type) {
      case 'communication':
        if (percentage >= 80) return { value: 'Direct & Concise', score: percentage };
        if (percentage >= 60) return { value: 'Clear & Responsive', score: percentage };
        return { value: 'Developing', score: percentage };
      case 'workStyle':
        if (percentage >= 80) return { value: 'Detail-Oriented', score: percentage };
        if (percentage >= 60) return { value: 'Thorough', score: percentage };
        return { value: 'Task-Focused', score: percentage };
      case 'teamCollaboration':
        if (percentage >= 80) return { value: 'Highly Collaborative', score: percentage };
        if (percentage >= 60) return { value: 'Team Player', score: percentage };
        return { value: 'Independent Worker', score: percentage };
      case 'problemSolving':
        if (percentage >= 80) return { value: 'Analytical Approach', score: percentage };
        if (percentage >= 60) return { value: 'Solution-Oriented', score: percentage };
        return { value: 'Practical Approach', score: percentage };
      case 'adaptability':
        if (percentage >= 80) return { value: 'Flexible & Open', score: percentage };
        if (percentage >= 60) return { value: 'Adaptable', score: percentage };
        return { value: 'Consistent', score: percentage };
      case 'timeManagement':
        if (percentage >= 80) return { value: 'Highly Organized', score: percentage };
        if (percentage >= 60) return { value: 'Reliable', score: percentage };
        return { value: 'Developing', score: percentage };
      default:
        return { value: 'Not Assessed', score: 0 };
    }
  };

  // Build insight cards
  const insightCards: InsightCard[] = [
    {
      title: 'Communication Style',
      ...getInsightValue(categoryAverages.communication, 'communication'),
    },
    {
      title: 'Work Style',
      ...getInsightValue(categoryAverages.professionalism, 'workStyle'),
    },
    {
      title: 'Team Collaboration',
      ...getInsightValue(categoryAverages.quality_of_work, 'teamCollaboration'),
    },
    {
      title: 'Problem Solving',
      ...getInsightValue(
        averageRating > 0 ? averageRating : null, 
        'problemSolving'
      ),
    },
    {
      title: 'Adaptability',
      ...getInsightValue(
        projectsCompleted > 0 ? Math.min(projectsCompleted / 2, 5) : null, 
        'adaptability'
      ),
    },
    {
      title: 'Time Management',
      ...getInsightValue(categoryAverages.punctuality, 'timeManagement'),
    },
  ];

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6">Behavioral & Communication Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insightCards.map((card, index) => (
          <Card key={index} className="border border-border rounded-lg">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-medium text-foreground">{card.title}</h3>
              <p className="text-primary text-sm">{card.value}</p>
              <Progress 
                value={card.score} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData && (
        <p className="text-center text-muted-foreground text-sm mt-6">
          * Assessment data coming soon. These are placeholder insights.
        </p>
      )}
    </div>
  );
}
