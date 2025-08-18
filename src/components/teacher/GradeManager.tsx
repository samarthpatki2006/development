import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Save, RefreshCw, GraduationCap } from "lucide-react";

const GradeManager = () => {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [overallGrade, setOverallGrade] = useState("");
  const [gradeBreakdown, setGradeBreakdown] = useState({});
  const [customScores, setCustomScores] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // State for database data
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignmentData, setAssignmentData] = useState({ assignments: [], submissions: [] });
  const [existingGrade, setExistingGrade] = useState(null);

  // Fetch educator's courses
  const fetchEducatorCourses = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Error",
          description: "No authenticated user found.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select("id, course_name, course_code")
        .eq("instructor_id", user.user.id)
        .eq("is_active", true);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch courses: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch students enrolled in selected course
  const fetchCourseStudents = async (courseId) => {
    if (!courseId) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("course_id", courseId)
        .eq("status", "enrolled");

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = enrollments.map(e => e.student_id);
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .in("id", studentIds);

      if (profileError) throw profileError;
      setStudents(profiles || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students: " + error.message,
        variant: "destructive",
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignments and submissions for selected course and student
  const fetchStudentAssignmentData = async (courseId, studentId) => {
    if (!courseId || !studentId) {
      setAssignmentData({ assignments: [], submissions: [] });
      return;
    }

    setLoading(true);
    try {
      // Get assignments for the course
      const { data: assignments, error: assignmentError } = await supabase
        .from("assignments")
        .select("id, title, max_marks")
        .eq("course_id", courseId);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        setAssignmentData({ assignments: [], submissions: [] });
        return;
      }

      // Get submissions for the student
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions, error: submissionError } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, marks_obtained")
        .eq("student_id", studentId)
        .in("assignment_id", assignmentIds);

      if (submissionError) throw submissionError;

      setAssignmentData({
        assignments: assignments || [],
        submissions: submissions || [],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assignment data: " + error.message,
        variant: "destructive",
      });
      setAssignmentData({ assignments: [], submissions: [] });
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing grade record
  const fetchExistingGrade = async (courseId, studentId) => {
    if (!courseId || !studentId) {
      setExistingGrade(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .eq("grade_type", "final")
        .maybeSingle();

      if (error) throw error;
      setExistingGrade(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch existing grade: " + error.message,
        variant: "destructive",
      });
      setExistingGrade(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchEducatorCourses();
  }, []);

  // Load students when course changes
  useEffect(() => {
    fetchCourseStudents(selectedCourse);
    setSelectedStudent(""); // Reset student selection
  }, [selectedCourse]);

  // Load assignment data and existing grade when course or student changes
  useEffect(() => {
    fetchStudentAssignmentData(selectedCourse, selectedStudent);
    fetchExistingGrade(selectedCourse, selectedStudent);
  }, [selectedCourse, selectedStudent]);

  // Load existing grade data when it changes
  useEffect(() => {
    if (existingGrade) {
      setOverallGrade(existingGrade.grade_letter || "");
      const breakdown = existingGrade.grade_breakdown || {};
      setGradeBreakdown(breakdown);
      setCustomScores(breakdown.custom_scores || {});
    } else {
      setOverallGrade("");
      setGradeBreakdown({});
      setCustomScores({});
    }
  }, [existingGrade]);

  const calculateWeightedScore = () => {
    let totalScore = 0;
    let totalItems = 0;

    // Calculate average from assignments
    assignmentData.assignments.forEach(assignment => {
      const submission = assignmentData.submissions.find(s => s.assignment_id === assignment.id);
      if (submission && assignment.max_marks > 0) {
        const percentage = (submission.marks_obtained / assignment.max_marks) * 100;
        totalScore += percentage;
        totalItems += 1;
      }
    });

    // Add custom scores
    Object.values(customScores).forEach(score => {
      if (typeof score === 'number' && score > 0) {
        totalScore += score;
        totalItems += 1;
      }
    });

    return totalItems > 0 ? totalScore / totalItems : 0;
  };

  const getLetterGrade = (score) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const saveGrade = async () => {
    if (!selectedCourse || !selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a course and student.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Error",
          description: "No authenticated user found.",
          variant: "destructive",
        });
        return;
      }

      const calculatedScore = calculateWeightedScore();
      const finalGrade = overallGrade || getLetterGrade(calculatedScore);

      const breakdown = {
        assignment_scores: {},
        custom_scores: customScores,
        calculated_score: calculatedScore,
      };

      // Add assignment scores to breakdown
      assignmentData.assignments.forEach(assignment => {
        const submission = assignmentData.submissions.find(s => s.assignment_id === assignment.id);
        breakdown.assignment_scores[assignment.id] = {
          title: assignment.title,
          score: submission?.marks_obtained || 0,
          max_marks: assignment.max_marks,
          percentage: assignment.max_marks > 0 ? ((submission?.marks_obtained || 0) / assignment.max_marks) * 100 : 0,
        };
      });

      const gradeData = {
        student_id: selectedStudent,
        course_id: selectedCourse,
        grade_type: 'final',
        marks_obtained: calculatedScore,
        max_marks: 100,
        grade_letter: finalGrade,
        recorded_by: user.user.id,
        grade_breakdown: breakdown,
      };

      let error;
      if (existingGrade) {
        const result = await supabase
          .from("grades")
          .update(gradeData)
          .eq("id", existingGrade.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("grades")
          .insert(gradeData);
        error = result.error;
      }

      if (error) throw error;

      // Refresh the existing grade data
      await fetchExistingGrade(selectedCourse, selectedStudent);

      toast({
        title: "Success",
        description: "Grade saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save grade: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomScore = () => {
    const key = `custom_${Date.now()}`;
    setCustomScores(prev => ({ ...prev, [key]: 0 }));
    setGradeBreakdown(prev => ({
      ...prev,
      custom_names: { ...prev.custom_names, [key]: `Assessment ${Object.keys(customScores).length + 1}` }
    }));
  };

  const updateCustomScore = (key, field, value) => {
    if (field === 'score') {
      setCustomScores(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    } else if (field === 'name') {
      setGradeBreakdown(prev => ({
        ...prev,
        custom_names: { ...prev.custom_names, [key]: value }
      }));
    }
  };

  const removeCustomScore = (key) => {
    setCustomScores(prev => {
      const newScores = { ...prev };
      delete newScores[key];
      return newScores;
    });
    setGradeBreakdown(prev => {
      const newBreakdown = { ...prev };
      if (newBreakdown.custom_names) {
        delete newBreakdown.custom_names[key];
      }
      return newBreakdown;
    });
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-6 p-6 min-h-screen">
    <Card className="border-2  shadow-lg ">
      <CardHeader>
        <CardTitle className="flex items-center gap--2">
          <GraduationCap className="w-5 h-5 " />
          Grade Management System
        </CardTitle>
      </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-select">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-select">Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedCourse || loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCourse && selectedStudent && (
            <>
              {/* Assignment Scores Section */}
              {assignmentData.assignments.length > 0 && (
                <Card className="border shadow-sm">
                  <CardHeader className="bg-black">
                    <CardTitle className="text-lg">Assignment Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {assignmentData.assignments.map((assignment) => {
                        const submission = assignmentData.submissions.find(s => s.assignment_id === assignment.id);
                        const score = submission?.marks_obtained || 0;
                        const percentage = assignment.max_marks > 0 ? (score / assignment.max_marks) * 100 : 0;
                        
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 rounded border">
                            <div className="flex-1">
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm">
                                Score: {score}/{assignment.max_marks} ({percentage.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom Scores Section */}
              <Card className="border shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Additional Assessments
                    <Button onClick={addCustomScore} size="sm" variant="outline" className="border-gray-300">
                      Add Assessment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {Object.entries(customScores).map(([key, score]) => (
                      <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded border">
                        <Input
                          placeholder="Assessment name"
                          value={gradeBreakdown.custom_names?.[key] || ""}
                          onChange={(e) => updateCustomScore(key, 'name', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Score (0-100)"
                          value={score}
                          onChange={(e) => updateCustomScore(key, 'score', e.target.value)}
                          min="0"
                          max="100"
                        />
                        <Button
                          onClick={() => removeCustomScore(key)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {Object.keys(customScores).length === 0 && (
                      <p className=" text-center py-4">No additional assessments added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Grade Summary */}
              <Card className="border shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 " />
                    Grade Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4  rounded border border-blue-200">
                      <p className="text-sm text-gray-600">Calculated Score</p>
                      <p className="text-2xl font-bold ">{calculateWeightedScore().toFixed(1)}%</p>
                    </div>
                    <div className="text-center p-4  rounded border border-green-200">
                      <p className="text-sm ">Auto Grade</p>
                      <p className="text-2xl font-bold text-green-600">{getLetterGrade(calculateWeightedScore())}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overall-grade">Final Grade</Label>
                      <Input
                        id="overall-grade"
                        value={overallGrade}
                        onChange={(e) => setOverallGrade(e.target.value)}
                        placeholder={getLetterGrade(calculateWeightedScore())}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveGrade}
                    disabled={isSaving || loading}
                    className="w-full"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Grade
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {selectedCourse && selectedStudent && assignmentData.assignments.length === 0 && !loading && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-yellow-800 text-center">
                  No assignments found for this course. You can still add custom assessments and assign a final grade.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
    </Card>
  </div>
);
};
export default GradeManager;