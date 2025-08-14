
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Receipt, 
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentsFeesProps {
  studentData: any;
}

const PaymentsFees: React.FC<PaymentsFeesProps> = ({ studentData }) => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, [studentData]);

  const fetchPaymentData = async () => {
    try {
      // Fetch fee structures for the college and current academic year
      const currentYear = new Date().getFullYear();
      const { data: feeStructuresData } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('college_id', studentData.college_id)
        .eq('is_active', true)
        .or(`user_type.eq.${studentData.user_type},user_type.is.null`)
        .order('created_at', { ascending: false });

      setFeeStructures(feeStructuresData || []);

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from('fee_payments')
        .select(`
          *,
          fee_structures(fee_type, amount, academic_year, semester)
        `)
        .eq('user_id', studentData.user_id)
        .order('payment_date', { ascending: false });

      setPayments(paymentsData || []);

      // Calculate pending fees and totals
      const paidFeeStructureIds = paymentsData?.map(p => p.fee_structure_id) || [];
      const pending = feeStructuresData?.filter(fs => 
        !paidFeeStructureIds.includes(fs.id)
      ) || [];

      setPendingFees(pending);

      const pendingAmount = pending.reduce((sum, fee) => sum + Number(fee.amount), 0);
      setTotalPending(pendingAmount);

      const paidAmount = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount_paid), 0) || 0;
      setTotalPaid(paidAmount);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (feeStructureId: string, amount: number, paymentMethod: string) => {
    try {
      // Generate a dummy transaction ID (in real implementation, this would come from payment gateway)
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('fee_payments')
        .insert({
          college_id: studentData.college_id,
          user_id: studentData.user_id,
          fee_structure_id: feeStructureId,
          amount_paid: amount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          status: 'completed',
          payment_date: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Payment Successful',
        description: `Payment of $${amount} completed successfully`,
      });

      // Refresh data
      fetchPaymentData();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const downloadReceipt = (payment: any) => {
    // In a real implementation, this would generate and download a PDF receipt
    const receiptData = {
      transaction_id: payment.transaction_id,
      amount: payment.amount_paid,
      date: payment.payment_date,
      fee_type: payment.fee_structures?.fee_type,
      student_name: `${studentData.first_name} ${studentData.last_name}`,
      student_id: studentData.user_code
    };
    
    console.log('Receipt data:', receiptData);
    toast({
      title: 'Receipt Downloaded',
      description: 'Receipt has been downloaded successfully',
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading payment information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payments & Fees</h2>
        <div className="flex space-x-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Pending: {totalPending.toFixed(2)}
          </Badge>
          <Badge variant="default" className="text-lg px-3 py-1">
            Paid: {totalPaid.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Fees</p>
                <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Receipt className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">{pendingFees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="breakdown">Fee Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingFees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Fees Paid!</h3>
                <p className="text-gray-500">You have no pending fee payments at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingFees.map((fee: any) => (
                <Card key={fee.id} className="border-l-4 border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{fee.fee_type}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Academic Year: {fee.academic_year}</p>
                          {fee.semester && <p>Semester: {fee.semester}</p>}
                          <p>Amount: <span className="font-semibold text-lg">${Number(fee.amount).toFixed(2)}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-3">
                          Pending
                        </Badge>
                        <br />
                        <PaymentDialog 
                          fee={fee}
                          onPayment={makePayment}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payment history found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {payment.fee_structures?.fee_type || 'Fee Payment'}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Transaction ID: {payment.transaction_id}</p>
                          <p>Payment Date: {new Date(payment.payment_date).toLocaleDateString()}</p>
                          <p>Payment Method: {payment.payment_method}</p>
                          <p>Academic Year: {payment.fee_structures?.academic_year}</p>
                          {payment.fee_structures?.semester && (
                            <p>Semester: {payment.fee_structures?.semester}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 mb-3">
                          ${Number(payment.amount_paid).toFixed(2)}
                        </p>
                        <Badge variant="default" className="mb-3">
                          {payment.status}
                        </Badge>
                        <br />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadReceipt(payment)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No fee structure information available</p>
              ) : (
                <div className="space-y-4">
                  {feeStructures.map((fee: any) => {
                    const isPaid = payments.some(p => p.fee_structure_id === fee.id);
                    return (
                      <div key={fee.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{fee.fee_type}</h4>
                          <p className="text-sm text-gray-600">
                            {fee.academic_year} {fee.semester && `- ${fee.semester}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${Number(fee.amount).toFixed(2)}</p>
                          <Badge variant={isPaid ? 'default' : 'destructive'}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Payment Dialog Component
const PaymentDialog: React.FC<{
  fee: any;
  onPayment: (feeStructureId: string, amount: number, paymentMethod: string) => void;
}> = ({ fee, onPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await onPayment(fee.id, Number(fee.amount), paymentMethod);
      setIsOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make Payment - {fee.fee_type}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Fee Type:</span>
                <span>{fee.fee_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Academic Year:</span>
                <span>{fee.academic_year}</span>
              </div>
              {fee.semester && (
                <div className="flex justify-between">
                  <span>Semester:</span>
                  <span>{fee.semester}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>${Number(fee.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online_banking">Online Banking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a demo payment system. In a real implementation, 
              you would be redirected to a secure payment gateway.
            </p>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Pay $${Number(fee.amount).toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsFees;
