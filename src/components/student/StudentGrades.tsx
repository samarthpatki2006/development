import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, BookOpen, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const StudentGrades = () => {
  const [grades, setGrades] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setError('User not authenticated');
        return;
      }

      // Fetch grades with course information
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code
          )
        `)
        .eq("student_id", user.user.id)
        .order("recorded_at", { ascending: false });

      if (gradesError) {
        console.error('Error fetching grades:', gradesError);
        setError('Failed to fetch grades');
      } else {
        setGrades(gradesData || []);
      }

      // Fetch quiz submissions with quiz and course details
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select(`
          *,
          quizzes (
            id,
            quiz_name,
            course_id,
            weightage,
            courses (
              id,
              course_name,
              course_code
            )
          )
        `)
        .eq("student_id", user.user.id)
        .not("score", "is", null)
        .order("submitted_at", { ascending: false });

      if (submissionsError) {
        console.error('Error fetching quiz submissions:', submissionsError);
        setError('Failed to fetch quiz submissions');
      } else {
        setQuizSubmissions(submissionsData || []);
      }

    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculatePercentage = (obtained, max) => {
    return max > 0 ? (obtained / max) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading grades...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-minimal border-red-200">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium">Error loading data</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button 
              onClick={fetchStudentData}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group grades by course
  const groupedGrades = grades.reduce((acc, grade) => {
    const courseId = grade.course_id;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: grade.courses,
        grades: []
      };
    }
    acc[courseId].grades.push(grade);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Overall Grades by Course */}
      <Card className="card-minimal glass-effect border-primary/20">
        <CardHeader className="border-b border-primary/20">
          <CardTitle className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            Course Grades
            <Award className="w-4 h-4 text-accent ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {Object.keys(groupedGrades).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No course grades available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Grades will appear here once your educator assigns them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedGrades).map(([courseId, courseData]) => {
                // Calculate overall course performance
                const courseGrades = courseData.grades;
                const totalMarks = courseGrades.reduce((sum, grade) => sum + (grade.max_marks || 0), 0);
                const obtainedMarks = courseGrades.reduce((sum, grade) => sum + (grade.marks_obtained || 0), 0);
                const overallPercentage = calculatePercentage(obtainedMarks, totalMarks);
                const letterGrade = getLetterGrade(overallPercentage);
                
                return (
                  <Card key={courseId} className="glass-effect border-l-4 border-l-accent">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {courseData.course?.course_name || 'Unknown Course'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {courseData.course?.course_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {courseGrades.length} assessment{courseGrades.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${getGradeColor(overallPercentage)}`}>
                            {letterGrade}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {overallPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Individual Grades Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-accent" />
                          Assessment Breakdown
                        </h4>
                        
                        <div className="space-y-2">
                          {courseGrades.map((grade) => {
                            const percentage = calculatePercentage(grade.marks_obtained, grade.max_marks);
                            return (
                              <div key={grade.id} className="flex justify-between items-center p-2 bg-background/30 rounded border border-primary/20">
                                <div>
                                  <span className="text-sm text-foreground font-medium">
                                    {grade.grade_type?.charAt(0).toUpperCase() + grade.grade_type?.slice(1) || 'Assessment'}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(grade.recorded_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`font-medium ${getGradeColor(percentage)}`}>
                                    {grade.marks_obtained}/{grade.max_marks}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({percentage.toFixed(1)}%)
                                  </span>
                                  {grade.grade_letter && (
                                    <div className={`text-xs font-bold ${getGradeColor(percentage)}`}>
                                      {grade.grade_letter}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Quiz Results */}
      <Card className="card-minimal glass-effect border-primary/20">
        <CardHeader className="border-b border-primary/20">
          <CardTitle className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            Quiz Results
            <TrendingUp className="w-4 h-4 text-accent ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {quizSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No quiz results available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Complete quizzes to see your results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizSubmissions.map((submission) => {
                const percentage = calculatePercentage(submission.score, submission.total_possible);
                
                return (
                  <div key={submission.id} className="flex justify-between items-center p-3 glass-effect rounded border border-primary/20 hover:border-accent/40 transition-all">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {submission.quizzes?.quiz_name || 'Unknown Quiz'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        📚 {submission.quizzes?.courses?.course_name} ({submission.quizzes?.courses?.course_code})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      {submission.attempt_number > 1 && (
                        <p className="text-xs text-accent">
                          Attempt #{submission.attempt_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-2">
                        <p className={`font-bold ${getGradeColor(percentage)}`}>
                          {submission.score}/{submission.total_possible}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                      {submission.quizzes?.weightage > 0 && (
                        <p className="text-xs text-accent mt-1">
                          Weight: {submission.quizzes.weightage}%
                        </p>
                      )}
                      {submission.time_taken_minutes && (
                        <p className="text-xs text-muted-foreground">
                          Time: {submission.time_taken_minutes}min
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentGrades;