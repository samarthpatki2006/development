
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface QuestionEditorProps {
  question: any;
  index: number;
  updateQuestion: (id: string, field: string, value: any) => void;
  updateOption: (questionId: string, optionIndex: number, value: string) => void;
  deleteQuestion: () => void;
  moveQuestion: (id: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const QuestionEditor = ({
  question,
  index,
  updateQuestion,
  updateOption,
  deleteQuestion,
  moveQuestion,
  isFirst,
  isLast,
}: QuestionEditorProps) => {
  return (
    <Card className="glass-effect border-accent/20">
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h4 className="font-medium text-foreground text-sm sm:text-base">Question {index + 1}</h4>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveQuestion(question.id, 'up')}
              disabled={isFirst}
              className="border-accent/30"
            >
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => moveQuestion(question.id, 'down')}
              disabled={isLast}
              className="border-accent/30"
            >
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteQuestion}
              className="border-red-500/30 text-red-400 hover:border-red-500"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`question-${question.id}`} className="text-xs sm:text-sm">Question Text</Label>
            <Textarea
              id={`question-${question.id}`}
              value={question.question_text}
              onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
              placeholder="Enter your question"
              className="bg-background/50 border-primary/20 focus:border-accent text-sm"
            />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`type-${question.id}`} className="text-xs sm:text-sm">Question Type</Label>
              <Select
                value={question.question_type}
                onValueChange={(value) => updateQuestion(question.id, 'question_type', value)}
              >
                <SelectTrigger className="bg-background/50 border-primary/20 focus:border-accent text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`points-${question.id}`} className="text-xs sm:text-sm">Points</Label>
              <Input
                id={`points-${question.id}`}
                type="number"
                value={question.points}
                onChange={(e) => updateQuestion(question.id, 'points', Number(e.target.value))}
                min="1"
                className="bg-background/50 border-primary/20 focus:border-accent text-sm"
              />
            </div>
          </div>
        </div>

        {question.question_type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm">Answer Options</Label>
            {question.options.map((option: string, optionIndex: number) => (
              <div key={optionIndex} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                  className="bg-background/50 border-primary/20 focus:border-accent text-sm flex-1"
                />
                <Button
                  type="button"
                  variant={question.correct_answer === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQuestion(question.id, 'correct_answer', option)}
                  className={`${question.correct_answer === option ? "bg-accent" : "border-accent/30"} w-full sm:w-auto text-xs sm:text-sm`}
                >
                  {question.correct_answer === option ? "✓" : "Set Correct"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {question.question_type === 'true_false' && (
          <div className="space-y-2">
<<<<<<< HEAD
            <Label>Correct Answer</Label>
=======
            <Label className="text-xs sm:text-sm">Correct Answer</Label>
>>>>>>> samarth-pr
            <Select
              value={question.correct_answer}
              onValueChange={(value) => updateQuestion(question.id, 'correct_answer', value)}
            >
<<<<<<< HEAD
              <SelectTrigger className="bg-background/50 border-primary/20 focus:border-accent">
=======
              <SelectTrigger className="bg-background/50 border-primary/20 focus:border-accent text-sm">
>>>>>>> samarth-pr
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {question.question_type === 'short_answer' && (
          <div className="space-y-2">
            <Label htmlFor={`answer-${question.id}`} className="text-xs sm:text-sm">Sample Answer (Optional)</Label>
            <Textarea
              id={`answer-${question.id}`}
              value={question.correct_answer}
              onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value)}
              placeholder="Enter a sample answer or grading notes"
              className="bg-background/50 border-primary/20 focus:border-accent text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionEditor;
