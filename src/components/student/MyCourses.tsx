
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  FileText, 
  Upload, 
  Download, 
  Calendar,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MyCoursesProps {
  studentData: any;
}

const MyCourses: React.FC<MyCoursesProps> = ({ studentData }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [lectureMaterials, setLectureMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrolledCourses();
  }, [studentData]);

  const fetchEnrolledCourses = async () => {
    try {
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses(*)
        `)
        .eq('student_id', studentData.user_id);

      if (error) throw error;

      setCourses(enrollmentsData?.map(e => e.courses) || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch enrolled courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      // Fetch lecture materials
      const { data: materialsData } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false });

      setLectureMaterials(materialsData || []);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date');

      setAssignments(assignmentsData || []);

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentData.user_id)
        .in('assignment_id', assignmentsData?.map(a => a.id) || []);

      setSubmissions(submissionsData || []);

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentData.user_id)
        .eq('course_id', courseId)
        .order('recorded_at', { ascending: false });

      setGrades(gradesData || []);

      // Fetch certificates
      const { data: certificatesData } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', studentData.user_id)
        .eq('course_id', courseId);

      setCertificates(certificatesData || []);

    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string, submissionText: string, fileUrl?: string) => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: studentData.user_id,
          submission_text: submissionText,
          file_url: fileUrl,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });

      // Refresh submissions
      fetchCourseDetails(selectedCourse.id);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const downloadCertificate = async (certificateUrl: string) => {
    // In a real implementation, this would handle file download
    window.open(certificateUrl, '_blank');
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <p className="text-gray-600">{courses.length} enrolled courses</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses enrolled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{course.course_name}</span>
                  <Badge variant="secondary">{course.course_code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Credits: {course.credits}</span>
                  <span>{course.semester} {course.academic_year}</span>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedCourse(course);
                    fetchCourseDetails(course.id);
                  }}
                  className="w-full"
                >
                  View Course Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Details Dialog */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse.course_name}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="materials" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="space-y-4">
                <h3 className="text-lg font-semibold">Lecture Materials</h3>
                {lectureMaterials.length === 0 ? (
                  <p className="text-gray-500">No materials uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {lectureMaterials.map((material: any) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{material.title}</h4>
                          <p className="text-sm text-gray-600">{material.description}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => window.open(material.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <h3 className="text-lg font-semibold">Assignments</h3>
                {assignments.length === 0 ? (
                  <p className="text-gray-500">No assignments yet</p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment: any) => {
                      const submission = getSubmissionStatus(assignment.id);
                      const isOverdue = new Date(assignment.due_date) < new Date();
                      
                      return (
                        <Card key={assignment.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">{assignment.title}</h4>
                                <p className="text-sm text-gray-600">{assignment.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                                </p>
                                <Badge variant={
                                  submission ? 'default' : 
                                  isOverdue ? 'destructive' : 'secondary'
                                }>
                                  {submission ? 'Submitted' : 
                                   isOverdue ? 'Overdue' : 'Pending'}
                                </Badge>
                              </div>
                            </div>
                            
                            {submission ? (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm text-green-800">
                                  Submitted on: {new Date(submission.submitted_at).toLocaleDateString()}
                                </p>
                                {submission.marks_obtained && (
                                  <p className="text-sm text-green-800">
                                    Grade: {submission.marks_obtained}/{assignment.max_marks}
                                  </p>
                                )}
                              </div>
                            ) : !isOverdue && (
                              <AssignmentSubmissionForm 
                                assignment={assignment}
                                onSubmit={handleSubmitAssignment}
                              />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="grades" className="space-y-4">
                <h3 className="text-lg font-semibold">Grades</h3>
                {grades.length === 0 ? (
                  <p className="text-gray-500">No grades recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {grades.map((grade: any) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium capitalize">{grade.grade_type}</h4>
                          <p className="text-sm text-gray-600">
                            Recorded: {new Date(grade.recorded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {grade.marks_obtained}/{grade.max_marks}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round((grade.marks_obtained / grade.max_marks) * 100)}%
                          </p>
                          {grade.grade_letter && (
                            <Badge variant="outline">{grade.grade_letter}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="certificates" className="space-y-4">
                <h3 className="text-lg font-semibold">Certificates</h3>
                {certificates.length === 0 ? (
                  <p className="text-gray-500">No certificates available yet</p>
                ) : (
                  <div className="space-y-3">
                    {certificates.map((certificate: any) => (
                      <div key={certificate.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Award className="h-8 w-8 text-yellow-500" />
                          <div>
                            <h4 className="font-medium">
                              {certificate.certificate_type} Certificate
                            </h4>
                            <p className="text-sm text-gray-600">
                              Issued: {new Date(certificate.issued_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => downloadCertificate(certificate.certificate_url)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Assignment Submission Form Component
const AssignmentSubmissionForm: React.FC<{
  assignment: any;
  onSubmit: (assignmentId: string, text: string, fileUrl?: string) => void;
}> = ({ assignment, onSubmit }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(assignment.id, submissionText);
      setSubmissionText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3">
      <Textarea
        placeholder="Enter your submission..."
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        rows={3}
      />
      <Button 
        onClick={handleSubmit}
        disabled={!submissionText.trim() || isSubmitting}
        size="sm"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
      </Button>
    </div>
  );
};

export default MyCourses;
