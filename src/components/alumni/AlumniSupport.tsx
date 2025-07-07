
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { HelpCircle, MessageSquare, Phone, Mail, Send, Book, Users, DollarSign } from 'lucide-react';

interface AlumniSupportProps {
  user: any;
}

const AlumniSupport = ({ user }: AlumniSupportProps) => {
  const [supportForm, setSupportForm] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  const handleSubmitSupport = async () => {
    if (!supportForm.category || !supportForm.subject || !supportForm.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In a real implementation, this would submit to a support ticket system
      toast({
        title: 'Support Request Submitted',
        description: 'We will get back to you within 24-48 hours.',
      });

      setSupportForm({
        category: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit support request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const faqs = [
    {
      category: 'Account & Login',
      items: [
        {
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. You will receive an email with instructions to create a new password.'
        },
        {
          question: 'How do I update my contact information?',
          answer: 'Please contact the alumni office with your updated information. We will verify your identity and update your records accordingly.'
        },
        {
          question: 'I cannot access my account. What should I do?',
          answer: 'If you are having trouble accessing your account, please submit a support request below with your user code and we will assist you.'
        }
      ]
    },
    {
      category: 'Donations & Contributions',
      items: [
        {
          question: 'How can I make a donation?',
          answer: 'You can make donations through the Contributions section. We accept various payment methods including credit cards, bank transfers, and checks.'
        },
        {
          question: 'Are my donations tax-deductible?',
          answer: 'Yes, donations to the college are generally tax-deductible. You will receive a receipt for tax purposes after your donation is processed.'
        },
        {
          question: 'Can I set up recurring donations?',
          answer: 'Yes, you can set up recurring monthly or annual donations. Please contact the development office for assistance with setting up recurring gifts.'
        }
      ]
    },
    {
      category: 'Events & Networking',
      items: [
        {
          question: 'How do I register for alumni events?',
          answer: 'You can view and register for events in the Events section. Some events may require advance registration due to limited capacity.'
        },
        {
          question: 'Can I bring guests to alumni events?',
          answer: 'Guest policies vary by event. Please check the specific event details or contact the alumni office for information about bringing guests.'
        },
        {
          question: 'How do I join alumni networks?',
          answer: 'You can browse and join alumni networks in the Networking section. Networks are organized by industry, location, graduation year, and interests.'
        }
      ]
    },
    {
      category: 'Documents & Transcripts',
      items: [
        {
          question: 'How long does it take to process document requests?',
          answer: 'Processing times vary by document type: Transcripts (3-5 days), Degree Certificates (5-7 days), Alumni Certificates (2-3 days), Recommendation Letters (7-10 days).'
        },
        {
          question: 'What are the fees for official documents?',
          answer: 'Fees are: Official Transcript ($25), Degree Certificate ($50), Alumni Certificate ($15), Recommendation Letter ($30). Physical delivery adds $10.'
        },
        {
          question: 'Can I get expedited processing for urgent requests?',
          answer: 'Yes, expedited processing is available for an additional fee. Please contact the registrar\'s office for expedited service options.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Contact Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select
                value={supportForm.category}
                onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account & Login</SelectItem>
                  <SelectItem value="donations">Donations & Contributions</SelectItem>
                  <SelectItem value="events">Events & Registration</SelectItem>
                  <SelectItem value="documents">Documents & Transcripts</SelectItem>
                  <SelectItem value="networking">Networking & Community</SelectItem>
                  <SelectItem value="technical">Technical Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select
                value={supportForm.priority}
                onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject *</label>
              <Input
                placeholder="Brief description of your issue..."
                value={supportForm.subject}
                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <Textarea
                placeholder="Please provide detailed information about your question or issue..."
                value={supportForm.message}
                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                rows={6}
              />
            </div>

            <Button onClick={handleSubmitSupport} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Submit Support Request
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Alumni Office</p>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9:00 AM - 5:00 PM</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-gray-600">alumni@college.edu</p>
                  <p className="text-sm text-gray-500">Response within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Alumni Relations</p>
                  <p className="text-gray-600">relations@college.edu</p>
                  <p className="text-sm text-gray-500">Events and networking support</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Development Office</p>
                  <p className="text-gray-600">giving@college.edu</p>
                  <p className="text-sm text-gray-500">Donations and fundraising</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Office Hours</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p>Saturday: 10:00 AM - 2:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Book className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                </div>
                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={`${categoryIndex}-${itemIndex}`}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 text-gray-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              </div>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Book className="h-6 w-6" />
              <span>Alumni Handbook</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span>Alumni Directory</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Mail className="h-6 w-6" />
              <span>Newsletter Archive</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniSupport;
