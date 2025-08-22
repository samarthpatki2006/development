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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2,
  Download, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
  FileText,
  Eye
} from 'lucide-react';
import { format } from "date-fns";
import { feeManagementService, type FeeStructure, type PaymentStatistics } from '@/services/feeManagementService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FeePayment {
  id: string;
  college_id: string;
  user_id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  transaction_id: string;
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    user_code: string;
  };
  fee_structures?: {
    fee_type: string;
    amount: number;
  };
}

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
  first_name: string;
  last_name: string;
}

interface FeeFormData {
  fee_type: string;
  amount: number;
  academic_year: string;
  semester: string;
  user_type: string;
}

interface DashboardStats {
  totalRevenue: number;
  pendingPayments: number;
  totalStudents: number;
  collectionRate: number;
  recentPayments: FeePayment[];
}

const FinanceManagement = ({ userProfile }: { userProfile: UserProfile }) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    totalStudents: 0,
    collectionRate: 0,
    recentPayments: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [feeForm, setFeeForm] = useState<FeeFormData>({
    fee_type: '',
    amount: 0,
    academic_year: '2024-25',
    semester: 'Fall',
    user_type: 'student'
  });

  useEffect(() => {
    if (userProfile?.college_id) {
      loadAllData();
    }
  }, [userProfile]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadFeeStructures(),
        loadPayments(),
        loadDashboardStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load finance data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeeStructures = async () => {
    try {
      const structures = await feeManagementService.getFeeStructures(userProfile.college_id, false);
      setFeeStructures(structures);
    } catch (error) {
      console.error('Error loading fee structures:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            user_code
          ),
          fee_structures (
            fee_type,
            amount
          )
        `)
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('fee_payments')
        .select('amount_paid')
        .eq('college_id', userProfile.college_id)
        .eq('status', 'completed');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount_paid, 0) || 0;

      // Get pending payments count
      const { data: pendingData, error: pendingError } = await supabase
        .from('fee_payments')
        .select('id')
        .eq('college_id', userProfile.college_id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('college_id', userProfile.college_id)
        .eq('user_type', 'student');

      if (studentsError) throw studentsError;

      // Get recent payments
      const { data: recentPaymentsData, error: recentError } = await supabase
        .from('fee_payments')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            user_code
          ),
          fee_structures (
            fee_type,
            amount
          )
        `)
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Calculate collection rate
      const { data: totalExpectedData, error: expectedError } = await supabase
        .from('fee_structures')
        .select('amount')
        .eq('college_id', userProfile.college_id)
        .eq('is_active', true);

      if (expectedError) throw expectedError;

      const totalExpected = totalExpectedData?.reduce((sum, fee) => sum + fee.amount, 0) || 1;
      const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

      setDashboardStats({
        totalRevenue,
        pendingPayments: pendingData?.length || 0,
        totalStudents: studentsData?.length || 0,
        collectionRate: Math.min(collectionRate, 100),
        recentPayments: recentPaymentsData || []
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleAddFeeStructure = async () => {
    try {
      const feeData = {
        college_id: userProfile.college_id,
        fee_type: feeForm.fee_type,
        amount: feeForm.amount,
        academic_year: feeForm.academic_year,
        semester: feeForm.semester || null,
        user_type: feeForm.user_type,
        is_active: true
      };

      const { error } = await supabase
        .from('fee_structures')
        .insert([feeData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure created successfully.",
      });

      setIsAddFeeDialogOpen(false);
      resetFeeForm();
      loadFeeStructures();
    } catch (error) {
      console.error('Error creating fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to create fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFeeStructure = async () => {
    if (!editingFee) return;

    try {
      const feeData = {
        fee_type: feeForm.fee_type,
        amount: feeForm.amount,
        academic_year: feeForm.academic_year,
        semester: feeForm.semester || null,
        user_type: feeForm.user_type,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fee_structures')
        .update(feeData)
        .eq('id', editingFee.id)
        .eq('college_id', userProfile.college_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure updated successfully.",
      });

      setIsEditFeeDialogOpen(false);
      setEditingFee(null);
      resetFeeForm();
      loadFeeStructures();
    } catch (error) {
      console.error('Error updating fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to update fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeeStructure = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .update({ is_active: false })
        .eq('id', feeId)
        .eq('college_id', userProfile.college_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure deleted successfully.",
      });

      loadFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to delete fee structure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetFeeForm = () => {
    setFeeForm({
      fee_type: '',
      amount: 0,
      academic_year: '2024-25',
      semester: 'Fall',
      user_type: 'student'
    });
  };

  const openEditDialog = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFeeForm({
      fee_type: fee.fee_type,
      amount: fee.amount,
      academic_year: fee.academic_year,
      semester: fee.semester || 'Fall',
      user_type: fee.user_type || 'student'
    });
    setIsEditFeeDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredFeeStructures = feeStructures.filter(fee => {
    const matchesSearch = fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.academic_year.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || fee.semester === filterSemester;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && fee.is_active) ||
                         (filterStatus === 'inactive' && !fee.is_active);
    
    return matchesSearch && matchesSemester && matchesStatus;
  });

  const filteredPayments = payments.filter(payment => {
    const fullName = `${payment.user_profiles?.first_name} ${payment.user_profiles?.last_name}`.toLowerCase();
    const userCode = payment.user_profiles?.user_code?.toLowerCase() || '';
    const feeType = payment.fee_structures?.fee_type?.toLowerCase() || '';
    
    return fullName.includes(searchTerm.toLowerCase()) ||
           userCode.includes(searchTerm.toLowerCase()) ||
           feeType.includes(searchTerm.toLowerCase()) ||
           payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Management</h2>
          <p className="text-muted-foreground">
            Manage fee structures, track payments, and monitor financial performance
          </p>
        </div>
        <Button onClick={loadAllData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="structures">
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Structures
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.collectionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Above target
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  Active students
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest fee payments received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {payment.user_profiles?.first_name} {payment.user_profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.fee_structures?.fee_type} - {payment.user_profiles?.user_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount_paid)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {dashboardStats.recentPayments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent payments found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Structures Tab */}
        <TabsContent value="structures" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search fee structures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Fall">Fall</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Fee Structure</DialogTitle>
                  <DialogDescription>
                    Create a new fee structure for students
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fee_type">Fee Type *</Label>
                      <Input
                        id="fee_type"
                        value={feeForm.fee_type}
                        onChange={(e) => setFeeForm({...feeForm, fee_type: e.target.value})}
                        placeholder="e.g., Tuition Fee, Library Fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({...feeForm, amount: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic_year">Academic Year</Label>
                      <Select value={feeForm.academic_year} onValueChange={(value) => setFeeForm({...feeForm, academic_year: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2026-27">2026-27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={feeForm.semester} onValueChange={(value) => setFeeForm({...feeForm, semester: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_type">User Type</Label>
                    <Select value={feeForm.user_type} onValueChange={(value) => setFeeForm({...feeForm, user_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
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

          <Card>
            <CardContent>
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
                      <TableCell className="font-medium">
                        {fee.fee_type}
                      </TableCell>
                      <TableCell>{formatCurrency(fee.amount)}</TableCell>
                      <TableCell>{fee.academic_year}</TableCell>
                      <TableCell>{fee.semester || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{fee.user_type || 'student'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.is_active ? 'default' : 'secondary'}>
                          {fee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(fee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeeStructure(fee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredFeeStructures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fee structures found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.user_profiles?.first_name} {payment.user_profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.user_profiles?.user_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.fee_structures?.fee_type}</TableCell>
                      <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                      <TableCell>
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.transaction_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredPayments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Overview of financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">{formatCurrency(dashboardStats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection Rate:</span>
                    <span className="font-medium">{dashboardStats.collectionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Payments:</span>
                    <span className="font-medium">{dashboardStats.pendingPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Students:</span>
                    <span className="font-medium">{dashboardStats.totalStudents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common reporting tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Payment Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Fee Structure Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Monthly Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Overdue Payments Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Fee Structure Dialog */}
      <Dialog open={isEditFeeDialogOpen} onOpenChange={setIsEditFeeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              Update the fee structure details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_fee_type">Fee Type *</Label>
                <Input
                  id="edit_fee_type"
                  value={feeForm.fee_type}
                  onChange={(e) => setFeeForm({...feeForm, fee_type: e.target.value})}
                  placeholder="e.g., Tuition Fee, Library Fee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Amount *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm({...feeForm, amount: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_academic_year">Academic Year</Label>
                <Select value={feeForm.academic_year} onValueChange={(value) => setFeeForm({...feeForm, academic_year: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_semester">Semester</Label>
                <Select value={feeForm.semester} onValueChange={(value) => setFeeForm({...feeForm, semester: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_user_type">User Type</Label>
              <Select value={feeForm.user_type} onValueChange={(value) => setFeeForm({...feeForm, user_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsEditFeeDialogOpen(false);
              setEditingFee(null);
              resetFeeForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFeeStructure}>
              Update Fee Structure
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceManagement;
