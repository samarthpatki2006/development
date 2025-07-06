
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Edit, Users, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  description: string;
  credits: number;
  semester: string;
  academic_year: string;
  instructor_id: string;
  max_students: number;
  is_active: boolean;
  created_at: string;
  instructor?: {
    first_name: string;
    last_name: string;
  };
  enrollment_count?: number;
}

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

const CourseManagement = ({ userProfile }: { userProfile: UserProfile }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [instructors, setInstructors] = useState<any[]>([]);

  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_name: '',
    description: '',
    credits: 3,
    semester: '',
    academic_year: '2024-25',
    instructor_id: '',
    max_students: 50
  });

  useEffect(() => {
    loadCourses();
    loadInstructors();
  }, []);

  const loadCourses = async () => {
    try {
      // Simulated data for now - will be replaced with actual Supabase query
      const mockCourses: Course[] = [
        {
          id: '1',
          course_code: 'CS101',
          course_name: 'Introduction to Computer Science',
          description: 'Basic concepts of programming and computer science',
          credits: 4,
          semester: 'Fall',
          academic_year: '2024-25',
          instructor_id: '1',
          max_students: 40,
          is_active: true,
          created_at: new Date().toISOString(),
          instructor: { first_name: 'John', last_name: 'Doe' },
          enrollment_count: 35
        },
        {
          id: '2',
          course_code: 'MATH201',
          course_name: 'Calculus II',
          description: 'Advanced calculus concepts',
          credits: 3,
          semester: 'Spring',
          academic_year: '2024-25',
          instructor_id: '2',
          max_students: 30,
          is_active: true,
          created_at: new Date().toISOString(),
          instructor: { first_name: 'Jane', last_name: 'Smith' },
          enrollment_count: 28
        }
      ];
      setCourses(mockCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      // Mock instructors data
      setInstructors([
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' }
      ]);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleAddCourse = async () => {
    try {
      // Simulate course creation
      const newCourse: Course = {
        id: Date.now().toString(),
        ...courseForm,
        is_active: true,
        created_at: new Date().toISOString(),
        instructor: instructors.find(i => i.id === courseForm.instructor_id),
        enrollment_count: 0
      };

      setCourses([newCourse, ...courses]);
      setIsAddDialogOpen(false);
      setCourseForm({
        course_code: '',
        course_name: '',
        description: '',
        credits: 3,
        semester: '',
        academic_year: '2024-25',
        instructor_id: '',
        max_students: 50
      });

      toast({
        title: "Success",
        description: "Course created successfully.",
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course.",
        variant: "destructive",
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor?.first_name + ' ' + course.instructor?.last_name).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;

    return matchesSearch && matchesSemester;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Course & Academic Management</span>
              </CardTitle>
              <CardDescription>
                Manage courses, enrollment, and academic schedules for your institution.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                  <DialogDescription>
                    Create a new course for the academic program.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <Label htmlFor="course_code">Course Code</Label>
                    <Input
                      id="course_code"
                      value={courseForm.course_code}
                      onChange={(e) => setCourseForm({...courseForm, course_code: e.target.value})}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="course_name">Course Name</Label>
                    <Input
                      id="course_name"
                      value={courseForm.course_name}
                      onChange={(e) => setCourseForm({...courseForm, course_name: e.target.value})}
                      placeholder="Full course name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select value={courseForm.semester} onValueChange={(value) => setCourseForm({...courseForm, semester: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fall">Fall</SelectItem>
                        <SelectItem value="Spring">Spring</SelectItem>
                        <SelectItem value="Summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="instructor">Instructor</Label>
                    <Select value={courseForm.instructor_id} onValueChange={(value) => setCourseForm({...courseForm, instructor_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      placeholder="Course description and objectives"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_students">Max Students</Label>
                    <Input
                      id="max_students"
                      type="number"
                      value={courseForm.max_students}
                      onChange={(e) => setCourseForm({...courseForm, max_students: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCourse}>
                    Create Course
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses, instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.course_code}</div>
                        <div className="text-sm text-gray-500">{course.course_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.instructor ? 
                        `${course.instructor.first_name} ${course.instructor.last_name}` 
                        : 'Not Assigned'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {course.semester} {course.academic_year}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{course.enrollment_count}/{course.max_students}</span>
                      </div>
                    </TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_active ? "default" : "secondary"}>
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Users className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No courses found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseManagement;
