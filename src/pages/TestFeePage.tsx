import React, { useEffect } from 'react';
import { setupMockData } from '@/utils/mockData';
import PaymentsFees from '@/components/student/PaymentsFeesIntegrated';

const TestFeePage = () => {
  useEffect(() => {
    // Set up mock data
    setupMockData();
  }, []);

  const mockStudentData = {
    id: 'student_123',
    college_id: 'college_123',
    user_type: 'student',
    first_name: 'John',
    last_name: 'Doe',
    user_code: 'STU0001',
    email: 'john.doe@student.colcord.edu'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fee Management Test Page</h1>
          <p className="text-gray-600">Testing the integrated fee management system</p>
        </div>
        
        <PaymentsFees studentData={mockStudentData} />
      </div>
    </div>
  );
};

export default TestFeePage;
