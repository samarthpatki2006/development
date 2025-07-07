
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
    <div className="space-y-6">
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
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Overall Performance - {selectedChildName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {grades.length > 0 
                      ? Math.round(grades.reduce((sum, grade) => sum + (grade.marks_obtained / grade.max_marks * 100), 0) / grades.length)
                      : 0}%
                  </div>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {grades.length > 0 
                      ? getGradeLetter(grades.reduce((sum, grade) => sum + (grade.marks_obtained / grade.max_marks * 100), 0) / grades.length)
                      : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600">Overall Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{grades.length}</div>
                  <p className="text-sm text-gray-600">Total Assessments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
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
                    <div key={course.course_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{course.course_name}</h4>
                        <Badge variant="outline">{course.course_code}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Performance</span>
                          <span className={`font-medium ${getGradeColor(avgPercentage)}`}>
                            {Math.round(avgPercentage)}% ({getGradeLetter(avgPercentage)})
                          </span>
                        </div>
                        <Progress value={avgPercentage} className="h-2" />
                        <div className="text-xs text-gray-600">
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
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
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
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{submission.assignments.title}</h4>
                          <p className="text-sm text-gray-600">
                            {submission.assignments.courses.course_name}
                          </p>
                        </div>
                        {percentage !== null ? (
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                              {submission.marks_obtained}/{submission.assignments.max_marks}
                            </div>
                            <div className="text-sm text-gray-600">
                              {Math.round(percentage)}%
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      {submission.feedback && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
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
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Progress Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{report.courses.course_name}</h4>
                        <Badge variant="outline">{report.report_period}</Badge>
                      </div>
                      
                      {report.attendance_percentage && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Attendance</span>
                            <span>{report.attendance_percentage}%</span>
                          </div>
                          <Progress value={Number(report.attendance_percentage)} className="h-2" />
                        </div>
                      )}

                      {report.strengths && (
                        <div className="mb-2">
                          <strong className="text-green-600">Strengths:</strong>
                          <p className="text-sm text-gray-700">{report.strengths}</p>
                        </div>
                      )}

                      {report.areas_for_improvement && (
                        <div className="mb-2">
                          <strong className="text-orange-600">Areas for Improvement:</strong>
                          <p className="text-sm text-gray-700">{report.areas_for_improvement}</p>
                        </div>
                      )}

                      {report.behavioral_notes && (
                        <div className="mb-2">
                          <strong className="text-blue-600">Behavioral Notes:</strong>
                          <p className="text-sm text-gray-700">{report.behavioral_notes}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-3">
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
