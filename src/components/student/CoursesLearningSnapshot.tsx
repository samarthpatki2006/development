import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, FileText, Video, Download, ExternalLink, Clock, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface CoursesLearningSnapshotProps {
  studentData: any;
}

const CoursesLearningSnapshot: React.FC<CoursesLearningSnapshotProps> = ({ studentData }) => {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [courseGrades, setCourseGrades] = useState<any[]>([]);
  const [learningProgress, setLearningProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrolledCourses();
  }, [studentData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchEnrolledCourses = async () => {
    if (!studentData?.user_id) return;

    setLoading(true);
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            course_name,
            course_code,
            description,
            credits,
            semester,
            academic_year,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', studentData.user_id)
        .eq('status', 'enrolled');

      if (enrollments) {
        const coursesWithProgress = await Promise.all(
          enrollments.map(async (enrollment) => {
            const progress = await calculateCourseProgress(enrollment.courses.id);
            return {
              ...enrollment,
              progress
            };
          })
        );
        setEnrolledCourses(coursesWithProgress);
        if (coursesWithProgress.length > 0) {
          setSelectedCourse(coursesWithProgress[0].courses);
        }
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCourseProgress = async (courseId: string) => {
    try {
      // Get total assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('course_id', courseId);

      // Get submitted assignments
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .eq('student_id', studentData.user_id)
        .in('assignment_id', assignments?.map(a => a.id) || []);

      const totalAssignments = assignments?.length || 0;
      const submittedAssignments = submissions?.length || 0;
      const progress = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

      return {
        totalAssignments,
        submittedAssignments,
        progress
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return { totalAssignments: 0, submittedAssignments: 0, progress: 0 };
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      // Fetch course materials
      const { data: materials } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false });

      // Fetch assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_submissions!inner (
            id,
            submitted_at,
            marks_obtained,
            feedback
          )
        `)
        .eq('course_id', courseId)
        .eq('assignment_submissions.student_id', studentData.user_id);

      // Fetch grades
      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentData.user_id)
        .order('recorded_at', { ascending: false });

      setCourseMaterials(materials || []);
      setCourseAssignments(assignments || []);
      setCourseGrades(grades || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const calculateOverallGPA = () => {
    if (courseGrades.length === 0) return 0;
    const totalPoints = courseGrades.reduce((sum, grade) => {
      const percentage = (grade.marks_obtained / grade.max_marks) * 100;
      let points = 0;
      if (percentage >= 85) points = 4.0;
      else if (percentage >= 80) points = 3.7;
      else if (percentage >= 75) points = 3.3;
      else if (percentage >= 70) points = 3.0;
      else if (percentage >= 65) points = 2.7;
      else if (percentage >= 60) points = 2.3;
      else if (percentage >= 55) points = 2.0;
      else points = 1.0;
      return sum + points;
    }, 0);
    return (totalPoints / courseGrades.length).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="view_submit_assignments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Courses & Learning Snapshot</h2>
            <p className="text-muted-foreground">Track your academic progress and course materials</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                  <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold">
                    {enrolledCourses.length > 0 
                      ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress.progress, 0) / enrolledCourses.length)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current GPA</p>
                  <p className="text-2xl font-bold">{calculateOverallGPA()}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">
                    {enrolledCourses.reduce((sum, course) => sum + (course.courses.credits || 0), 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="materials">Course Materials</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>

          {/* Courses Overview */}
          <TabsContent value="courses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((enrollment, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCourse(enrollment.courses)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{enrollment.courses.course_name}</CardTitle>
                        <Badge variant="outline">{enrollment.courses.course_code}</Badge>
                      </div>
                      <Badge variant={enrollment.progress.progress >= 75 ? 'default' : 'secondary'}>
                        {enrollment.progress.progress}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={enrollment.progress.progress} />
                      <div className="text-sm text-muted-foreground">
                        <p>Instructor: {enrollment.courses.user_profiles?.first_name} {enrollment.courses.user_profiles?.last_name}</p>
                        <p>Credits: {enrollment.courses.credits}</p>
                        <p>Assignments: {enrollment.progress.submittedAssignments}/{enrollment.progress.totalAssignments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Course Materials */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials - {selectedCourse?.course_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No materials available for this course
                    </div>
                  ) : (
                    courseMaterials.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getMaterialIcon(material.material_type)}
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {material.file_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments - {selectedCourse?.course_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignments for this course
                    </div>
                  ) : (
                    courseAssignments.map((assignment, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          </div>
                          <Badge variant={assignment.assignment_submissions?.length > 0 ? 'default' : 'secondary'}>
                            {assignment.assignment_submissions?.length > 0 ? 'Submitted' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p>{new Date(assignment.due_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Max Marks</p>
                            <p>{assignment.max_marks}</p>
                          </div>
                          {assignment.assignment_submissions?.length > 0 && (
                            <div>
                              <p className="text-muted-foreground">Score</p>
                              <p>{assignment.assignment_submissions[0].marks_obtained || 'Not graded'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades */}
          <TabsContent value="grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grades - {selectedCourse?.course_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseGrades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No grades available for this course
                    </div>
                  ) : (
                    courseGrades.map((grade, index) => {
                      const percentage = Math.round((grade.marks_obtained / grade.max_marks) * 100);
                      return (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{grade.grade_type}</p>
                            <p className="text-sm text-muted-foreground">
                              Recorded: {new Date(grade.recorded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getGradeColor(percentage)}>
                              {grade.marks_obtained}/{grade.max_marks} ({percentage}%)
                            </Badge>
                            {grade.grade_letter && (
                              <p className="text-sm font-medium mt-1">{grade.grade_letter}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default CoursesLearningSnapshot;