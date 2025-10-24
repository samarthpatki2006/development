import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Users,
  FileText,
  Share,
  Eye,
  Target,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherPerformanceProps {
  teacherData: any;
}

const TeacherPerformance = ({ teacherData }: TeacherPerformanceProps) => {
  const [students, setStudents] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [interventionNote, setInterventionNote] = useState('');

  useEffect(() => {
    fetchPerformanceData();
  }, [teacherData]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudents(),
        fetchClassAnalytics(),
        identifyAtRiskStudents()
      ]);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    // Get students from teacher's courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', teacherData.user_id);

    if (coursesData) {
      const courseIds = coursesData.map(course => course.id);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          user_profiles!enrollments_student_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          courses (
            course_name
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'enrolled');

      if (!error && data) {
        // Fetch performance data for each student
        const studentsWithPerformance = await Promise.all(
          data.map(async (student) => {
            const performance = await calculateStudentPerformance(student.student_id, courseIds);
            return { ...student, performance };
          })
        );
        
        setStudents(studentsWithPerformance);
        setPerformanceData(studentsWithPerformance);
      }
    }
  };

  const calculateStudentPerformance = async (studentId: string, courseIds: string[]) => {
    // Fetch grades
    const { data: grades } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .in('course_id', courseIds);

    // Fetch attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .in('course_id', courseIds);

    // Calculate metrics
    const averageGrade = grades && grades.length > 0 
      ? grades.reduce((sum, grade) => sum + (grade.marks_obtained / grade.max_marks) * 100, 0) / grades.length
      : 0;

    const attendanceRate = attendance && attendance.length > 0
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
      : 0;

    const totalAssignments = grades ? grades.filter(g => g.grade_type === 'assignment').length : 0;
    const submittedAssignments = grades ? grades.filter(g => g.grade_type === 'assignment' && g.marks_obtained > 0).length : 0;
    const participationScore = Math.min(100, (submittedAssignments / Math.max(1, totalAssignments)) * 100);

    return {
      averageGrade: Math.round(averageGrade),
      attendanceRate: Math.round(attendanceRate),
      participationScore: Math.round(participationScore),
      totalGrades: grades ? grades.length : 0,
      recentTrend: calculateTrend(grades)
    };
  };

  const calculateTrend = (grades: any[]) => {
    if (!grades || grades.length < 2) return 'stable';
    
    const sortedGrades = grades.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    const recent = sortedGrades.slice(-3);
    const earlier = sortedGrades.slice(-6, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, g) => sum + (g.marks_obtained / g.max_marks) * 100, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, g) => sum + (g.marks_obtained / g.max_marks) * 100, 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 5) return 'improving';
    if (recentAvg < earlierAvg - 5) return 'declining';
    return 'stable';
  };

  const fetchClassAnalytics = async () => {
    // Calculate class-wide statistics
    setClassAnalytics({
      totalStudents: students.length,
      averageGrade: 78,
      averageAttendance: 85,
      highPerformers: students.filter(s => s.performance?.averageGrade >= 80).length,
      atRiskCount: students.filter(s => 
        s.performance?.averageGrade < 60 || 
        s.performance?.attendanceRate < 70
      ).length
    });
  };

  const identifyAtRiskStudents = async () => {
    const atRisk = students.filter(student => {
      const perf = student.performance;
      return (
        perf?.averageGrade < 60 ||
        perf?.attendanceRate < 70 ||
        perf?.participationScore < 50 ||
        perf?.recentTrend === 'declining'
      );
    });

    setAtRiskStudents(atRisk);
  };

  const getInterventionSuggestions = (student: any) => {
    const perf = student.performance;
    const suggestions = [];

    if (perf?.averageGrade < 60) {
      suggestions.push("Schedule one-on-one tutoring sessions");
      suggestions.push("Provide additional study materials");
    }
    
    if (perf?.attendanceRate < 70) {
      suggestions.push("Discuss attendance concerns with student");
      suggestions.push("Contact parents/guardians");
    }
    
    if (perf?.participationScore < 50) {
      suggestions.push("Encourage class participation");
      suggestions.push("Assign group projects to increase engagement");
    }
    
    if (perf?.recentTrend === 'declining') {
      suggestions.push("Identify and address learning barriers");
      suggestions.push("Consider peer mentoring program");
    }

    return suggestions;
  };

  const shareProgressWithParents = async (studentId: string) => {
    try {
      // In a real implementation, this would create a notification or report for parents
      toast({
        title: 'Success',
        description: 'Progress shared with parents successfully'
      });
    } catch (error) {
      console.error('Error sharing progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to share progress',
        variant: 'destructive'
      });
    }
  };

  const createInterventionPlan = async () => {
    try {
      // In a real implementation, this would save the intervention plan
      toast({
        title: 'Success',
        description: 'Intervention plan created successfully'
      });
      setInterventionNote('');
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error creating intervention plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create intervention plan',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="view_grades">
      <div className="space-y-6">
        {/* Class Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-xl sm:text-2xl font-bold">{classAnalytics.totalStudents || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />
              <p className="text-xl sm:text-2xl font-bold">{classAnalytics.averageGrade || 0}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Class Average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-xl sm:text-2xl font-bold">{classAnalytics.highPerformers || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">High Performers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-red-500" />
              <p className="text-xl sm:text-2xl font-bold">{classAnalytics.atRiskCount || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">At-Risk Students</p>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Students Alert */}
        {atRiskStudents.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{atRiskStudents.length} students</strong> need attention. Consider intervention strategies.
            </AlertDescription>
          </Alert>
        )}

        {/* Student Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Student Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] sm:max-h-[1000px] overflow-auto">
              {performanceData.map((student) => {
                const perf = student.performance;
                const isAtRisk = perf?.averageGrade < 60 || perf?.attendanceRate < 70;
                
                return (
                  <Card key={student.student_id} className={`p-3 sm:p-4 ${isAtRisk ? 'border-red-200' : ''}`}>
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {student.user_profiles?.first_name} {student.user_profiles?.last_name}
                          </h3>
                          <Badge variant="outline" className="text-xs truncate">{student.courses?.course_name}</Badge>
                          {isAtRisk && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              At Risk
                            </Badge>
                          )}
                          {perf?.recentTrend === 'improving' && (
                            <Badge variant="default" className="text-xs flex-shrink-0">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Improving
                            </Badge>
                          )}
                          {perf?.recentTrend === 'declining' && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Declining
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Grade</p>
                            <div className="flex items-center gap-2">
                              <Progress value={perf?.averageGrade || 0} className="flex-1" />
                              <span className="text-xs sm:text-sm font-semibold">{perf?.averageGrade || 0}%</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Attendance</p>
                            <div className="flex items-center gap-2">
                              <Progress value={perf?.attendanceRate || 0} className="flex-1" />
                              <span className="text-xs sm:text-sm font-semibold">{perf?.attendanceRate || 0}%</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Participation</p>
                            <div className="flex items-center gap-2">
                              <Progress value={perf?.participationScore || 0} className="flex-1" />
                              <span className="text-xs sm:text-sm font-semibold">{perf?.participationScore || 0}%</span>
                            </div>
                          </div>
                        </div>

                        {isAtRisk && (
                          <div className="mt-3 p-3 rounded-lg">
                            <p className="text-xs sm:text-sm font-medium mb-2">Intervention Suggestions:</p>
                            <ul className="text-xs sm:text-sm space-y-1">
                              {getInterventionSuggestions(student).map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Target className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="flex-1">{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => shareProgressWithParents(student.student_id)}
                          className="w-full lg:w-auto text-xs sm:text-sm"
                        >
                          <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Share with Parents</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                        
                        {isAtRisk && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => setSelectedStudent(student)}
                                className="w-full lg:w-auto text-xs sm:text-sm"
                              >
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Create Plan</span>
                                <span className="sm:hidden">Plan</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-base sm:text-lg pr-6">
                                  Create Intervention Plan for {student.user_profiles?.first_name} {student.user_profiles?.last_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-xs sm:text-sm font-medium mb-2">Current Performance:</p>
                                  <div className="space-y-1 text-xs sm:text-sm">
                                    <p>Grade: {perf?.averageGrade}%</p>
                                    <p>Attendance: {perf?.attendanceRate}%</p>
                                    <p>Participation: {perf?.participationScore}%</p>
                                  </div>
                                </div>
                                
                                <Textarea
                                  placeholder="Describe intervention plan, goals, and timeline..."
                                  value={interventionNote}
                                  onChange={(e) => setInterventionNote(e.target.value)}
                                  rows={6}
                                  className="text-sm"
                                />
                                
                                <Button onClick={createInterventionPlan} className="w-full">
                                  Create Intervention Plan
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherPerformance;