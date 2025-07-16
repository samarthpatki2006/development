
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';

const Teacher = () => {
  const [teacherData, setTeacherData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('colcord_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.user_type !== 'teacher' && parsedUser.user_type !== 'faculty') {
        navigate('/');
        return;
      }
      setTeacherData(parsedUser);
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-role-teacher mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teacher portal...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout userType="teacher">
      <TeacherDashboard teacherData={teacherData} />
    </DashboardLayout>
  );
};

export default Teacher;
