import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Plus, 
  Upload, 
  Download,
  Edit,
  Eye,
  Calendar,
  Award,
  Minus,
  GraduationCap,
  CheckCircle,
  Clock,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherCoursesProps {
  teacherData: any;
}

interface Question {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay" | "fill_blank";
  options?: string[];
  correct_answer: string;
  marks: number;
}

const TeacherCourses = ({ teacherData }: TeacherCoursesProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz creation states
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState("1");
  const [passPercentage, setPassPercentage] = useState("60");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Material upload states
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    material_type: 'document'
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  // Quiz grader states
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [scores, setScores] = useState({});
  const [isGrading, setIsGrading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [teacherData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseDetails();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments (count)
        `)
        .eq('instructor_id', teacherData.user_id)
        .eq('is_active', true);

      if (error) throw error;

      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async () => {
    if (!selectedCourse) return;

    try {
      // Fetch materials
      const { data: materialsData } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .order('uploaded_at', { ascending: false });

      // Fetch quizzes for this course
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (count),
          quiz_submissions (count)
        `)
        .eq('course_id', selectedCourse.id)
        .order('created_at', { ascending: false });

      // Fetch enrolled students
      const { data: studentsData } = await supabase
        .from('enrollments')
        .select(`
          *,
          user_profiles!enrollments_student_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('course_id', selectedCourse.id)
        .eq('status', 'enrolled');

      setMaterials(materialsData || []);
      setQuizzes(quizzesData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  // Quiz creation functions
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: "",
      question_type: "multiple_choice",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: "",
      marks: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const updated = { ...q, ...updates };
        if (updates.question_type && updates.question_type !== q.question_type) {
          updated.correct_answer = "";
          if (updates.question_type === "multiple_choice") {
            updated.options = ["Option A", "Option B", "Option C", "Option D"];
          } else if (updates.question_type === "true_false") {
            updated.options = undefined;
          } else {
            updated.options = undefined;
          }
        }
        return updated;
      }
      return q;
    }));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value || `Option ${String.fromCharCode(65 + optionIndex)}`;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`];
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 2) {
        const newOptions = q.options.filter((_, index) => index !== optionIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const createQuiz = async () => {
    if (!selectedCourse || !quizName || questions.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a quiz name and add at least one question",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question_text.trim()) {
        toast({
          title: "Error",
          description: "All questions must have text",
          variant: "destructive",
        });
        return;
      }
      if (question.question_type !== "essay" && !question.correct_answer.trim()) {
        toast({
          title: "Error",
          description: "All questions (except essay) must have a correct answer",
          variant: "destructive",
        });
        return;
      }
    }

    setIsCreatingQuiz(true);
    try {
      const quizData = {
        course_id: selectedCourse.id,
        quiz_name: quizName,
        description: quizDescription || null,
        time_limit_minutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
        attempts_allowed: parseInt(attemptsAllowed),
        pass_percentage: parseFloat(passPercentage),
        created_by: teacherData.user_id,
        is_active: true
      };

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert(quizData)
        .select()
        .single();

      if (quizError) throw quizError;

      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === "multiple_choice" ? q.options : [],
        correct_answer: q.correct_answer || null,
        marks: q.marks,
        order_index: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: "Quiz created successfully",
      });

      // Reset form
      setQuizName("");
      setQuizDescription("");
      setTimeLimitMinutes("");
      setAttemptsAllowed("1");
      setPassPercentage("60");
      setQuestions([]);
      fetchCourseDetails();
    } catch (error: any) {
      console.error("Quiz creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const toggleQuizStatus = async (quizId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_active: isActive })
        .eq("id", quizId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Quiz ${isActive ? "activated" : "deactivated"} successfully`,
      });

      fetchCourseDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update quiz status",
        variant: "destructive",
      });
    }
  };

  // Quiz grader functions
  const fetchSubmissions = async () => {
    if (!selectedCourse) return;

    try {
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('course_id', selectedCourse.id);

      if (!quizzesData || quizzesData.length === 0) {
        setSubmissions([]);
        return;
      }

      const quizIds = quizzesData.map(q => q.id);

      const { data: submissionsData } = await supabase
        .from('quiz_submissions')
        .select(`
          *,
          quizzes!inner(quiz_name),
          user_profiles!inner(first_name, last_name, email)
        `)
        .in('quiz_id', quizIds)
        .order('submitted_at', { ascending: false });

      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchSubmissionDetails = async (submission) => {
    try {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', submission.quiz_id)
        .order('order_index');

      setSubmissionDetails({
        questions: questions || [],
        answers: submission.answers || {},
      });
    } catch (error) {
      console.error('Error fetching submission details:', error);
    }
  };

  const selectSubmission = async (submission) => {
    setSelectedSubmission(submission);
    setScores({});
    await fetchSubmissionDetails(submission);
  };

  const updateQuestionScore = (questionId, score, maxPoints) => {
    const numericScore = typeof score === 'string' ? parseFloat(score) : score;
    const validScore = isNaN(numericScore) ? 0 : Math.max(0, Math.min(numericScore, maxPoints));
    setScores(prev => ({ ...prev, [questionId]: validScore }));
  };

  const submitGrades = async () => {
    if (!selectedSubmission || !submissionDetails) return;

    setIsGrading(true);
    try {
      const totalScore = submissionDetails.questions.reduce((sum, question) => {
        const questionScore = scores[question.id] || 0;
        return sum + questionScore;
      }, 0);

      const { error } = await supabase
        .from('quiz_submissions')
        .update({ 
          score: Math.round(totalScore),
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Grades submitted successfully! Total score: ${Math.round(totalScore)}`,
      });

      setSelectedSubmission(null);
      setScores({});
      setSubmissionDetails(null);
      fetchSubmissions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit grades",
        variant: "destructive",
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleUploadMaterial = async (file: File) => {
    if (!file) return;

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${selectedCourse.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      // Insert material record into database
      const { error: dbError } = await supabase
        .from('lecture_materials')
        .insert({
          ...newMaterial,
          course_id: selectedCourse.id,
          uploaded_by: teacherData.user_id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Material uploaded successfully'
      });

      setNewMaterial({ title: '', description: '', material_type: 'document' });
      fetchCourseDetails();
    } catch (error: any) {
      console.error('Error uploading material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload material',
        variant: 'destructive'
      });
    }
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="flex flex-wrap gap-3">
        {courses.map((course) => (
          <Button
            key={course.id}
            variant={selectedCourse?.id === course.id ? "default" : "outline"}
            onClick={() => setSelectedCourse(course)}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate max-w-[100px] sm:max-w-none">{course.course_name}</span>
            <Badge variant="secondary" className="text-xs">{course.enrollments?.[0]?.count || 0}</Badge>
          </Button>
        ))}
      </div>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{selectedCourse.course_name} ({selectedCourse.course_code})</span>
              </div>
              <Badge variant="outline" className="text-xs">{selectedCourse.credits} Credits</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="materials" className="w-full">
              <div className="w-full overflow-x-auto overflow-y-visible -mx-2 px-2 md:mx-0 md:px-0">
                <TabsList className="inline-flex md:grid w-max md:w-full md:grid-cols-6 h-auto flex-nowrap md:flex-wrap gap-1 p-1">
                  <TabsTrigger value="materials" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Materials</TabsTrigger>
                  <TabsTrigger value="quizzes" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Quiz List</TabsTrigger>
                  <TabsTrigger value="quiz-creator" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Create Quiz</TabsTrigger>
                  <TabsTrigger value="quiz-grader" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Grade Quizzes</TabsTrigger>
                  <TabsTrigger value="students" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Students</TabsTrigger>
                  <TabsTrigger value="progress" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Progress</TabsTrigger>
                </TabsList>
              </div>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-4 mt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Lecture Materials</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        Upload Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] sm:w-full max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Upload Lecture Material</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Material title"
                          value={newMaterial.title}
                          onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                          className="text-sm"
                        />
                        <Textarea
                          placeholder="Description"
                          value={newMaterial.description}
                          onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                          className="text-sm"
                        />
                        <select
                          className="w-full p-2 border rounded bg-black text-sm"
                          value={newMaterial.material_type}
                          onChange={(e) => setNewMaterial({...newMaterial, material_type: e.target.value})}
                        >
                          <option value="document">Document</option>
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                          <option value="presentation">Presentation</option>
                        </select>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadMaterial(file);
                          }}
                          className="text-sm"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {materials.map((material) => (
                    <Card key={material.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">{material.title}</p>
                              <p className="text-xs sm:text-sm mt-1">{material.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Badge variant="outline" className="text-xs flex-1 sm:flex-initial justify-center">{material.material_type}</Badge>
                              <Button size="sm" variant="outline" className="flex-shrink-0">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Quiz List Tab */}
              <TabsContent value="quizzes" className="space-y-4 mt-4">
                <h3 className="text-base sm:text-lg font-semibold">Course Quizzes</h3>
                <div className="grid gap-4">
                  {quizzes.map((quiz) => (
                    <Card key={quiz.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">{quiz.quiz_name}</p>
                              <p className="text-xs sm:text-sm mt-1 line-clamp-2">{quiz.description}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {quiz.time_limit_minutes && (
                                <span className="px-2 py-1 bg-muted rounded">
                                  {quiz.time_limit_minutes} min
                                </span>
                              )}
                              <span className="px-2 py-1 bg-muted rounded">
                                {quiz.attempts_allowed} attempt(s)
                              </span>
                              <span className="px-2 py-1 bg-muted rounded">
                                Pass: {quiz.pass_percentage}%
                              </span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(quiz.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t">
                            <div className="flex flex-wrap gap-2 flex-1">
                              <Badge variant="outline" className="text-xs">
                                {quiz.quiz_questions?.[0]?.count || 0} questions
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {quiz.quiz_attempts?.[0]?.count || 0} attempts
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Switch
                                checked={quiz.is_active}
                                onCheckedChange={(checked) => toggleQuizStatus(quiz.id, checked)}
                              />
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Quiz Creator Tab */}
              <TabsContent value="quiz-creator" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">Create Quiz for {selectedCourse.course_name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="quizName" className="text-xs sm:text-sm">Quiz Name</Label>
                      <Input
                        id="quizName"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        placeholder="e.g., Chapter 5 Assessment"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="Quiz description (optional)"
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="timeLimitMinutes" className="text-xs sm:text-sm">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimitMinutes"
                          type="number"
                          value={timeLimitMinutes}
                          onChange={(e) => setTimeLimitMinutes(e.target.value)}
                          placeholder="No limit"
                          min="1"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="attemptsAllowed" className="text-xs sm:text-sm">Attempts Allowed</Label>
                        <Input
                          id="attemptsAllowed"
                          type="number"
                          value={attemptsAllowed}
                          onChange={(e) => setAttemptsAllowed(e.target.value)}
                          min="1"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passPercentage" className="text-xs sm:text-sm">Pass Percentage (%)</Label>
                        <Input
                          id="passPercentage"
                          type="number"
                          value={passPercentage}
                          onChange={(e) => setPassPercentage(e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <Label className="text-xs sm:text-sm">Questions</Label>
                        <div className="text-xs sm:text-sm">
                          Total Marks: {getTotalMarks()}
                        </div>
                      </div>

                      {questions.map((question, index) => (
                        <Card key={question.id} className="p-3 sm:p-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <Label className="text-xs sm:text-sm">Question {index + 1}</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>

                            <Textarea
                              value={question.question_text}
                              onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                              placeholder="Enter your question"
                              rows={3}
                              className="text-sm"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs sm:text-sm">Question Type</Label>
                                <Select
                                  value={question.question_type}
                                  onValueChange={(value: any) => updateQuestion(question.id, { question_type: value })}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true_false">True/False</SelectItem>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs sm:text-sm">Marks</Label>
                                <Input
                                  type="number"
                                  value={question.marks}
                                  onChange={(e) => updateQuestion(question.id, { marks: parseInt(e.target.value) || 1 })}
                                  min="1"
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {question.question_type === "multiple_choice" && (
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <Label className="text-xs sm:text-sm">Options</Label>
                                  <Button 
                                    type="button" 
                                    onClick={() => addOption(question.id)}
                                    size="sm"
                                    variant="outline"
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                      className="text-sm"
                                    />
                                    {question.options && question.options.length > 2 && (
                                      <Button
                                        type="button"
                                        onClick={() => removeOption(question.id, optionIndex)}
                                        size="sm"
                                        variant="outline"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.question_type !== "essay" && (
                              <div>
                                <Label className="text-xs sm:text-sm">Correct Answer</Label>
                                {question.question_type === "multiple_choice" ? (
                                  <Select
                                    value={question.correct_answer}
                                    onValueChange={(value) => updateQuestion(question.id, { correct_answer: value })}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Select correct option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {question.options?.filter(option => option.trim() !== "").map((option, optionIndex) => (
                                        <SelectItem key={optionIndex} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : question.question_type === "true_false" ? (
                                  <Select
                                    value={question.correct_answer}
                                    onValueChange={(value) => updateQuestion(question.id, { correct_answer: value })}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Select correct answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">True</SelectItem>
                                      <SelectItem value="false">False</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={question.correct_answer}
                                    onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                                    placeholder="Enter correct answer"
                                    className="text-sm"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}

                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={addQuestion} 
                          variant="outline"
                          className="px-3 py-1 text-xs sm:text-sm"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    </div>

                    <Button onClick={createQuiz} disabled={isCreatingQuiz} className="w-full text-sm">
                      {isCreatingQuiz ? "Creating..." : "Create Quiz"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz Grader Tab */}
              <TabsContent value="quiz-grader" className="space-y-4 mt-4">
                {selectedSubmission ? (
                  <Card className="w-full">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
                          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">Grading: {selectedSubmission.quizzes?.quiz_name}</span>
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedSubmission(null);
                            setScores({});
                            setSubmissionDetails(null);
                          }}
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="hidden sm:inline">Back to Submissions</span>
                          <span className="sm:hidden">Back</span>
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Student: {selectedSubmission.user_profiles?.first_name} {selectedSubmission.user_profiles?.last_name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          Email: {selectedSubmission.user_profiles?.email}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-muted rounded-lg">
                        <Button 
                          onClick={submitGrades} 
                          disabled={isGrading || !submissionDetails}
                          className="min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm"
                        >
                          {isGrading ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              Submitting...
                            </div>
                          ) : (
                            "Submit Grades"
                          )}
                        </Button>
                      </div>

                      {submissionDetails?.questions.map((question, index) => {
                        const studentAnswer = submissionDetails.answers[question.id];
                        const isCorrect = studentAnswer === question.correct_answer;
                        const currentScore = scores[question.id] || 0;

                        return (
                          <Card key={question.id} className="p-3 sm:p-4 border-l-4 border-l-primary bg-black/50">
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm sm:text-base lg:text-lg">Question {index + 1}</p>
                                  <p className="mt-1 text-xs sm:text-sm">{question.question_text}</p>
                                </div>
                                <div className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">
                                  <p>Worth {question.marks || 1} point{(question.marks || 1) !== 1 ? 's' : ''}</p>
                                  <p className="capitalize">{question.question_type.replace('_', ' ')}</p>
                                </div>
                              </div>

                              {question.question_type === "multiple_choice" && (
                                <div className="space-y-2">
                                  <p className="text-xs sm:text-sm font-medium">Answer Choices:</p>
                                  <div className="grid gap-2">
                                    {question.options?.map((option, optIndex) => {
                                      let bgColor = " border-gray-300";
                                      let textColor = "text-foreground";
                                      let icon = "";
                                      
                                      if (option === question.correct_answer) {
                                        bgColor = "bg-green-700 border-green-300";
                                        textColor = "text-white";
                                        icon = " ✓ Correct";
                                      } else if (option === studentAnswer) {
                                        bgColor = "bg-red-700 border-red-300";
                                        textColor = "text-white";
                                        icon = " ✗ Selected";
                                      }

                                      return (
                                        <div 
                                          key={optIndex} 
                                          className={`p-2 sm:p-3 rounded border text-xs sm:text-sm ${bgColor} ${textColor}`}
                                        >
                                          <strong>{String.fromCharCode(65 + optIndex)}.</strong> {option}{icon}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {question.question_type === "true_false" && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-2 sm:p-3 rounded border text-xs sm:text-sm ${
                                      question.correct_answer === "true" 
                                        ? "bg-green-700 border-green-300 " 
                                        : studentAnswer === "true"
                                        ? "bg-red-700 border-red-300"
                                        : "bg-gray-700"
                                    }`}>
                                      <strong>True</strong> 
                                      {question.correct_answer === "true" && " ✓ Correct"}
                                      {studentAnswer === "true" && question.correct_answer !== "true" && " ✗ Selected"}
                                    </div>
                                    <div className={`p-2 sm:p-3 rounded border text-xs sm:text-sm ${
                                      question.correct_answer === "false" 
                                        ? "bg-green-700 border-green-300 " 
                                        : studentAnswer === "true"
                                        ? "bg-red-700 border-red-300"
                                        : "bg-gray-700"
                                    }`}>
                                      <strong>False</strong> 
                                      {question.correct_answer === "false" && " ✓ Correct"}
                                      {studentAnswer === "false" && question.correct_answer !== "false" && " ✗ Selected"}
                                    </div>
                                  </div>
                                  <p className={`text-xs sm:text-sm font-medium ${
                                    isCorrect ? "text-green-600" : "text-red-600"
                                  }`}>
                                    Student answered: <strong>{studentAnswer || "No answer"}</strong>
                                    {studentAnswer && (isCorrect ? " ✓" : " ✗")}
                                  </p>
                                </div>
                              )}

                              {question.question_type === "short_answer" && (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium mb-1">Expected Answer:</p>
                                    <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded text-xs sm:text-sm">
                                      {question.correct_answer}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium mb-1">Student's Answer:</p>
                                    <div className="p-2 sm:p-3 bg-gray-50 border rounded min-h-[60px] text-xs sm:text-sm">
                                      {studentAnswer || <em className="text-muted-foreground">No answer provided</em>}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 sm:p-3 bg-muted rounded">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-1">
                                  <Label htmlFor={`score-${question.id}`} className="font-medium text-xs sm:text-sm">
                                    Assign Score:
                                  </Label>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Input
                                      id={`score-${question.id}`}
                                      type="number"
                                      min="0"
                                      max={question.marks || 1}
                                      step="1"
                                      value={currentScore}
                                      onChange={(e) => updateQuestionScore(question.id, e.target.value, question.marks || 1)}
                                      className="w-20 text-sm"
                                      placeholder="0"
                                    />
                                    <span className="text-xs sm:text-sm text-muted-foreground">/ {question.marks || 1}</span>
                                  </div>
                                </div>
                                <div className="text-xs sm:text-sm">
                                  {question.question_type !== "short_answer" && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}>
                                      {isCorrect ? "Correct" : "Incorrect"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                            Quiz Submissions to Grade
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Review and grade student quiz submissions for {selectedCourse.course_name}
                          </p>
                        </div>
                        <Button 
                          onClick={() => fetchSubmissions()} 
                          variant="outline" 
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {!submissions || submissions.length === 0 ? (
                          <div className="text-center py-8">
                            <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-2 text-sm sm:text-base">No submissions to grade yet.</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Quiz submissions will appear here once students start taking your quizzes.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs sm:text-sm text-green-800">
                                Found {submissions.length} submission{submissions.length !== 1 ? 's' : ''} to review
                              </p>
                            </div>
                            {submissions.map((submission) => {
                              const graded = submission.score !== null && submission.score !== undefined;
                              return (
                                <div key={submission.id} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                                    <div className="flex-1 w-full min-w-0">
                                      <h4 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{submission.quizzes?.quiz_name}</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                                        <p className="truncate"><strong>Student:</strong> {submission.user_profiles?.first_name} {submission.user_profiles?.last_name}</p>
                                        <p className="truncate"><strong>Email:</strong> {submission.user_profiles?.email}</p>
                                        <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                                        <p><strong>Current Score:</strong> {graded ? submission.score : 'Not graded'}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
                                      {graded ? (
                                        <div className="text-left sm:text-right flex-1 sm:flex-initial">
                                          <div className="flex items-center gap-2 text-green-600 mb-1">
                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="text-xs sm:text-sm font-medium">Graded</span>
                                          </div>
                                          <p className="text-base sm:text-lg font-bold">
                                            {submission.score}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="text-left sm:text-right flex-1 sm:flex-initial">
                                          <div className="flex items-center gap-2 text-orange-600 mb-1">
                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="text-xs sm:text-sm font-medium">Pending</span>
                                          </div>
                                          <p className="text-xs sm:text-sm text-muted-foreground">Not graded</p>
                                        </div>
                                      )}
                                      <Button 
                                        onClick={() => selectSubmission(submission)}
                                        size="sm"
                                        variant={graded ? "outline" : "default"}
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                      >
                                        {graded ? "Review/Regrade" : "Grade"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4 mt-4">
                <h3 className="text-base sm:text-lg font-semibold">Enrolled Students ({students.length})</h3>
                
                <div className="grid gap-4">
                  {students.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base">
                                {enrollment.user_profiles?.first_name} {enrollment.user_profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{enrollment.user_profiles?.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'} className="text-xs">
                                {enrollment.status}
                              </Badge>
                              {enrollment.grade && (
                                <Badge variant="outline" className="text-xs">{enrollment.grade}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-4 mt-4">
                <h3 className="text-base sm:text-lg font-semibold">Course Progress Overview</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-bold">{materials.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Materials Uploaded</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-bold">{quizzes.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Quizzes Created</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-bold">{students.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Enrolled Students</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherCourses;