
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
import { DollarSign, Plus, Edit, Download, Search, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FeeStructure {
  id: string;
  fee_type: string;
  amount: number;
  academic_year: string;
  semester: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
}

interface FeePayment {
  id: string;
  user_id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  user?: {
    first_name: string;
    last_name: string;
    user_code: string;
  };
  fee_structure?: {
    fee_type: string;
  };
}

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

const FinanceManagement = ({ userProfile }: { userProfile: UserProfile }) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('structures');

  const [feeForm, setFeeForm] = useState({
    fee_type: '',
    amount: 0,
    academic_year: '2024-25',
    semester: '',
    user_type: 'student'
  });

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      // Mock fee structures data
      const mockFeeStructures: FeeStructure[] = [
        {
          id: '1',
          fee_type: 'tuition',
          amount: 50000,
          academic_year: '2024-25',
          semester: 'Fall',
          user_type: 'student',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          fee_type: 'hostel',
          amount: 30000,
          academic_year: '2024-25',
          semester: 'Fall',
          user_type: 'student',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          fee_type: 'exam',
          amount: 5000,
          academic_year: '2024-25',
          semester: 'Fall',
          user_type: 'student',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      const mockPayments: FeePayment[] = [
        {
          id: '1',
          user_id: '1',
          fee_structure_id: '1',
          amount_paid: 50000,
          payment_date: new Date().toISOString(),
          payment_method: 'online',
          transaction_id: 'TXN123456',
          status: 'completed',
          user: { first_name: 'John', last_name: 'Doe', user_code: 'STU001' },
          fee_structure: { fee_type: 'tuition' }
        },
        {
          id: '2',
          user_id: '2',
          fee_structure_id: '2',
          amount_paid: 30000,
          payment_date: new Date().toISOString(),
          payment_method: 'bank_transfer',
          transaction_id: 'TXN123457',
          status: 'completed',
          user: { first_name: 'Jane', last_name: 'Smith', user_code: 'STU002' },
          fee_structure: { fee_type: 'hostel' }
        }
      ];

      setFeeStructures(mockFeeStructures);
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast({
        title: "Error",
        description: "Failed to load finance data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeeStructure = async () => {
    try {
      const newFeeStructure: FeeStructure = {
        id: Date.now().toString(),
        ...feeForm,
        is_active: true,
        created_at: new Date().toISOString()
      };

      setFeeStructures([newFeeStructure, ...feeStructures]);
      setIsAddFeeDialogOpen(false);
      setFeeForm({
        fee_type: '',
        amount: 0,
        academic_year: '2024-25',
        semester: '',
        user_type: 'student'
      });

      toast({
        title: "Success",
        description: "Fee structure created successfully.",
      });
    } catch (error) {
      console.error('Error creating fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to create fee structure.",
        variant: "destructive",
      });
    }
  };

  const getTotalRevenue = () => {
    return payments.reduce((total, payment) => total + payment.amount_paid, 0);
  };

  const getPendingAmount = () => {
    // Mock calculation - in real app would be based on unpaid fees
    return feeStructures.reduce((total, fee) => total + fee.amount, 0) * 0.2; // 20% pending
  };

  const getPaymentMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      'online': 'bg-blue-100 text-blue-800',
      'bank_transfer': 'bg-green-100 text-green-800',
      'cash': 'bg-yellow-100 text-yellow-800',
      'card': 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  const filteredFeeStructures = feeStructures.filter(fee => {
    const matchesSearch = fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || fee.user_type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.user_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading finance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Finance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getTotalRevenue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getPendingAmount().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              -5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              This academic year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Finance Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Finance & Fees Management</span>
              </CardTitle>
              <CardDescription>
                Manage fee structures, track payments, and generate financial reports.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="structures">Fee Structures</TabsTrigger>
              <TabsTrigger value="payments">Payment Tracking</TabsTrigger>
              <TabsTrigger value="reports">Financial Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="structures" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search fee types..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All User Types</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Fee Structure
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Fee Structure</DialogTitle>
                      <DialogDescription>
                        Create a new fee structure for the academic year.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="fee_type">Fee Type</Label>
                        <Select value={feeForm.fee_type} onValueChange={(value) => setFeeForm({...feeForm, fee_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tuition">Tuition</SelectItem>
                            <SelectItem value="hostel">Hostel</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="library">Library</SelectItem>
                            <SelectItem value="lab">Laboratory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={feeForm.amount}
                          onChange={(e) => setFeeForm({...feeForm, amount: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="academic_year">Academic Year</Label>
                        <Input
                          id="academic_year"
                          value={feeForm.academic_year}
                          onChange={(e) => setFeeForm({...feeForm, academic_year: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={feeForm.semester} onValueChange={(value) => setFeeForm({...feeForm, semester: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fall">Fall</SelectItem>
                            <SelectItem value="Spring">Spring</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                            <SelectItem value="Annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddFeeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFeeStructure}>
                        Create Fee Structure
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeeStructures.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium capitalize">{fee.fee_type}</TableCell>
                        <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>{fee.academic_year}</TableCell>
                        <TableCell>{fee.semester}</TableCell>
                        <TableCell className="capitalize">{fee.user_type}</TableCell>
                        <TableCell>
                          <Badge variant={fee.is_active ? "default" : "secondary"}>
                            {fee.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Payments
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.user?.first_name} {payment.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{payment.user?.user_code}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{payment.fee_structure?.fee_type}</TableCell>
                        <TableCell>₹{payment.amount_paid.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentMethodColor(payment.payment_method)}>
                            {payment.payment_method.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.transaction_id}</TableCell>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'completed' ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Financial Reports</h3>
                <p>Comprehensive financial reports and analytics will be available here.</p>
                <Button variant="outline" className="mt-4">
                  Generate Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceManagement;
