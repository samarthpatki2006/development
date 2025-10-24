
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
      phone: "+91 93110 13848",
      email: "team@colcord.co.in",
      hours: "24/7"
    },
    {
      type: "Academic Support",
      phone: "+91 93110 13848",
      email: "team@colcord.co.in",
      hours: "Mon-Fri 8AM-6PM"
    },
    {
      type: "General Help",
      phone: "+91 93110 13848",
      email: "team@colcord.co.in",
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Get assistance with the ColCord teacher portal
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full text-sm h-9 sm:h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Create Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    placeholder="Ticket title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="text-sm h-9 sm:h-10"
                  />

                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className=" text-sm h-9 sm:h-10">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem value="technical" className="text-sm">Technical Issue</SelectItem>
                      <SelectItem value="academic" className="text-sm">Academic Support</SelectItem>
                      <SelectItem value="general" className="text-sm">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger className="text-sm h-9 sm:h-10">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem value="low" className="text-sm">Low</SelectItem>
                      <SelectItem value="normal" className="text-sm">Normal</SelectItem>
                      <SelectItem value="high" className="text-sm">High</SelectItem>
                      <SelectItem value="urgent" className="text-sm">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe your issue in detail"
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="resize-none"
                  />

                  <Button onClick={createTicket} className="w-full text-sm h-9 sm:h-10">
                    Create Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Book className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Quick Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm h-9 sm:h-12  hover:bg-white/5 transition-all duration-300 will-change-transform">
              <FileText className="h-4 w-4 mr-2" />
              Teacher Handbook
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9 sm:h-12 transition-all duration-300">
              <MessageSquare className="h-4 w-4 mr-2 will-change-transform" />
              Video Tutorials
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9 sm:h-12 transition-all duration-300">
              <HelpCircle className="h-4 w-4 mr-2 will-change-transform" />
              Getting Started Guide
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Tickets */}
      <Card className="">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">My Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {tickets.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 " />
              <p className="text-sm text-muted-foreground">No support tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-medium text-sm sm:text-base truncate">{ticket.title}</p>
                          <Badge
                            variant={
                              ticket.status === 'open' ? 'destructive' :
                                ticket.status === 'in_progress' ? 'default' :
                                  'secondary'
                            }
                            className="text-xs"
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/20">
                            {ticket.category}
                          </Badge>
                          <Badge
                            variant={
                              ticket.priority === 'urgent' ? 'destructive' :
                                ticket.priority === 'high' ? 'default' :
                                  'secondary'
                            }
                            className="text-xs"
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                          {ticket.resolved_at && (
                            <p className="text-xs text-green-400">
                              Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
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
      <Card className="">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className=""
              >
                <AccordionTrigger className="text-sm sm:text-base text-left hover:no-underline hover:text-primary transition-colors duration-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-gray-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Contact Support</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {supportContacts.map((contact, index) => (
              <Card key={index} className="bg-background/30 hover:bg-background/50 hover:scale-102 hover:-translate-y-1 transition-all duration-200 will-change-transform">
                <CardContent className="p-3 sm:p-4 text-center">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">{contact.type}</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="truncate">{contact.phone}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <p className="text-gray-400">{contact.hours}</p>
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
