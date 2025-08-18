import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizInterfaceProps {
  quiz: any;
  onSubmit: () => void;
  onCancel: () => void;
}

const QuizInterface = ({ quiz, onSubmit, onCancel }: QuizInterfaceProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch quiz questions
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id)
        .order("order_index");

      if (error) {
        throw error;
      }

      setQuestions(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load quiz questions: " + err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [quiz.id]);

  useEffect(() => {
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  }, [quiz.time_limit_minutes]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining !== null && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
    } else if (timeRemaining === 0) {
      submitQuiz();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining]);

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      // Calculate total possible score from questions
      const totalPossible = questions.reduce((sum, question) => sum + (question.marks || 1), 0);

      // Calculate time taken
      const timeTaken = quiz.time_limit_minutes ? 
        (quiz.time_limit_minutes * 60 - (timeRemaining || 0)) / 60 : 0;

      const { error } = await supabase
        .from("quiz_submissions")
        .insert({
          quiz_id: quiz.id,
          student_id: user.user.id,
          answers: answers,
          total_possible: totalPossible,
          time_taken_minutes: Math.round(timeTaken),
          attempt_number: 1, // You might want to calculate this based on existing attempts
          is_completed: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz submitted successfully",
      });

      onSubmit();
    } catch (error: any) {
      console.error("Quiz submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total points from questions
  const totalPoints = questions.reduce((sum, question) => sum + (question.marks || 1), 0);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading quiz questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading quiz: {error}</p>
          <Button onClick={fetchQuestions} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {quiz.quiz_name}
          </CardTitle>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {quiz.course?.course_name} • {totalPoints} points
        </p>
        {quiz.description && (
          <p className="text-sm text-muted-foreground">{quiz.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No questions available for this quiz.</p>
          </div>
        ) : (
          questions.map((question: any, index: number) => (
            <Card key={question.id} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Question {index + 1}
                    </p>
                    <p className="font-medium">{question.question_text}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {question.marks || 1} point{(question.marks || 1) !== 1 ? 's' : ''}
                  </span>
                </div>

                {question.question_type === "multiple_choice" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => updateAnswer(question.id, value)}
                  >
                    {question.options?.map((option: string, optionIndex: number) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`${question.id}-${optionIndex}`} 
                        />
                        <Label 
                          htmlFor={`${question.id}-${optionIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.question_type === "true_false" && (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => updateAnswer(question.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`${question.id}-true`} />
                      <Label 
                        htmlFor={`${question.id}-true`}
                        className="cursor-pointer"
                      >
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`${question.id}-false`} />
                      <Label 
                        htmlFor={`${question.id}-false`}
                        className="cursor-pointer"
                      >
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {question.question_type === "short_answer" && (
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer"
                    rows={3}
                  />
                )}

                {question.question_type === "essay" && (
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Write your essay answer"
                    rows={6}
                  />
                )}

                {question.question_type === "fill_blank" && (
                  <div className="space-y-2">
                    <Label htmlFor={`answer-${question.id}`}>Your Answer:</Label>
                    <Textarea
                      id={`answer-${question.id}`}
                      value={answers[question.id] || ""}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      placeholder="Fill in the blank"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))
        )}

        <div className="flex gap-4 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={submitQuiz} 
            disabled={isSubmitting || questions.length === 0} 
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>

        {questions.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {Object.keys(answers).length} of {questions.length} questions answered
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizInterface;