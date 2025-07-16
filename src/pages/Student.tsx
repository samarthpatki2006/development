
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentDashboard from '@/components/student/StudentDashboard';

const Student = () => {
  const [studentData, setStudentData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get student data from localStorage (set during login)
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.user_type !== 'student') {
        navigate('/');
        return;
      }
      setStudentData(parsedUser);
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-role-student mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student portal...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout userType="student">
      <StudentDashboard studentData={studentData} />
    </DashboardLayout>
  );
};

export default Student;
