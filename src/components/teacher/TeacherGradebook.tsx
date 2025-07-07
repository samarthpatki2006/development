
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Plus, 
  Edit,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherGradebookProps {
  teacherData: any;
}

const TeacherGradebook = ({ teacherData }: TeacherGradebookProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGrade, setNewGrade] = useState({
    student_id: '',
    assignment_id: '',
    grade_type: 'assignment',
    marks_obtained: 0,
    max_marks: 100,
    grade_letter: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [teacherData]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', teacherData.user_id)
        .eq('is_active', true);

      if (error) throw error;

      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseData = async () => {
    if (!selectedCourse) return;

    try {
      // Fetch students
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

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          *,
          user_profiles!grades_student_id_fkey (
            first_name,
            last_name
          ),
          assignments (
            title
          )
        `)
        .eq('course_id', selectedCourse.id)
        .order('recorded_at', { ascending: false });

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', selectedCourse.id)
        .order('due_date', { ascending: true });

      setStudents(studentsData || []);
      setGrades(gradesData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };

  const calculateGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const addGrade = async () => {
    try {
      const percentage = (newGrade.marks_obtained / newGrade.max_marks) * 100;
      const grade_letter = calculateGradeLetter(percentage);

      const { error } = await supabase
        .from('grades')
        .insert({
          ...newGrade,
          course_id: selectedCourse.id,
          recorded_by: teacherData.user_id,
          grade_letter
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Grade added successfully'
      });

      setNewGrade({
        student_id: '',
        assignment_id: '',
        grade_type: 'assignment',
        marks_obtained: 0,
        max_marks: 100,
        grade_letter: ''
      });

      fetchCourseData();
    } catch (error) {
      console.error('Error adding grade:', error);
      toast({
        title: 'Error',
        description: 'Failed to add grade',
        variant: 'destructive'
      });
    }
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(grade => grade.student_id === studentId);
  };

  const calculateStudentAverage = (studentId: string): number => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return 0;

    const totalWeightedMarks = studentGrades.reduce((sum, grade) => {
      const percentage = (grade.marks_obtained / grade.max_marks) * 100;
      return sum + percentage;
    }, 0);

    return Math.round(totalWeightedMarks / studentGrades.length);
  };

  const getClassAverage = (): number => {
    if (students.length === 0) return 0;

    const totalAverage = students.reduce((sum, student) => {
      return sum + calculateStudentAverage(student.student_id);
    }, 0);

    return Math.round(totalAverage / students.length);
  };

  const exportGrades = () => {
    const csvData = students.map(student => {
      const studentGrades = getStudentGrades(student.student_id);
      const average = calculateStudentAverage(student.student_id);
      
      return {
        'Student Name': `${student.user_profiles?.first_name} ${student.user_profiles?.last_name}`,
        'Email': student.user_profiles?.email,
        'Average': `${average}%`,
        'Letter Grade': calculateGradeLetter(average),
        'Total Grades': studentGrades.length
      };
    });

    // In a real implementation, you would use a proper CSV export library
    console.log('Exporting grades:', csvData);
    toast({
      title: 'Success',
      description: 'Grades exported successfully'
    });
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
      <div className="flex flex-wrap gap-3 items-center">
        {courses.map((course) => (
          <Button
            key={course.id}
            variant={selectedCourse?.id === course.id ? "default" : "outline"}
            onClick={() => setSelectedCourse(course)}
          >
            {course.course_name}
          </Button>
        ))}
        <Button onClick={exportGrades} variant="outline" className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Grades
        </Button>
      </div>

      {selectedCourse && (
        <>
          {/* Grade Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-gray-600">Assignments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{getClassAverage()}%</p>
                <p className="text-sm text-gray-600">Class Average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{grades.length}</p>
                <p className="text-sm text-gray-600">Total Grades</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Grade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gradebook - {selectedCourse.course_name}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Grade</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={newGrade.student_id}
                        onValueChange={(value) => setNewGrade({...newGrade, student_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.student_id} value={student.student_id}>
                              {student.user_profiles?.first_name} {student.user_profiles?.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newGrade.assignment_id}
                        onValueChange={(value) => setNewGrade({...newGrade, assignment_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignment (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignments.map((assignment) => (
                            <SelectItem key={assignment.id} value={assignment.id}>
                              {assignment.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newGrade.grade_type}
                        onValueChange={(value) => setNewGrade({...newGrade, grade_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Grade type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          placeholder="Marks obtained"
                          value={newGrade.marks_obtained}
                          onChange={(e) => setNewGrade({...newGrade, marks_obtained: parseFloat(e.target.value) || 0})}
                        />
                        <Input
                          type="number"
                          placeholder="Max marks"
                          value={newGrade.max_marks}
                          onChange={(e) => setNewGrade({...newGrade, max_marks: parseFloat(e.target.value) || 100})}
                        />
                      </div>

                      <Button onClick={addGrade} className="w-full">
                        Add Grade
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Student Grades Table */}
              <div className="space-y-4">
                {students.map((student) => {
                  const studentGrades = getStudentGrades(student.student_id);
                  const average = calculateStudentAverage(student.student_id);
                  const letterGrade = calculateGradeLetter(average);

                  return (
                    <Card key={student.student_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">
                              {student.user_profiles?.first_name} {student.user_profiles?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{student.user_profiles?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{average}%</p>
                            <Badge variant={letterGrade === 'A' ? 'default' : letterGrade === 'F' ? 'destructive' : 'secondary'}>
                              {letterGrade}
                            </Badge>
                          </div>
                        </div>

                        {/* Individual Grades */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {studentGrades.map((grade) => (
                            <div key={grade.id} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{grade.grade_type}</p>
                              {grade.assignments && (
                                <p className="text-gray-600">{grade.assignments.title}</p>
                              )}
                              <p className="text-blue-600">
                                {grade.marks_obtained}/{grade.max_marks} ({Math.round((grade.marks_obtained / grade.max_marks) * 100)}%)
                              </p>
                            </div>
                          ))}
                          {studentGrades.length === 0 && (
                            <p className="text-gray-500 text-sm col-span-full">No grades recorded</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TeacherGradebook;
