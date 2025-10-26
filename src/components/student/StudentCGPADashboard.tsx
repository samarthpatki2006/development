import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, BookOpen, Calculator, Target, GraduationCap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const StudentCGPADashboard = () => {
  const [academicRecords, setAcademicRecords] = useState([]);
  const [courseGrades, setCourseGrades] = useState([]);
  const [currentCGPA, setCurrentCGPA] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch academic records
      const { data: records } = await supabase
        .from("student_academic_records")
        .select("*")
        .eq("student_id", user.user.id)
        .order("academic_year", { ascending: false })
        .order("semester", { ascending: false });

      setAcademicRecords(records || []);

      // Calculate current CGPA
      if (records && records.length > 0) {
        setCurrentCGPA(records[0].cgpa || 0);
        setTotalCredits(records[0].total_credits || 0);
      }

      // Fetch course grades
      const { data: grades } = await supabase
        .from("course_grades")
        .select(`
          *,
          courses (
            course_name,
            course_code,
            credits
          )
        `)
        .eq("student_id", user.user.id)
        .eq("is_completed", true)
        .order("academic_year", { ascending: false })
        .order("semester", { ascending: false });

      setCourseGrades(grades || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (gradePoint) => {
    if (gradePoint >= 9) return 'text-green-500';
    if (gradePoint >= 8) return 'text-blue-500';
    if (gradePoint >= 7) return 'text-yellow-500';
    if (gradePoint >= 6) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCGPAStatus = (cgpa) => {
    if (cgpa >= 9) return { text: 'Outstanding', color: 'bg-green-500' };
    if (cgpa >= 8) return { text: 'Excellent', color: 'bg-blue-500' };
    if (cgpa >= 7) return { text: 'Very Good', color: 'bg-yellow-500' };
    if (cgpa >= 6) return { text: 'Good', color: 'bg-orange-500' };
    return { text: 'Pass', color: 'bg-red-500' };
  };

  const groupBySemester = () => {
    const grouped = {};
    courseGrades.forEach(grade => {
      const key = `${grade.academic_year}-${grade.semester}`;
      if (!grouped[key]) {
        grouped[key] = {
          academic_year: grade.academic_year,
          semester: grade.semester,
          courses: [],
          sgpa: academicRecords.find(r => 
            r.academic_year === grade.academic_year && r.semester === grade.semester
          )?.sgpa || 0
        };
      }
      grouped[key].courses.push(grade);
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading academic records...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getCGPAStatus(currentCGPA);
  const semesterData = groupBySemester();

  return (
    <div className="space-y-6">
      {/* CGPA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-4xl font-bold text-primary mb-1">
              {currentCGPA.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mb-2">Cumulative GPA</p>
            <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium ${status.color}`}>
              {status.text}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-blue-500 mb-1">{totalCredits}</p>
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-xs text-accent mt-1">
              {academicRecords[0]?.completed_credits || 0} Earned
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-4xl font-bold text-purple-500 mb-1">
              {semesterData.length}
            </p>
            <p className="text-sm text-muted-foreground">Semesters</p>
            <p className="text-xs text-accent mt-1">
              {courseGrades.length} Courses Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Semester-wise Performance */}
      <Card className="glass-effect border-primary/20">
        <CardHeader className="border-b border-primary/20">
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            Semester-wise Academic Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {semesterData.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No academic records available yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {semesterData.map((semester, idx) => (
                <Card key={idx} className="glass-effect border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {semester.academic_year} - {semester.semester}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {semester.courses.length} courses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">SGPA</p>
                        <p className={`text-3xl font-bold ${getGradeColor(semester.sgpa)}`}>
                          {semester.sgpa.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {semester.courses.map((course, cidx) => (
                        <div
                          key={cidx}
                          className="flex justify-between items-center p-3 bg-accent/5 rounded border border-primary/10"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {course.courses.course_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {course.courses.course_code} • {course.courses.credits} Credits
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className={`text-2xl font-bold ${getGradeColor(course.grade_point)}`}>
                                  {course.grade_letter}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {course.percentage.toFixed(1)}%
                                </p>
                              </div>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getGradeColor(course.grade_point)} bg-current/10`}>
                                <span className={`text-lg font-bold ${getGradeColor(course.grade_point)}`}>
                                  {course.grade_point}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-primary/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Semester Credits:</span>
                        <span className="font-medium text-foreground">
                          {semester.courses.reduce((sum, c) => sum + (c.courses.credits || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CGPA Trend */}
      {academicRecords.length > 1 && (
        <Card className="glass-effect border-primary/20">
          <CardHeader className="border-b border-primary/20">
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              CGPA Progression
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {[...academicRecords].reverse().map((record, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {record.academic_year} {record.semester}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent flex items-center justify-end px-2"
                        style={{ width: `${(record.cgpa / 10) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">
                          {record.cgpa.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentCGPADashboard;