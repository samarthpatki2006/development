import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Calendar, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuizListProps {
  onStartQuiz: (quiz: any) => void;
  takenQuizIds: Set<string>;
}

const QuizList = ({ onStartQuiz, takenQuizIds }: QuizListProps) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizzesAndSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setQuizzes([]);
          return;
        }

        console.log("Fetching quizzes for student:", user.user.id);

        // Get user's enrollments first to find their courses
        const { data: enrollments, error: enrollmentError } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user.user.id)
          .eq("status", "enrolled");

        if (enrollmentError) {
          console.error("Error fetching enrollments:", enrollmentError);
          setError("Failed to load your enrollments");
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log("No enrollments found");
          setQuizzes([]);
          setIsLoading(false);
          return;
        }

        const courseIds = enrollments.map(e => e.course_id);
        console.log("Found course IDs:", courseIds);

        // Get active quizzes from enrolled courses
        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select(`
            *,
            courses!inner (
              id,
              course_name,
              course_code,
              instructor_id,
              user_profiles!courses_instructor_id_fkey (
                first_name,
                last_name
              )
            )
          `)
          .in("course_id", courseIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (quizzesError) {
          console.error("Error fetching quizzes:", quizzesError);
          setError("Failed to load quizzes");
          return;
        }

        console.log("Found quizzes:", quizzesData);

        // Get user's quiz submissions to check completion status and attempts
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("quiz_submissions")
          .select("quiz_id, attempt_number, score, total_possible, submitted_at, is_completed")
          .eq("student_id", user.user.id)
          .in("quiz_id", quizzesData?.map(q => q.id) || []);

        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
        }

        setQuizzes(quizzesData || []);
        setQuizSubmissions(submissionsData || []);

      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzesAndSubmissions();
  }, []);

  const getQuizStatus = (quiz: any) => {
    const submissions = quizSubmissions.filter(s => s.quiz_id === quiz.id);
    
    if (submissions.length === 0) {
      return { 
        status: 'not_attempted', 
        label: 'Not Started', 
        canAttempt: true,
        attempts: 0
      };
    }

    const completedSubmissions = submissions.filter(s => s.is_completed);
    const maxAttempts = quiz.attempts_allowed || Infinity;
    const currentAttempts = submissions.length;

    if (completedSubmissions.length > 0) {
      const bestScore = Math.max(...completedSubmissions.map(s => s.score || 0));
      const bestTotal = completedSubmissions.find(s => s.score === bestScore)?.total_possible || 1;
      const percentage = bestTotal > 0 ? (bestScore / bestTotal) * 100 : 0;
      const passed = percentage >= (quiz.pass_percentage || 60);

      return {
        status: passed ? 'passed' : 'failed',
        label: passed ? `Passed (${percentage.toFixed(1)}%)` : `Failed (${percentage.toFixed(1)}%)`,
        canAttempt: currentAttempts < maxAttempts,
        attempts: currentAttempts,
        bestScore: bestScore,
        bestTotal: bestTotal
      };
    }

    return {
      status: 'in_progress',
      label: 'In Progress',
      canAttempt: currentAttempts < maxAttempts,
      attempts: currentAttempts
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'in_progress':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4  rounded w-3/4 mb-2"></div>
              <div className="h-3  rounded w-1/2 mb-4"></div>
              <div className="h-8  rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-2 font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No quizzes available.</p>
          <p className="text-sm text-muted-foreground">
            Contact your instructor if you expect to see quizzes here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz: any) => {
        const quizStatus = getQuizStatus(quiz);
        const maxAttempts = quiz.attempts_allowed || '∞';
        
        return (
          <Card key={quiz.id} className={`transition-all duration-200 hover:shadow-md ${getStatusColor(quizStatus.status)}`}>
            <CardContent className="p-6 bg-black rounded-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(quizStatus.status)}
                    <h3 className="font-semibold text-lg">{quiz.quiz_name}</h3>
                  </div>
                  
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {quiz.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{quiz.courses?.course_name} ({quiz.courses?.course_code})</span>
                      </div>
                      
                      {quiz.courses?.user_profiles && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {quiz.courses.user_profiles.first_name} {quiz.courses.user_profiles.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {quiz.time_limit_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{quiz.time_limit_minutes} minutes</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <span>Attempts: {quizStatus.attempts}/{maxAttempts}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span>Pass: {quiz.pass_percentage || 60}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quizStatus.status === 'passed' ? ' text-green-800' :
                          quizStatus.status === 'failed' ? ' text-red-800' :
                          quizStatus.status === 'in_progress' ? ' text-orange-800' :
                          ' text-gray-800'
                        }`}>
                          {quizStatus.label}
                        </span>
                        
                        {quizStatus.bestScore !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            Best: {quizStatus.bestScore}/{quizStatus.bestTotal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Button 
                    onClick={() => onStartQuiz(quiz)}
                    disabled={!quizStatus.canAttempt}
                    variant={quizStatus.status === 'passed' ? 'outline' : 'default'}
                    size="sm"
                  >
                    {!quizStatus.canAttempt ? 'No Attempts Left' :
                     quizStatus.status === 'passed' ? 'Retake Quiz' :
                     quizStatus.status === 'failed' ? 'Retry Quiz' :
                     quizStatus.status === 'in_progress' ? 'Continue Quiz' :
                     'Start Quiz'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuizList;