
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherCoursesProps {
  teacherData: any;
}

const TeacherCourses = ({ teacherData }: TeacherCoursesProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    max_marks: 100
  });

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    material_type: 'document'
  });

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

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_submissions (count)
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
      setAssignments(assignmentsData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...newAssignment,
          course_id: selectedCourse.id,
          created_by: teacherData.user_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });

      setNewAssignment({ title: '', description: '', due_date: '', max_marks: 100 });
      fetchCourseDetails();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  };

  const handleUploadMaterial = async (file: File) => {
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate with a placeholder URL
      const fileUrl = `https://example.com/files/${file.name}`;

      const { error } = await supabase
        .from('lecture_materials')
        .insert({
          ...newMaterial,
          course_id: selectedCourse.id,
          uploaded_by: teacherData.user_id,
          file_url: fileUrl
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Material uploaded successfully'
      });

      setNewMaterial({ title: '', description: '', material_type: 'document' });
      fetchCourseDetails();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload material',
        variant: 'destructive'
      });
    }
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
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {course.course_name}
            <Badge variant="secondary">{course.enrollments?.[0]?.count || 0}</Badge>
          </Button>
        ))}
      </div>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedCourse.course_name} ({selectedCourse.course_code})
              </div>
              <Badge variant="outline">{selectedCourse.credits} Credits</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="materials" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Lecture Materials</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Upload Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Lecture Material</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Material title"
                          value={newMaterial.title}
                          onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                        />
                        <Textarea
                          placeholder="Description"
                          value={newMaterial.description}
                          onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                        />
                        <select
                          className="w-full p-2 border rounded"
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
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {materials.map((material) => (
                    <Card key={material.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">{material.title}</p>
                              <p className="text-sm text-gray-600">{material.description}</p>
                              <p className="text-xs text-gray-500">
                                Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{material.material_type}</Badge>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Assignments</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Assignment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Assignment title"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                        />
                        <Textarea
                          placeholder="Assignment description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                        />
                        <Input
                          type="datetime-local"
                          value={newAssignment.due_date}
                          onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                        />
                        <Input
                          type="number"
                          placeholder="Maximum marks"
                          value={newAssignment.max_marks}
                          onChange={(e) => setNewAssignment({...newAssignment, max_marks: parseInt(e.target.value)})}
                        />
                        <Button onClick={handleCreateAssignment} className="w-full">
                          Create Assignment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-gray-600">{assignment.description}</p>
                              <p className="text-xs text-gray-500">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {assignment.assignment_submissions?.[0]?.count || 0} submissions
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4">
                <h3 className="text-lg font-semibold">Enrolled Students ({students.length})</h3>
                
                <div className="grid gap-4">
                  {students.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">
                                {enrollment.user_profiles?.first_name} {enrollment.user_profiles?.last_name}
                              </p>
                              <p className="text-sm text-gray-600">{enrollment.user_profiles?.email}</p>
                              <p className="text-xs text-gray-500">
                                Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                              {enrollment.status}
                            </Badge>
                            {enrollment.grade && (
                              <Badge variant="outline">{enrollment.grade}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-4">
                <h3 className="text-lg font-semibold">Course Progress Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{materials.length}</p>
                      <p className="text-sm text-gray-600">Materials Uploaded</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{assignments.length}</p>
                      <p className="text-sm text-gray-600">Assignments Created</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{students.length}</p>
                      <p className="text-sm text-gray-600">Enrolled Students</p>
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
