// Mock data setup for development when database is not available
export const setupMockData = () => {
  // Set up a mock student user
  const mockStudent = {
    id: 'student_123',
    college_id: 'college_123',
    user_type: 'student',
    first_name: 'John',
    last_name: 'Doe',
    user_code: 'STU001',
    email: 'john.doe@student.colcord.edu'
  };

  // Store in localStorage
  localStorage.setItem('colcord_user', JSON.stringify(mockStudent));
  
  console.log('Mock student data set up:', mockStudent);
  return mockStudent;
};

// Mock admin setup
export const setupMockAdmin = () => {
  const mockAdmin = {
    id: 'admin_123',
    college_id: 'college_123',
    user_type: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    user_code: 'ADM001',
    email: 'admin@colcord.edu'
  };

  localStorage.setItem('colcord_user', JSON.stringify(mockAdmin));
  
  console.log('Mock admin data set up:', mockAdmin);
  return mockAdmin;
};

// Mock parent setup
export const setupMockParent = () => {
  const mockParent = {
    id: 'parent_123',
    college_id: 'college_123',
    user_type: 'parent',
    first_name: 'Jane',
    last_name: 'Doe',
    user_code: 'PAR001',
    email: 'jane.doe@parent.colcord.edu'
  };

  localStorage.setItem('colcord_user', JSON.stringify(mockParent));
  
  console.log('Mock parent data set up:', mockParent);
  return mockParent;
};

// Clear mock data
export const clearMockData = () => {
  localStorage.removeItem('colcord_user');
  console.log('Mock data cleared');
};

// Get current mock user
export const getCurrentMockUser = () => {
  const userData = localStorage.getItem('colcord_user');
  return userData ? JSON.parse(userData) : null;
};
