import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuizList from "./QuizList";
import QuizInterface from "./QuizInterface";
import QuizResults from "./QuizResults";

const QuizTaker = () => {
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const handleQuizSubmit = () => {
    setSelectedQuiz(null);
  };

  if (selectedQuiz) {
    return (
      <QuizInterface
        quiz={selectedQuiz}
        onSubmit={handleQuizSubmit}
        onCancel={() => setSelectedQuiz(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            Available Quizzes
            <Sparkles className="w-4 h-4 text-accent ml-auto animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuizList
            onStartQuiz={setSelectedQuiz}
          />
        </CardContent>
      </Card>

      <QuizResults />
    </div>
  );
};

export default QuizTaker;