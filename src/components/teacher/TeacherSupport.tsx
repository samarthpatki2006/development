
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Plus, 
  Search,
  Book,
  MessageSquare,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherSupportProps {
  teacherData: any;
}

const TeacherSupport = ({ teacherData }: TeacherSupportProps) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'normal'
  });

  const faqs = [
    {
      question: "How do I upload lecture materials?",
      answer: "Go to 'My Courses', select your course, and use the 'Upload Material' button in the Materials tab. You can upload documents, videos, presentations, and audio files."
    },
    {
      question: "How do I create and grade assignments?",
      answer: "In the 'My Courses' section, select your course and go to the Assignments tab. Click 'Create Assignment' to add new assignments. You can grade submissions from the same section."
    },
    {
      question: "How do I mark attendance?",
      answer: "Use the 'Calendar & Attendance' module. Click on any scheduled class to mark attendance for all enrolled students. You can mark students as Present, Absent, or Late."
    },
    {
      question: "How do I communicate with students and parents?",
      answer: "Use the 'Communication Center' to send direct messages to students. For parent communication, use the 'Parent Interaction' module to schedule meetings and share progress reports."
    },
    {
      question: "How do I manage my gradebook?",
      answer: "The 'Gradebook' section allows you to input grades, calculate averages, and export grade sheets. You can add grades for assignments, quizzes, midterms, and finals."
    },
    {
      question: "How do I handle absence requests?",
      answer: "Student absence requests appear in your 'Calendar & Attendance' module. You can approve or reject requests with optional comments."
    },
    {
      question: "How do I create progress reports?",
      answer: "In the 'Parent Interaction' module, use the Progress Reports tab to create detailed reports including attendance, behavioral notes, strengths, and areas for improvement."
    },
    {
      question: "Can I export my class data?",
      answer: "Yes, you can export grades from the Gradebook section. Additional export features are available for attendance and student lists."
    }
  ];

  const supportContacts = [
    {
      type: "Technical Support",
      phone: "+1 (555) 123-4567",
      email: "tech-support@colcord.edu",
      hours: "24/7"
    },
    {
      type: "Academic Support",
      phone: "+1 (555) 123-4568",
      email: "academic-support@colcord.edu",
      hours: "Mon-Fri 8AM-6PM"
    },
    {
      type: "General Help",
      phone: "+1 (555) 123-4569",
      email: "help@colcord.edu",
      hours: "Mon-Fri 9AM-5PM"
    }
  ];

  useEffect(() => {
    fetchTickets();
  }, [teacherData]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('student_id', teacherData.user_id) // Using student_id field for teachers too
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          ...newTicket,
          student_id: teacherData.user_id,
          college_id: teacherData.college_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Support ticket created successfully'
      });

      setNewTicket({
        title: '',
        description: '',
        category: 'general',
        priority: 'normal'
      });

      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive'
      });
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Get assistance with the ColCord teacher portal
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Ticket title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  />

                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({...newTicket, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="academic">Academic Support</SelectItem>
                      <SelectItem value="general">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({...newTicket, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe your issue in detail"
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  />

                  <Button onClick={createTicket} className="w-full">
                    Create Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Quick Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Teacher Handbook
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Video Tutorials
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Getting Started Guide
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>My Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No support tickets</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">{ticket.title}</p>
                          <Badge variant={
                            ticket.status === 'open' ? 'destructive' :
                            ticket.status === 'in_progress' ? 'default' :
                            'secondary'
                          }>
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline">{ticket.category}</Badge>
                          <Badge variant={
                            ticket.priority === 'urgent' ? 'destructive' :
                            ticket.priority === 'high' ? 'default' :
                            'secondary'
                          }>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{ticket.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                        {ticket.resolved_at && (
                          <p className="text-xs text-green-600">
                            Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportContacts.map((contact, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold mb-2">{contact.type}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                    <p className="text-gray-600">{contact.hours}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSupport;
