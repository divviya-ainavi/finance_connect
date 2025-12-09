import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Clock, 
  Target, 
  Users, 
  Lightbulb, 
  TrendingUp,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';

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

  // Generate behavioral insights based on data
  const getInsights = () => {
    const insights: { type: 'positive' | 'neutral' | 'warning'; icon: React.ReactNode; title: string; description: string }[] = [];

    // Communication insight
    if (categoryAverages.communication !== null) {
      if (categoryAverages.communication >= 4) {
        insights.push({
          type: 'positive',
          icon: <MessageSquare className="h-4 w-4" />,
          title: 'Excellent Communicator',
          description: 'Consistently receives high marks for clear, responsive communication with clients.'
        });
      } else if (categoryAverages.communication >= 3) {
        insights.push({
          type: 'neutral',
          icon: <MessageSquare className="h-4 w-4" />,
          title: 'Good Communication',
          description: 'Generally communicates well with room for improvement in responsiveness.'
        });
      }
    }

    // Punctuality insight
    if (categoryAverages.punctuality !== null) {
      if (categoryAverages.punctuality >= 4) {
        insights.push({
          type: 'positive',
          icon: <Clock className="h-4 w-4" />,
          title: 'Highly Reliable',
          description: 'Known for meeting deadlines and being punctual with deliverables.'
        });
      } else if (categoryAverages.punctuality < 3) {
        insights.push({
          type: 'warning',
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Time Management',
          description: 'Some clients have noted occasional delays - may need clear deadline expectations.'
        });
      }
    }

    // Professionalism insight
    if (categoryAverages.professionalism !== null) {
      if (categoryAverages.professionalism >= 4.5) {
        insights.push({
          type: 'positive',
          icon: <Target className="h-4 w-4" />,
          title: 'Highly Professional',
          description: 'Demonstrates exceptional professionalism in all client interactions.'
        });
      }
    }

    // Quality of work insight
    if (categoryAverages.quality_of_work !== null) {
      if (categoryAverages.quality_of_work >= 4) {
        insights.push({
          type: 'positive',
          icon: <ThumbsUp className="h-4 w-4" />,
          title: 'Quality-Focused',
          description: 'Delivers high-quality work that consistently meets or exceeds expectations.'
        });
      }
    }

    // Experience-based insight
    if (projectsCompleted >= 10) {
      insights.push({
        type: 'positive',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Platform Veteran',
        description: `Completed ${projectsCompleted} projects via the platform with proven track record.`
      });
    } else if (projectsCompleted >= 5) {
      insights.push({
        type: 'neutral',
        icon: <Users className="h-4 w-4" />,
        title: 'Growing Experience',
        description: `Has successfully completed ${projectsCompleted} engagements through the platform.`
      });
    } else if (projectsCompleted < 2) {
      insights.push({
        type: 'neutral',
        icon: <Lightbulb className="h-4 w-4" />,
        title: 'New to Platform',
        description: 'Recently joined - may bring fresh perspectives and competitive rates.'
      });
    }

    // Overall rating insight
    if (averageRating >= 4.5 && reviews.length >= 3) {
      insights.push({
        type: 'positive',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Top Performer',
        description: 'Maintains an exceptional rating across multiple client engagements.'
      });
    }

    return insights;
  };

  const insights = getInsights();
  const hasData = reviews.length > 0 || projectsCompleted > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-accent" />
          Behavioral & Communication Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No behavioral data available yet.</p>
            <p className="text-xs mt-1">Insights will appear after completing projects and receiving reviews.</p>
          </div>
        ) : (
          <>
            {/* Category Scores */}
            {(categoryAverages.communication !== null || 
              categoryAverages.professionalism !== null || 
              categoryAverages.quality_of_work !== null || 
              categoryAverages.punctuality !== null) && (
              <div className="space-y-3 pb-4 border-b">
                <p className="text-sm font-medium text-muted-foreground">Review Categories</p>
                <div className="grid grid-cols-2 gap-3">
                  {categoryAverages.communication !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Communication
                        </span>
                        <span className="font-medium">{categoryAverages.communication.toFixed(1)}/5</span>
                      </div>
                      <Progress value={categoryAverages.communication * 20} className="h-1.5" />
                    </div>
                  )}
                  {categoryAverages.professionalism !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Professionalism
                        </span>
                        <span className="font-medium">{categoryAverages.professionalism.toFixed(1)}/5</span>
                      </div>
                      <Progress value={categoryAverages.professionalism * 20} className="h-1.5" />
                    </div>
                  )}
                  {categoryAverages.quality_of_work !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          Quality of Work
                        </span>
                        <span className="font-medium">{categoryAverages.quality_of_work.toFixed(1)}/5</span>
                      </div>
                      <Progress value={categoryAverages.quality_of_work * 20} className="h-1.5" />
                    </div>
                  )}
                  {categoryAverages.punctuality !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Punctuality
                        </span>
                        <span className="font-medium">{categoryAverages.punctuality.toFixed(1)}/5</span>
                      </div>
                      <Progress value={categoryAverages.punctuality * 20} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI-Generated Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Key Insights</p>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        insight.type === 'positive' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900' 
                          : insight.type === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                          : 'bg-muted/50 border border-border'
                      }`}
                    >
                      <div className={`mt-0.5 ${
                        insight.type === 'positive' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : insight.type === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground'
                      }`}>
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{insight.title}</p>
                          {insight.type === 'positive' && (
                            <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                              Strength
                            </Badge>
                          )}
                          {insight.type === 'warning' && (
                            <Badge variant="secondary" className="text-[10px] h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                              Note
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">More insights will appear as more reviews are collected.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
