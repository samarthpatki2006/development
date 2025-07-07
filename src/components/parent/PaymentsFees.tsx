
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Download, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface PaymentsFeesProps {
  user: any;
}

const PaymentsFees = ({ user }: PaymentsFeesProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [feeReminders, setFeeReminders] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchFeesData(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase.rpc('get_parent_children', {
        parent_uuid: user.user_id
      });

      if (error) throw error;
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: 'Error',
        description: 'Failed to load children data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeesData = async (studentId: string) => {
    try {
      setLoading(true);

      // Fetch fee reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('fee_reminders')
        .select(`
          *,
          fee_structures (
            fee_type,
            academic_year,
            semester,
            amount
          )
        `)
        .eq('user_id', studentId)
        .order('due_date', { ascending: true });

      if (remindersError) throw remindersError;
      setFeeReminders(remindersData || []);

      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('fee_payments')
        .select(`
          *,
          fee_structures (
            fee_type,
            academic_year,
            semester
          )
        `)
        .eq('user_id', studentId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPaymentHistory(paymentsData || []);

    } catch (error) {
      console.error('Error fetching fees data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fees data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedFee || !paymentMethod) {
      toast({
        title: 'Missing Information',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('fee_payments')
        .insert({
          user_id: selectedChild,
          college_id: user.college_id,
          fee_structure_id: selectedFee.fee_structure_id,
          amount_paid: selectedFee.due_amount,
          payment_method: paymentMethod,
          transaction_id: `TXN_${Date.now()}`, // Generate simple transaction ID
          status: 'completed'
        });

      if (paymentError) throw paymentError;

      // Update fee reminder status
      const { error: updateError } = await supabase
        .from('fee_reminders')
        .update({ status: 'paid' })
        .eq('id', selectedFee.id);

      if (updateError) throw updateError;

      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully',
      });

      setSelectedFee(null);
      setPaymentMethod('');
      fetchFeesData(selectedChild);
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
    // Create a simple receipt content
    const receiptContent = `
PAYMENT RECEIPT
===============

Transaction ID: ${payment.transaction_id}
Date: ${new Date(payment.payment_date).toLocaleDateString()}
Amount: ₹${Number(payment.amount_paid).toLocaleString()}
Fee Type: ${payment.fee_structures.fee_type}
Academic Year: ${payment.fee_structures.academic_year}
Payment Method: ${payment.payment_method}
Status: ${payment.status}

Thank you for your payment!
    `;

    // Create and download the receipt
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${payment.transaction_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedChildName = children.find(child => child.student_id === selectedChild)?.student_name || '';
  const pendingFees = feeReminders.filter(fee => fee.status === 'pending');
  const totalPending = pendingFees.reduce((sum, fee) => sum + Number(fee.due_amount), 0);

  return (
    <div className="space-y-6">
      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.student_id} value={child.student_id}>
                  {child.student_name} ({child.user_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChild && (
        <>
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Payment Summary - {selectedChildName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">₹{totalPending.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{pendingFees.length}</div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{paymentHistory.length}</div>
                  <p className="text-sm text-gray-600">Completed Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pending Fee Payments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingFees.map((fee) => (
                  <div key={fee.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{fee.fee_structures.fee_type}</h4>
                        <p className="text-sm text-gray-600">
                          {fee.fee_structures.academic_year} - {fee.fee_structures.semester || 'Full Year'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(fee.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{Number(fee.due_amount).toLocaleString()}</div>
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedFee(fee)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Make Payment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Fee Type</Label>
                              <Input value={fee.fee_structures.fee_type} disabled />
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <Input value={`₹${Number(fee.due_amount).toLocaleString()}`} disabled />
                            </div>
                            <div>
                              <Label>Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="credit_card">Credit Card</SelectItem>
                                  <SelectItem value="debit_card">Debit Card</SelectItem>
                                  <SelectItem value="net_banking">Net Banking</SelectItem>
                                  <SelectItem value="upi">UPI</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={processPayment} className="w-full">
                              Process Payment
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {pendingFees.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No pending payments</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Payment History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{payment.fee_structures.fee_type}</h4>
                        <p className="text-sm text-gray-600">
                          {payment.fee_structures.academic_year} - {payment.fee_structures.semester || 'Full Year'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Paid: {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Transaction ID: {payment.transaction_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{Number(payment.amount_paid).toLocaleString()}</div>
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Payment Method: {payment.payment_method}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(payment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </div>
                ))}
                {paymentHistory.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No payment history</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PaymentsFees;
