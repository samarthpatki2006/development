
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Contact Support */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg md:text-xl">Contact Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Category *</label>
              <Select
                value={supportForm.category}
                onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account" className="text-xs sm:text-sm">Account & Login</SelectItem>
                  <SelectItem value="donations" className="text-xs sm:text-sm">Donations & Contributions</SelectItem>
                  <SelectItem value="events" className="text-xs sm:text-sm">Events & Registration</SelectItem>
                  <SelectItem value="documents" className="text-xs sm:text-sm">Documents & Transcripts</SelectItem>
                  <SelectItem value="networking" className="text-xs sm:text-sm">Networking & Community</SelectItem>
                  <SelectItem value="technical" className="text-xs sm:text-sm">Technical Issues</SelectItem>
                  <SelectItem value="other" className="text-xs sm:text-sm">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Priority</label>
              <Select
                value={supportForm.priority}
                onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs sm:text-sm">Low</SelectItem>
                  <SelectItem value="normal" className="text-xs sm:text-sm">Normal</SelectItem>
                  <SelectItem value="high" className="text-xs sm:text-sm">High</SelectItem>
                  <SelectItem value="urgent" className="text-xs sm:text-sm">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Subject *</label>
              <Input
                placeholder="Brief description of your issue..."
                value={supportForm.subject}
                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Message *</label>
              <Textarea
                placeholder="Please provide detailed information about your question or issue..."
                value={supportForm.message}
                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                rows={6}
                className="text-xs sm:text-sm"
              />
            </div>

            <Button onClick={handleSubmitSupport} className="w-full text-sm sm:text-base">
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Submit Support Request
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Alumni Office</p>
                  <p className="text-gray-600 text-xs sm:text-sm">+91 93110 13848</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Mon-Fri, 9:00 AM - 5:00 PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Email Support</p>
                  <p className="text-gray-600 text-xs sm:text-sm break-all">team@colcord.co.in</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Response within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Alumni Relations</p>
                  <p className="text-gray-600 text-xs sm:text-sm break-all">team@colcord.co.in</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Events and networking support</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Development Office</p>
                  <p className="text-gray-600 text-xs sm:text-sm break-all">team@colcord.co.in</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Donations and fundraising</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Office Hours</h4>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-base sm:text-lg md:text-xl">Frequently Asked Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Book className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg">{category.category}</h3>
                </div>
                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={`${categoryIndex}-${itemIndex}`}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 text-left hover:no-underline text-xs sm:text-sm font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-4 pb-2 sm:pb-3 text-gray-600 text-xs sm:text-sm">
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">Quick Links & Resources</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
              <Book className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Alumni Handbook</span>
            </Button>
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Alumni Directory</span>
            </Button>
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Newsletter Archive</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniSupport;
