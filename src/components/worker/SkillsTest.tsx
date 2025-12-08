import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

const SkillsTest = () => {
  const { role } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !role) {
      navigate("/worker/verification");
      return;
    }
    fetchTestQuestions();
  }, [user, role, navigate]);

  useEffect(() => {
    if (loading || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  const fetchTestQuestions = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) return;

      const { data: workerProfile } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!workerProfile) return;

      setWorkerProfileId(workerProfile.id);

      const { data: allQuestions } = await supabase
        .from("test_questions")
        .select("*")
        .eq("role", role as any);

      if (allQuestions && allQuestions.length > 0) {
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        }));
        setQuestions(selected as Question[]);
      }
    } catch (error) {
      console.error("Error fetching test questions:", error);
      toast({
        title: "Error loading test",
        description: "Unable to load test questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const handleSubmitTest = async () => {
    if (!workerProfileId || !role) return;

    let correctCount = 0;
    const questionsAnswered = questions.map((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        question_id: q.id,
        answer: userAnswer,
        correct: isCorrect,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 80;

    const lockoutUntil = passed
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const { error } = await supabase.from("test_attempts").insert({
      worker_profile_id: workerProfileId,
      role: role as any,
      score: score,
      passed: passed,
      questions_answered: questionsAnswered as any,
      lockout_until: lockoutUntil,
    });

    if (error) {
      toast({
        title: "Error submitting test",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: passed ? "Congratulations!" : "Test not passed",
        description: passed
          ? `You scored ${score}% and passed the test!`
          : `You scored ${score}%. You need 80% to pass. Try again in 30 days.`,
        variant: passed ? "default" : "destructive",
      });
      navigate("/worker/verification");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
            <CardDescription>
              Test questions for this role are not yet available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/worker/verification")}>
              Back to Verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/worker/verification")}
              title="Exit test"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">
              Skills Test: {role?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Timer className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress value={progress} className="w-full" />

        <Card>
          <CardHeader>
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <CardDescription>{currentQuestion.question_text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              key={currentQuestion.id}
              value={answers[currentQuestion.id]?.toString() ?? ""}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.id, parseInt(value))
              }
            >
              {currentQuestion.options.map((option, index) => (
                <div key={`${currentQuestion.id}-${index}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${currentQuestion.id}-${index}`} />
                  <Label htmlFor={`option-${currentQuestion.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2 pt-4">
              {currentQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                >
                  Previous
                </Button>
              )}
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={answers[currentQuestion.id] === undefined}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitTest}
                  disabled={Object.keys(answers).length < questions.length}
                >
                  Submit Test
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {Object.keys(answers).length} of {questions.length} questions answered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillsTest;
