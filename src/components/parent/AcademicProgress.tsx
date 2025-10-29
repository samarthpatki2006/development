
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { BookOpen, TrendingUp, Award, FileText } from 'lucide-react';

interface AcademicProgressProps {
  user: any;
}

const AcademicProgress = ({ user }: AcademicProgressProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [grades, setGrades] = useState<any[]>([]);
  const [progressReports, setProgressReports] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchAcademicData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase.rpc('get_parent_children', {
        parent_uuid: user.user_id
      });

      if (error) throw error;
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: 'Error',
        description: 'Failed to load children data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicData = async (studentId: string) => {
    try {
      setLoading(true);

      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          courses (course_name, course_code),
          assignments (title)
        `)
        .eq('student_id', studentId)
        .order('recorded_at', { ascending: false });

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Fetch progress reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('student_progress_reports')
        .select(`
          *,
          courses (course_name),
          user_profiles!teacher_id (first_name, last_name)
        `)
        .eq('student_id', studentId)
        .eq('shared_with_parents', true)
        .order('generated_at', { ascending: false });

      if (reportsError) throw reportsError;
      setProgressReports(reportsData || []);

      // Fetch assignment submissions
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments (
            title,
            max_marks,
            due_date,
            courses (course_name)
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error('Error fetching academic data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedChildName = children.find(child => child.student_id === selectedChild)?.student_name || '';

  return (
    <div className="space-y-6 animate-fade-in-up px-3 sm:px-4 md:px-6 overflow-x-hidden w-full">
      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.student_id} value={child.student_id}>
                  {child.student_name} ({child.user_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* Overall Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Overall Performance - {selectedChildName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-900/50 border border-blue-500/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                    {grades.length > 0
                      ? Math.round(grades.reduce((sum, grade) => sum + (grade.marks_obtained / grade.max_marks * 100), 0) / grades.length)
                      : 0}%
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Average Score</p>
                </div>
                <div className="text-center p-4 bg-gray-900/50 border border-green-500/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-green-400">
                    {grades.length > 0
                      ? getGradeLetter(grades.reduce((sum, grade) => sum + (grade.marks_obtained / grade.max_marks * 100), 0) / grades.length)
                      : 'N/A'}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Overall Grade</p>
                </div>
                <div className="text-center p-4 bg-gray-900/50 border border-purple-500/20 rounded-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400">{grades.length}</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Total Assessments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Course-wise Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grades.reduce((courses: any[], grade) => {
                  const existingCourse = courses.find(c => c.course_id === grade.course_id);
                  if (existingCourse) {
                    existingCourse.grades.push(grade);
                  } else {
                    courses.push({
                      course_id: grade.course_id,
                      course_name: grade.courses?.course_name,
                      course_code: grade.courses?.course_code,
                      grades: [grade]
                    });
                  }
                  return courses;
                }, []).map((course) => {
                  const avgPercentage = course.grades.reduce((sum: number, grade: any) =>
                    sum + (grade.marks_obtained / grade.max_marks * 100), 0) / course.grades.length;

                  return (
                    <div key={course.course_id} className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                        <h4 className="font-medium text-sm sm:text-base">{course.course_name}</h4>
                        <Badge variant="outline" className="w-fit">{course.course_code}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span>Average Performance</span>
                          <span className={`font-medium ${getGradeColor(avgPercentage)}`}>
                            {Math.round(avgPercentage)}% ({getGradeLetter(avgPercentage)})
                          </span>
                        </div>
                        <Progress value={avgPercentage} className="h-2" />
                        <div className="text-xs text-gray-400">
                          Based on {course.grades.length} assessment(s)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Recent Assignment Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignments.map((submission) => {
                  const percentage = submission.marks_obtained
                    ? (submission.marks_obtained / submission.assignments.max_marks * 100)
                    : null;

                  return (
                    <div key={submission.id} className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{submission.assignments.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {submission.assignments.courses.course_name}
                          </p>
                        </div>
                        {percentage !== null ? (
                          <div className="text-left sm:text-right">
                            <div className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                              {submission.marks_obtained}/{submission.assignments.max_marks}
                            </div>
                            <div className="text-sm text-gray-400">
                              {Math.round(percentage)}%
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="w-fit">Pending</Badge>
                        )}
                      </div>
                      {submission.feedback && (
                        <div className="mt-2 p-2 sm:p-3 bg-gray-800/50 border border-gray-700/30 rounded text-xs sm:text-sm">
                          <strong>Feedback:</strong> {submission.feedback}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Progress Reports */}
          {progressReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Progress Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressReports.map((report) => (
                    <div key={report.id} className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                        <h4 className="font-medium text-sm sm:text-base">{report.courses.course_name}</h4>
                        <Badge variant="outline" className="w-fit">{report.report_period}</Badge>
                      </div>

                      {report.attendance_percentage && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs sm:text-sm mb-1">
                            <span>Attendance</span>
                            <span className="font-medium">{report.attendance_percentage}%</span>
                          </div>
                          <Progress value={Number(report.attendance_percentage)} className="h-2" />
                        </div>
                      )}

                      {report.strengths && (
                        <div className="mb-3">
                          <strong className="text-green-400 text-xs sm:text-sm">Strengths:</strong>
                          <p className="text-xs sm:text-sm text-gray-300 mt-1">{report.strengths}</p>
                        </div>
                      )}

                      {report.areas_for_improvement && (
                        <div className="mb-3">
                          <strong className="text-orange-400 text-xs sm:text-sm">Areas for Improvement:</strong>
                          <p className="text-xs sm:text-sm text-gray-300 mt-1">{report.areas_for_improvement}</p>
                        </div>
                      )}

                      {report.behavioral_notes && (
                        <div className="mb-3">
                          <strong className="text-blue-400 text-xs sm:text-sm">Behavioral Notes:</strong>
                          <p className="text-xs sm:text-sm text-gray-300 mt-1">{report.behavioral_notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700/50">
                        Generated by {report.user_profiles.first_name} {report.user_profiles.last_name} on {new Date(report.generated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AcademicProgress;
