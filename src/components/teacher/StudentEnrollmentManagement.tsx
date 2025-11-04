import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, AlertCircle, Users, BookOpen, Calendar, CheckCircle, X, Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester: string;
  academic_year: string;
  max_students: number;
  enrollment_count: number;
}

interface Student {
  id: string;
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  status: string;
  grade: string;
  student: Student;
  course: Course;
}

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

interface BulkEnrollmentData {
  file: File | null;
  courseId: string;
  preview: any[];
}

const StudentEnrollmentManagement = ({ teacherData }: { teacherData: UserProfile }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isBulkEnrollDialogOpen, setIsBulkEnrollDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkEnrollmentData, setBulkEnrollmentData] = useState<BulkEnrollmentData>({
    file: null,
    courseId: '',
    preview: []
  });

  useEffect(() => {
    loadData();
  }, [teacherData]);

  const loadData = async () => {
    try {
      if (!teacherData?.college_id) {
        setIsLoading(false);
        return;
      }

      await Promise.all([
        loadCourses(),
        loadStudents(),
        loadEnrollments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('Loading courses for user ID:', user.id);
      console.log('TeacherData:', teacherData);
      console.log('User type:', teacherData.user_type);

      let query = supabase
        .from('courses')
        .select(`
          id,
          course_code,
          course_name,
          credits,
          semester,
          academic_year,
          max_students,
          instructor_id
        `)
        .eq('is_active', true)
        .order('course_code');

      if (teacherData.user_type === 'teacher' || teacherData.user_type === 'faculty') {
        query = query.eq('instructor_id', user.id);
      } else if (teacherData.user_type === 'admin') {
        query = query.eq('college_id', teacherData.college_id);
      } else {
        query = query.eq('instructor_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading courses:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return;
      }

      console.log('Loaded courses:', data);

      if (data && data.length > 0) {
        const coursesWithCounts = await Promise.all(
          data.map(async (course) => {
            try {
              const { count, error: countError } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id)
                .eq('status', 'enrolled');

              if (countError) {
                console.error('Error getting enrollment count for course', course.id, ':', countError);
                return {
                  ...course,
                  enrollment_count: 0
                };
              }

              return {
                ...course,
                enrollment_count: count || 0
              };
            } catch (err) {
              console.error('Exception getting count for course', course.id, ':', err);
              return {
                ...course,
                enrollment_count: 0
              };
            }
          })
        );

        setCourses(coursesWithCounts);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Exception in loadCourses:', err);
      return;
    }
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_code, first_name, last_name, email')
      .eq('college_id', teacherData.college_id)
      .eq('user_type', 'student')
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      console.error('Error loading students:', error);
      return;
    }

    setStudents(data || []);
  };

  const loadEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found for enrollments');
        return;
      }

      console.log('Loading enrollments for user type:', teacherData.user_type);

      let courseIds = [];

      if (teacherData.user_type === 'teacher' || teacherData.user_type === 'faculty') {
        const { data: instructorCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', user.id)
          .eq('is_active', true);

        if (coursesError) {
          console.error('Error getting instructor courses:', coursesError);
          return;
        }

        courseIds = instructorCourses?.map(c => c.id) || [];
      } else if (teacherData.user_type === 'admin') {
        const { data: collegeCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('college_id', teacherData.college_id)
          .eq('is_active', true);

        if (coursesError) {
          console.error('Error getting college courses:', coursesError);
          return;
        }

        courseIds = collegeCourses?.map(c => c.id) || [];
      } else {
        const { data: instructorCourses, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', user.id)
          .eq('is_active', true);

        if (coursesError) {
          console.error('Error getting instructor courses:', coursesError);
          return;
        }

        courseIds = instructorCourses?.map(c => c.id) || [];
      }

      if (courseIds.length === 0) {
        console.log('No courses found for user');
        setEnrollments([]);
        return;
      }

      console.log('Course IDs for enrollments:', courseIds);

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          course_id,
          enrollment_date,
          status,
          grade,
          student:user_profiles(id, user_code, first_name, last_name, email),
          course:courses(id, course_code, course_name, credits, semester, academic_year)
        `)
        .in('course_id', courseIds)
        .order('enrollment_date', { ascending: false });

      if (error) {
        console.error('Error loading enrollments:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return;
      }

      console.log('Loaded enrollments:', data);
      setEnrollments(data || []);
    } catch (err) {
      console.error('Exception in loadEnrollments:', err);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourse || !selectedStudent) {
      toast({
        title: "Validation Error",
        description: "Please select both a course and a student.",
        variant: "destructive",
      });
      return;
    }

    const existingEnrollment = enrollments.find(
      e => e.course_id === selectedCourse && e.student_id === selectedStudent
    );

    if (existingEnrollment) {
      toast({
        title: "Enrollment Error",
        description: "Student is already enrolled in this course.",
        variant: "destructive",
      });
      return;
    }

    const course = courses.find(c => c.id === selectedCourse);
    if (course && course.enrollment_count >= course.max_students) {
      toast({
        title: "Enrollment Error",
        description: "Course has reached maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([{
          course_id: selectedCourse,
          student_id: selectedStudent,
          status: 'enrolled'
        }])
        .select(`
          id,
          student_id,
          course_id,
          enrollment_date,
          status,
          grade,
          student:user_profiles(id, user_code, first_name, last_name, email),
          course:courses(id, course_code, course_name, credits, semester, academic_year)
        `)
        .single();

      if (error) {
        console.error('Error enrolling student:', error);
        toast({
          title: "Error",
          description: "Failed to enroll student.",
          variant: "destructive",
        });
      } else {
        setEnrollments([data, ...enrollments]);
        setIsEnrollDialogOpen(false);
        setSelectedCourse('');
        setSelectedStudent('');

        setCourses(courses.map(c =>
          c.id === selectedCourse
            ? { ...c, enrollment_count: c.enrollment_count + 1 }
            : c
        ));

        toast({
          title: "Success",
          description: "Student enrolled successfully.",
        });
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          const validRecords = results.data.filter((row: any) => {
            return row.user_code && row.user_code.trim().length > 0;
          });

          if (validRecords.length === 0) {
            toast({
              title: "Error",
              description: "No valid records found in CSV. Expected column: user_code",
              variant: "destructive",
            });
            return;
          }

          setBulkEnrollmentData({
            ...bulkEnrollmentData,
            file,
            preview: validRecords.slice(0, 10)
          });

          toast({
            title: "CSV Loaded",
            description: `Found ${validRecords.length} valid record(s). Preview showing first ${Math.min(10, validRecords.length)}.`,
          });
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "Failed to read CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleBulkEnrollment = async () => {
    if (!bulkEnrollmentData.file || !bulkEnrollmentData.courseId) {
      toast({
        title: "Error",
        description: "Please select both a CSV file and a course.",
        variant: "destructive",
      });
      return;
    }

    const course = courses.find(c => c.id === bulkEnrollmentData.courseId);
    if (!course) {
      toast({
        title: "Error",
        description: "Selected course not found.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBulk(true);

    try {
      Papa.parse(bulkEnrollmentData.file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: async (results) => {
          const validRecords = results.data.filter((row: any) => {
            return row.user_code && row.user_code.trim().length > 0;
          });

          let successCount = 0;
          let skipCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          for (const row of validRecords) {
            try {
              const userCode = row.user_code.trim();

              const student = students.find(s => s.user_code === userCode);
              
              if (!student) {
                failCount++;
                errors.push(`${userCode}: Student not found`);
                continue;
              }

              const existingEnrollment = enrollments.find(
                e => e.course_id === bulkEnrollmentData.courseId && e.student_id === student.id
              );

              if (existingEnrollment) {
                skipCount++;
                errors.push(`${userCode}: Already enrolled`);
                continue;
              }

              if (course.enrollment_count + successCount >= course.max_students) {
                failCount++;
                errors.push(`${userCode}: Course at maximum capacity`);
                continue;
              }

              const { data, error } = await supabase
                .from('enrollments')
                .insert([{
                  course_id: bulkEnrollmentData.courseId,
                  student_id: student.id,
                  status: 'enrolled'
                }])
                .select(`
                  id,
                  student_id,
                  course_id,
                  enrollment_date,
                  status,
                  grade,
                  student:user_profiles(id, user_code, first_name, last_name, email),
                  course:courses(id, course_code, course_name, credits, semester, academic_year)
                `)
                .single();

              if (error) {
                failCount++;
                errors.push(`${userCode}: ${error.message}`);
              } else {
                successCount++;
                setEnrollments(prev => [data, ...prev]);
              }
            } catch (error: any) {
              failCount++;
              errors.push(`${row.user_code}: ${error.message}`);
              console.error(`Error processing ${row.user_code}:`, error);
            }
          }

          setIsProcessingBulk(false);
          setIsBulkEnrollDialogOpen(false);
          setBulkEnrollmentData({
            file: null,
            courseId: '',
            preview: []
          });

          if (successCount > 0) {
            setCourses(courses.map(c =>
              c.id === bulkEnrollmentData.courseId
                ? { ...c, enrollment_count: c.enrollment_count + successCount }
                : c
            ));
          }

          await loadEnrollments();

          const message = `Successfully enrolled ${successCount} student(s).${skipCount > 0 ? ` Skipped: ${skipCount} (already enrolled).` : ''}${failCount > 0 ? ` Failed: ${failCount}.` : ''}`;

          toast({
            title: "Bulk Enrollment Complete",
            description: message,
            variant: failCount > 0 ? "destructive" : "default",
          });

          if (errors.length > 0 && errors.length <= 10) {
            console.log('Enrollment errors:', errors);
          }
        },
        error: (error) => {
          setIsProcessingBulk(false);
          console.error('CSV parsing error:', error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      setIsProcessingBulk(false);
      console.error('Error in bulk enrollment:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk enrollment.",
        variant: "destructive",
      });
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string, courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'dropped' })
        .eq('id', enrollmentId);

      if (error) {
        console.error('Error unenrolling student:', error);
        toast({
          title: "Error",
          description: "Failed to unenroll student.",
          variant: "destructive",
        });
      } else {
        setEnrollments(enrollments.map(e =>
          e.id === enrollmentId
            ? { ...e, status: 'dropped' }
            : e
        ));

        setCourses(courses.map(c =>
          c.id === courseId
            ? { ...c, enrollment_count: Math.max(0, c.enrollment_count - 1) }
            : c
        ));

        toast({
          title: "Success",
          description: "Student unenrolled successfully.",
        });
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to unenroll student.",
        variant: "destructive",
      });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(enrollment => {
    const student = enrollment.student;
    const course = enrollment.course;
    const searchLower = enrollmentSearchTerm.toLowerCase();
    return (
      student?.first_name?.toLowerCase().includes(searchLower) ||
      student?.last_name?.toLowerCase().includes(searchLower) ||
      student?.user_code?.toLowerCase().includes(searchLower) ||
      course?.course_code?.toLowerCase().includes(searchLower) ||
      course?.course_name?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading enrollment data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>
                  {teacherData.user_type === 'admin' ? 'All Courses Overview' : 'My Courses Overview'}
                </span>
              </CardTitle>
              <CardDescription>
                {teacherData.user_type === 'admin'
                  ? 'View course capacity and enrollment status for all courses in your college.'
                  : 'View course capacity and enrollment status for courses you instruct.'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="border">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{course.course_code}</h3>
                        <p className="text-sm text-gray-600">{course.course_name}</p>
                      </div>
                      <Badge variant="outline">
                        {course.credits} credits
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {course.semester} {course.academic_year}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className={`${course.enrollment_count >= course.max_students
                          ? 'text-red-600 font-medium'
                          : 'text-gray-600'
                          }`}>
                          {course.enrollment_count}/{course.max_students}
                        </span>
                      </div>
                    </div>
                    {course.enrollment_count >= course.max_students && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Full Capacity
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No courses found. You are not assigned as an instructor for any active courses.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Enrollment Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <CardTitle className="flex items-center justify-center sm:justify-start space-x-2 text-base sm:text-lg">
                <UserPlus className="w-5 h-5" />
                <span>Student Enrollment Management</span>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {teacherData.user_type === 'admin'
                  ? 'Enroll students in any course and manage all enrollments in your college.'
                  : 'Enroll students in your courses and manage existing enrollments.'
                }
              </CardDescription>
            </div>

            {courses.length > 0 && (
              <div className="flex space-x-2">
                {/* Bulk Enrollment Dialog */}
                <Dialog open={isBulkEnrollDialogOpen} onOpenChange={setIsBulkEnrollDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Bulk Enroll
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bulk Enroll Students</DialogTitle>
                      <DialogDescription>
                        Enroll multiple students in a course using CSV file
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold mb-1">CSV Format Requirements:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Required column: <code className="px-1 rounded">user_code</code></li>
                              <li>Each row should contain the student's user code</li>
                              <li>Column names are case-insensitive</li>
                              <li>Empty rows will be skipped</li>
                              <li>Already enrolled students will be skipped</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bulk_course">Select Course *</Label>
                        <Select
                          value={bulkEnrollmentData.courseId}
                          onValueChange={(value) => setBulkEnrollmentData({ ...bulkEnrollmentData, courseId: value })}
                          disabled={isProcessingBulk}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.course_code} - {course.course_name}
                                ({course.enrollment_count}/{course.max_students})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="csv_file">CSV File *</Label>
                        <Input
                          id="csv_file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          disabled={isProcessingBulk}
                        />
                      </div>

                      {bulkEnrollmentData.preview.length > 0 && (
                        <div>
                          <Label className="mb-2 block">Preview (First 10 Records)</Label>
                          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Code</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {bulkEnrollmentData.preview.map((row: any, index) => {
                                  const student = students.find(s => s.user_code === row.user_code);
                                  const isEnrolled = student && enrollments.find(
                                    e => e.course_id === bulkEnrollmentData.courseId && e.student_id === student.id
                                  );
                                  
                                  return (
                                    <tr key={index}>
                                      <td className="px-4 py-2 font-mono text-sm">{row.user_code}</td>
                                      <td className="px-4 py-2">
                                        {!student ? (
                                          <Badge variant="destructive" className="text-xs">Not Found</Badge>
                                        ) : isEnrolled ? (
                                          <Badge variant="secondary" className="text-xs">Already Enrolled</Badge>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-800 text-xs">Ready</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsBulkEnrollDialogOpen(false);
                          setBulkEnrollmentData({
                            file: null,
                            courseId: '',
                            preview: []
                          });
                        }}
                        disabled={isProcessingBulk}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkEnrollment}
                        disabled={!bulkEnrollmentData.file || !bulkEnrollmentData.courseId || isProcessingBulk}
                      >
                        {isProcessingBulk ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Enroll Students
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Single Student Enrollment Dialog */}
                <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Enroll Student
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-md w-[90vw]">
                    <DialogHeader>
                      <DialogTitle>Enroll Student in Course</DialogTitle>
                      <DialogDescription>
                        Select a student and one of your courses to create a new enrollment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="course">Course *</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses
                              .filter(course => course.enrollment_count < course.max_students)
                              .map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.course_code} - {course.course_name}
                                  ({course.enrollment_count}/{course.max_students})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="student">Student *</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.user_code} - {student.first_name} {student.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end sm:space-x-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEnrollDialogOpen(false)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleEnrollStudent} disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search enrollments by student or course..."
              value={enrollmentSearchTerm}
              onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
              className="pl-10 truncate w-full"
            />
          </div>

          {filteredEnrollments.length > 0 ? (
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">
                            {enrollment.student?.first_name} {enrollment.student?.last_name}
                          </div>
                          <div className="text-sm">
                            {enrollment.student?.user_code} • {enrollment.student?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{enrollment.course?.course_code}</div>
                          <div className="text-sm">{enrollment.course?.course_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            enrollment.status === 'enrolled'
                              ? 'default'
                              : enrollment.status === 'completed'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.grade ? (
                          <Badge variant="outline">{enrollment.grade}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.status === 'enrolled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnenrollStudent(enrollment.id, enrollment.course_id)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Unenroll
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Enrollments Found</h3>
              <p>No student enrollments found for your courses.</p>
              {courses.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                  <Button
                    onClick={() => setIsEnrollDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enroll First Student
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkEnrollDialogOpen(true)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Bulk Enroll
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEnrollmentManagement;