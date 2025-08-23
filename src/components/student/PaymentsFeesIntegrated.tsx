import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Receipt, 
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { feeManagementService, type StudentFeeDetails, type FeePayment } from '@/services/feeManagementService';

interface PaymentsFeesProps {
  studentData: any;
}

const PaymentsFees: React.FC<PaymentsFeesProps> = ({ studentData }) => {
  const [studentFees, setStudentFees] = useState<StudentFeeDetails[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<FeePayment[]>([]);
  const [feeReminders, setFeeReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFeeDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [processing, setProcessing] = useState(false);

  // Ensure we have a valid student ID
  const studentId = studentData?.id || 'student_default_123';
  const collegeId = studentData?.college_id || 'college_default_123';

  useEffect(() => {
    fetchAllPaymentData();
  }, [studentId]);

  const fetchAllPaymentData = async () => {
    setLoading(true);
    try {
      // Fetch student fee details with payment status
      const feeDetails = await feeManagementService.getStudentFeeDetails(studentId);
      setStudentFees(feeDetails);

      // Fetch payment history
      const history = await feeManagementService.getStudentPaymentHistory(studentId);
      setPaymentHistory(history);

      // Fetch fee reminders
      const reminders = await feeManagementService.getStudentFeeReminders(studentId);
      setFeeReminders(reminders);

      console.log('Fetched fee details:', feeDetails);
      console.log('Fetched payment history:', history);
      console.log('Fetched reminders:', reminders);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Using mock data for demonstration.",
        variant: "destructive",
      });
      
      // Set mock data for demonstration
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    const mockFees: StudentFeeDetails[] = [
      {
        fee_structure_id: 'fee_1',
        fee_type: 'tuition',
        fee_amount: 15000,
        total_paid: 10000,
        balance_due: 5000,
        due_date: '2024-12-31',
        payment_status: 'pending',
        academic_year: '2024-25',
        semester: 'semester_1',
        description: 'Semester 1 Tuition Fee'
      },
      {
        fee_structure_id: 'fee_2',
        fee_type: 'hostel',
        fee_amount: 8000,
        total_paid: 8000,
        balance_due: 0,
        due_date: '2024-12-31',
        payment_status: 'paid',
        academic_year: '2024-25',
        semester: 'semester_1',
        description: 'Semester 1 Hostel Fee'
      },
      {
        fee_structure_id: 'fee_3',
        fee_type: 'library',
        fee_amount: 1500,
        total_paid: 0,
        balance_due: 1500,
        due_date: '2024-11-15',
        payment_status: 'overdue',
        academic_year: '2024-25',
        semester: 'annual',
        description: 'Annual Library Fee'
      },
      {
        fee_structure_id: 'fee_4',
        fee_type: 'examination',
        fee_amount: 2000,
        total_paid: 0,
        balance_due: 2000,
        due_date: '2024-11-30',
        payment_status: 'pending',
        academic_year: '2024-25',
        semester: 'semester_1',
        description: 'Semester 1 Examination Fee'
      }
    ];

    const mockPayments: FeePayment[] = [
      {
        id: 'payment_1',
        user_id: studentId,
        college_id: collegeId,
        fee_structure_id: 'fee_1',
        amount_paid: 10000,
        payment_date: '2024-10-15T10:30:00Z',
        payment_method: 'online',
        transaction_id: 'TXN001234567',
        status: 'completed',
        created_at: '2024-10-15T10:30:00Z',
        updated_at: '2024-10-15T10:30:00Z'
      },
      {
        id: 'payment_2',
        user_id: studentId,
        college_id: collegeId,
        fee_structure_id: 'fee_2',
        amount_paid: 8000,
        payment_date: '2024-09-20T14:15:00Z',
        payment_method: 'bank_transfer',
        transaction_id: 'TXN001234568',
        status: 'completed',
        created_at: '2024-09-20T14:15:00Z',
        updated_at: '2024-09-20T14:15:00Z'
      }
    ];

    setStudentFees(mockFees);
    setPaymentHistory(mockPayments);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'online':
        return <Badge className="bg-blue-100 text-blue-800">Online</Badge>;
      case 'bank_transfer':
        return <Badge className="bg-purple-100 text-purple-800">Bank Transfer</Badge>;
      case 'cash':
        return <Badge className="bg-green-100 text-green-800">Cash</Badge>;
      case 'cheque':
        return <Badge className="bg-orange-100 text-orange-800">Cheque</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFee || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedFee.balance_due) {
      toast({
        title: "Error",
        description: `Payment amount must be between ₹1 and ₹${selectedFee.balance_due}.`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await feeManagementService.processPayment({
        userId: studentId,
        collegeId: collegeId,
        feeStructureId: selectedFee.fee_structure_id,
        amountPaid: amount,
        paymentMethod: paymentMethod,
        transactionId: `TXN${Date.now()}`,
        notes: `Payment for ${selectedFee.fee_type} - ${selectedFee.academic_year}`
      });

      if (result.success) {
        toast({
          title: "Payment Successful",
          description: `₹${amount} payment processed successfully.`,
        });
        
        // Refresh data
        await fetchAllPaymentData();
        setPaymentDialog(false);
        setSelectedFee(null);
        setPaymentAmount('');
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to process payment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentDialog = (fee: StudentFeeDetails) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.balance_due.toString());
    setPaymentDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate totals
  const totalDue = studentFees.reduce((sum, fee) => sum + fee.balance_due, 0);
  const totalPaid = studentFees.reduce((sum, fee) => sum + fee.total_paid, 0);
  const overdueCount = studentFees.filter(fee => fee.payment_status === 'overdue').length;
  const pendingCount = studentFees.filter(fee => fee.payment_status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Fees ({studentFees.filter(f => f.balance_due > 0).length})</TabsTrigger>
          <TabsTrigger value="history">Payment History ({paymentHistory.length})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders ({feeReminders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Outstanding Fees</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentFees.filter(fee => fee.balance_due > 0).map((fee) => (
                  <div key={fee.fee_structure_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold capitalize text-lg">{fee.fee_type} Fee</h3>
                        <p className="text-sm text-gray-600">{fee.description}</p>
                        <p className="text-sm text-gray-500">{fee.academic_year} • {fee.semester}</p>
                      </div>
                      <div className="text-right space-y-1">
                        {getStatusBadge(fee.payment_status)}
                        <p className="text-sm text-gray-600">Due: {formatDate(fee.due_date || '')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Fee</p>
                            <p className="font-semibold">{formatCurrency(fee.fee_amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(fee.total_paid)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Balance</p>
                            <p className="font-semibold text-red-600">{formatCurrency(fee.balance_due)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPaymentDialog(fee)}
                          disabled={fee.balance_due <= 0}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {studentFees.filter(fee => fee.balance_due > 0).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">All Fees Paid!</h3>
                    <p className="text-gray-600">You have no outstanding fee payments.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Payment History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map((payment) => {
                  const feeInfo = studentFees.find(f => f.fee_structure_id === payment.fee_structure_id);
                  return (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold capitalize">
                            {feeInfo?.fee_type || 'Fee'} Payment
                          </h3>
                          <p className="text-sm text-gray-600">
                            Transaction ID: {payment.transaction_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.payment_date)}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-lg text-green-600">
                            {formatCurrency(payment.amount_paid)}
                          </p>
                          {getMethodBadge(payment.payment_method)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {paymentHistory.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No Payment History</h3>
                    <p className="text-gray-600">Your payment history will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Fee Reminders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeReminders.map((reminder) => (
                  <div key={reminder.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {reminder.fee_structures?.fee_type} Fee Reminder
                        </h3>
                        <p className="text-sm text-gray-600">
                          Due Date: {formatDate(reminder.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(reminder.due_amount)}
                        </p>
                        <Badge className="bg-orange-100 text-orange-800">
                          {reminder.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {feeReminders.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No Active Reminders</h3>
                    <p className="text-gray-600">You have no pending fee reminders.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold capitalize">{selectedFee.fee_type} Fee</h3>
                <p className="text-sm ">{selectedFee.description}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span className="font-semibold">{formatCurrency(selectedFee.fee_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Paid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedFee.total_paid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Balance Due:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(selectedFee.balance_due)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-amount">Payment Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedFee.balance_due}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? "Processing..." : `Pay ${formatCurrency(parseFloat(paymentAmount) || 0)}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPaymentDialog(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsFees;
