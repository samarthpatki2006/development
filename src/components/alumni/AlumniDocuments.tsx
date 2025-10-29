
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { FileText, Download, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

interface AlumniDocumentsProps {
  user: any;
}

const AlumniDocuments = ({ user }: AlumniDocumentsProps) => {
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    document_type: '',
    purpose: '',
    delivery_method: 'digital',
    delivery_address: ''
  });

  useEffect(() => {
    fetchDocumentRequests();
  }, [user]);

  const fetchDocumentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('user_id', user.user_id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setDocumentRequests(data || []);
    } catch (error) {
      console.error('Error fetching document requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.document_type || !newRequest.purpose) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (newRequest.delivery_method === 'physical' && !newRequest.delivery_address) {
      toast({
        title: 'Missing Address',
        description: 'Please provide delivery address for physical documents',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('document_requests')
        .insert({
          user_id: user.user_id,
          college_id: user.college_id,
          document_type: newRequest.document_type,
          purpose: newRequest.purpose,
          delivery_method: newRequest.delivery_method,
          delivery_address: newRequest.delivery_address || null,
          status: 'submitted',
          fee_amount: getDocumentFee(newRequest.document_type)
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your document request has been submitted successfully.',
      });

      setNewRequest({
        document_type: '',
        purpose: '',
        delivery_method: 'digital',
        delivery_address: ''
      });

      fetchDocumentRequests();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to submit document request',
        variant: 'destructive',
      });
    }
  };

  const getDocumentFee = (documentType: string) => {
    const fees: { [key: string]: number } = {
      'transcript': 25,
      'degree_certificate': 50,
      'alumni_certificate': 15,
      'recommendation_letter': 30
    };
    return fees[documentType] || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'ready':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleDownload = async (request: any) => {
    if (request.document_url) {
      // In a real implementation, this would handle secure document download
      window.open(request.document_url, '_blank');
    } else {
      toast({
        title: 'Document Not Ready',
        description: 'The document is not yet available for download.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* New Request Button */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <span className="flex items-center space-x-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg md:text-xl">Document Requests</span>
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto text-sm sm:text-base">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md mx-2">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Request Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Document Type *</label>
                    <Select
                      value={newRequest.document_type}
                      onValueChange={(value) => setNewRequest({ ...newRequest, document_type: value })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcript" className="text-xs sm:text-sm">Official Transcript ($25)</SelectItem>
                        <SelectItem value="degree_certificate" className="text-xs sm:text-sm">Degree Certificate ($50)</SelectItem>
                        <SelectItem value="alumni_certificate" className="text-xs sm:text-sm">Alumni Certificate ($15)</SelectItem>
                        <SelectItem value="recommendation_letter" className="text-xs sm:text-sm">Recommendation Letter ($30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Purpose *</label>
                    <Textarea
                      placeholder="Describe the purpose for this document..."
                      value={newRequest.purpose}
                      onChange={(e) => setNewRequest({ ...newRequest, purpose: e.target.value })}
                      rows={3}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Delivery Method</label>
                    <Select
                      value={newRequest.delivery_method}
                      onValueChange={(value) => setNewRequest({ ...newRequest, delivery_method: value })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital" className="text-xs sm:text-sm">Digital Download (Free)</SelectItem>
                        <SelectItem value="physical" className="text-xs sm:text-sm">Physical Mail (+$10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRequest.delivery_method === 'physical' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Delivery Address *</label>
                      <Textarea
                        placeholder="Enter your complete mailing address..."
                        value={newRequest.delivery_address}
                        onChange={(e) => setNewRequest({ ...newRequest, delivery_address: e.target.value })}
                        rows={3}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  )}

                  <Button onClick={handleSubmitRequest} className="w-full text-sm sm:text-base">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4">
            {documentRequests.length > 0 ? (
              documentRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500 bg-black-100">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                      <div className="flex-1 w-full">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          {getStatusIcon(request.status)}
                          <h3 className="font-semibold capitalize text-sm sm:text-base">
                            {request.document_type.replace('_', ' ')}
                          </h3>
                          <Badge variant={getStatusVariant(request.status)} className="text-xs">
                            {request.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2 text-xs sm:text-sm">{request.purpose}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                          <div>
                            <strong>Tracking ID:</strong> {request.tracking_id}
                          </div>
                          <div>
                            <strong>Delivery:</strong> {request.delivery_method}
                          </div>
                          <div>
                            <strong>Fee:</strong> ${request.fee_amount}
                          </div>
                          <div>
                            <strong>Payment:</strong> {request.payment_status}
                          </div>
                        </div>

                        <div className="text-[10px] sm:text-xs text-gray-500 space-y-1">
                          <div>Submitted: {new Date(request.submitted_at).toLocaleString()}</div>
                          {request.processed_at && (
                            <div>Processed: {new Date(request.processed_at).toLocaleString()}</div>
                          )}
                          {request.delivered_at && (
                            <div>Delivered: {new Date(request.delivered_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-4">
                        {request.status === 'ready' && request.document_url && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(request)}
                            className="flex items-center justify-center space-x-1 w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Download</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No document requests</h3>
                <p className="text-xs sm:text-sm text-gray-500">Click "New Request" to request your first document.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">Document Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium mb-3 text-sm sm:text-base">Processing Times</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li>• Official Transcript: 3-5 business days</li>
                <li>• Degree Certificate: 5-7 business days</li>
                <li>• Alumni Certificate: 2-3 business days</li>
                <li>• Recommendation Letter: 7-10 business days</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-sm sm:text-base">Important Notes</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li>• Digital documents are delivered via secure email</li>
                <li>• Physical documents require additional shipping fees</li>
                <li>• All documents are verified and stamped</li>
                <li>• Processing times may vary during peak periods</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniDocuments;
