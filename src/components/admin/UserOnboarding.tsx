
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Eye, CheckCircle, XCircle, Clock, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserOnboardingRecord {
  id: string;
  user_id: string;
  college_id: string;
  temp_password: string;
  welcome_email_sent: boolean;
  welcome_email_delivered: boolean;
  welcome_email_opened: boolean;
  welcome_email_failed: boolean;
  first_login_completed: boolean;
  password_reset_required: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    user_code: string;
    user_type: string;
  };
}

interface BulkImportData {
  file: File | null;
  userType: string;
  preview: any[];
}

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

const UserOnboarding = ({ userProfile }: { userProfile: UserProfile }) => {
  const [onboardingRecords, setOnboardingRecords] = useState<UserOnboardingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [bulkImportData, setBulkImportData] = useState<BulkImportData>({
    file: null,
    userType: 'student',
    preview: []
  });

  const [newUserForm, setNewUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_type: 'student'
  });

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      // Mock onboarding data
      const mockData: UserOnboardingRecord[] = [
        {
          id: '1',
          user_id: '1',
          college_id: userProfile.college_id,
          temp_password: 'TempPass123',
          welcome_email_sent: true,
          welcome_email_delivered: true,
          welcome_email_opened: false,
          welcome_email_failed: false,
          first_login_completed: false,
          password_reset_required: true,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@student.edu',
            user_code: 'STU001',
            user_type: 'student'
          }
        },
        {
          id: '2',
          user_id: '2',
          college_id: userProfile.college_id,
          temp_password: 'TempPass456',
          welcome_email_sent: true,
          welcome_email_delivered: true,
          welcome_email_opened: true,
          welcome_email_failed: false,
          first_login_completed: true,
          password_reset_required: false,
          onboarding_completed: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@teacher.edu',
            user_code: 'TCH001',
            user_type: 'teacher'
          }
        }
      ];
      
      setOnboardingRecords(mockData);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUserCode = (userType: string): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const typePrefix = {
      'student': 'S',
      'teacher': 'T',
      'staff': 'T',
      'admin': 'A',
      'parent': 'P',
      'alumni': 'L'
    }[userType] || 'U';
    
    const sequence = Math.floor(Math.random() * 9999) + 1;
    return `COLL${typePrefix}${year}${sequence.toString().padStart(4, '0')}`;
  };

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddUser = async () => {
    try {
      const userCode = generateUserCode(newUserForm.user_type);
      const tempPassword = generateTempPassword();

      // Simulate user creation and onboarding record
      const newOnboardingRecord: UserOnboardingRecord = {
        id: Date.now().toString(),
        user_id: Date.now().toString(),
        college_id: userProfile.college_id,
        temp_password: tempPassword,
        welcome_email_sent: false,
        welcome_email_delivered: false,
        welcome_email_opened: false,
        welcome_email_failed: false,
        first_login_completed: false,
        password_reset_required: true,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          ...newUserForm,
          email: newUserForm.email,
          user_code: userCode
        }
      };

      // Simulate sending welcome email
      setTimeout(() => {
        newOnboardingRecord.welcome_email_sent = true;
        newOnboardingRecord.welcome_email_delivered = true;
        setOnboardingRecords(prev => prev.map(record => 
          record.id === newOnboardingRecord.id ? newOnboardingRecord : record
        ));
      }, 2000);

      setOnboardingRecords([newOnboardingRecord, ...onboardingRecords]);
      setIsAddUserDialogOpen(false);
      setNewUserForm({
        first_name: '',
        last_name: '',
        email: '',
        user_type: 'student'
      });

      toast({
        title: "Success",
        description: `User created successfully. User code: ${userCode}`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive",
      });
    }
  };

  const handleResendWelcomeEmail = async (recordId: string) => {
    try {
      const updatedRecords = onboardingRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            welcome_email_sent: true,
            welcome_email_delivered: false,
            welcome_email_failed: false,
            updated_at: new Date().toISOString()
          };
        }
        return record;
      });
      
      setOnboardingRecords(updatedRecords);
      
      // Simulate email delivery
      setTimeout(() => {
        setOnboardingRecords(prev => prev.map(record => 
          record.id === recordId 
            ? { ...record, welcome_email_delivered: true }
            : record
        ));
      }, 1500);

      toast({
        title: "Success",
        description: "Welcome email sent successfully.",
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: "Failed to resend welcome email.",
        variant: "destructive",
      });
    }
  };

  const getEmailStatusBadge = (record: UserOnboardingRecord) => {
    if (record.welcome_email_failed) {
      return <Badge variant="destructive" className="text-xs">Failed</Badge>;
    }
    if (!record.welcome_email_sent) {
      return <Badge variant="secondary" className="text-xs">Not Sent</Badge>;
    }
    if (!record.welcome_email_delivered) {
      return <Badge variant="outline" className="text-xs">Sending...</Badge>;
    }
    if (!record.welcome_email_opened) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Delivered</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 text-xs">Opened</Badge>;
  };

  const getOnboardingStatusBadge = (record: UserOnboardingRecord) => {
    if (record.onboarding_completed) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (record.first_login_completed) {
      return <Badge className="bg-blue-100 text-blue-800">First Login Done</Badge>;
    }
    if (record.welcome_email_opened) {
      return <Badge className="bg-yellow-100 text-yellow-800">Email Opened</Badge>;
    }
    if (record.welcome_email_delivered) {
      return <Badge className="bg-orange-100 text-orange-800">Awaiting Action</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const filteredRecords = (status: string) => {
    return onboardingRecords.filter(record => {
      switch (status) {
        case 'pending':
          return !record.onboarding_completed;
        case 'completed':
          return record.onboarding_completed;
        case 'failed':
          return record.welcome_email_failed;
        default:
          return true;
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading onboarding data...</p>
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
                <UserPlus className="w-5 h-5" />
                <span>User Onboarding & Email Tracking</span>
              </CardTitle>
              <CardDescription>
                Add new users with automated onboarding and track email delivery status
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Users</DialogTitle>
                    <DialogDescription>
                      Import multiple users from CSV file with automated onboarding
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="csv_file">CSV File</Label>
                      <Input
                        id="csv_file"
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setBulkImportData({ ...bulkImportData, file });
                        }}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Expected columns: first_name, last_name, email
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="bulk_user_type">User Type</Label>
                      <Select 
                        value={bulkImportData.userType} 
                        onValueChange={(value) => setBulkImportData({ ...bulkImportData, userType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button>
                      Import Users
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user with automated onboarding and welcome email
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={newUserForm.first_name}
                        onChange={(e) => setNewUserForm({...newUserForm, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={newUserForm.last_name}
                        onChange={(e) => setNewUserForm({...newUserForm, last_name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="user_type">User Type</Label>
                      <Select value={newUserForm.user_type} onValueChange={(value) => setNewUserForm({...newUserForm, user_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>
                      Create User & Send Welcome Email
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Pending ({filteredRecords('pending').length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Completed ({filteredRecords('completed').length})</span>
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Failed ({filteredRecords('failed').length})</span>
              </TabsTrigger>
            </TabsList>

            {['pending', 'completed', 'failed'].map((status) => (
              <TabsContent key={status} value={status}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Details</TableHead>
                        <TableHead>User Code</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Onboarding Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords(status).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {record.user?.first_name} {record.user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{record.user?.email}</div>
                              <Badge variant="outline" className="text-xs mt-1 capitalize">
                                {record.user?.user_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.user?.user_code}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getEmailStatusBadge(record)}
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                {record.welcome_email_sent && <Mail className="w-3 h-3" />}
                                {record.welcome_email_opened && <Eye className="w-3 h-3" />}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getOnboardingStatusBadge(record)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(record.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {(!record.welcome_email_sent || record.welcome_email_failed) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResendWelcomeEmail(record.id)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredRecords(status).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {status} onboarding records found.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboarding;
