import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye,
  Plus,
  Search,
  Archive,
  BookOpen,
  Shield,
  Clock,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherDocumentsProps {
  teacherData: any;
}

const TeacherDocuments = ({ teacherData }: TeacherDocumentsProps) => {
  const [examPapers, setExamPapers] = useState<any[]>([]);
  const [questionBanks, setQuestionBanks] = useState<any[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [newSubmission, setNewSubmission] = useState({
    title: '',
    document_type: 'exam_paper',
    course_id: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDocuments();
  }, [teacherData]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchExamPapers(),
        fetchQuestionBanks(),
        fetchPolicyDocuments(),
        fetchMySubmissions()
      ]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamPapers = async () => {
    // Simulate exam papers data
    setExamPapers([
      {
        id: '1',
        title: 'Data Structures Mid-Term Exam',
        course: 'Data Structures & Algorithms',
        semester: 'Fall 2024',
        type: 'midterm',
        submitted_by: 'Dr. Sarah Johnson',
        submitted_at: '2024-01-15',
        status: 'approved',
        version: '1.2'
      },
      {
        id: '2',
        title: 'Database Management Final Exam',
        course: 'Database Management Systems',
        semester: 'Spring 2024',
        type: 'final',
        submitted_by: 'Prof. Michael Chen',
        submitted_at: '2024-01-20',
        status: 'pending_review',
        version: '1.0'
      }
    ]);
  };

  const fetchQuestionBanks = async () => {
    // Simulate question banks data
    setQuestionBanks([
      {
        id: '1',
        title: 'Computer Networks Question Bank',
        course: 'Computer Networks',
        category: 'Multiple Choice',
        questions_count: 150,
        last_updated: '2024-01-18',
        access_level: 'department',
        created_by: 'Dr. Emily Rodriguez'
      },
      {
        id: '2',
        title: 'Programming Fundamentals MCQs',
        course: 'Programming Fundamentals',
        category: 'Mixed',
        questions_count: 200,
        last_updated: '2024-01-22',
        access_level: 'private',
        created_by: teacherData.first_name + ' ' + teacherData.last_name
      }
    ]);
  };

  const fetchPolicyDocuments = async () => {
    // Simulate policy documents data
    setPolicyDocuments([
      {
        id: '1',
        title: 'Academic Integrity Guidelines',
        category: 'Academic Policy',
        version: '2.1',
        effective_date: '2024-01-01',
        document_url: '#',
        access_level: 'all_faculty'
      },
      {
        id: '2',
        title: 'Grading Policy Manual',
        category: 'Assessment',
        version: '1.5',
        effective_date: '2024-01-15',
        document_url: '#',
        access_level: 'all_faculty'
      },
      {
        id: '3',
        title: 'Emergency Procedures Handbook',
        category: 'Safety',
        version: '3.0',
        effective_date: '2024-02-01',
        document_url: '#',
        access_level: 'all_faculty'
      }
    ]);
  };

  const fetchMySubmissions = async () => {
    // Simulate teacher's submissions
    setMySubmissions([
      {
        id: '1',
        title: 'Computer Science Mid-Term Paper',
        type: 'exam_paper',
        course: 'Computer Science Fundamentals',
        submitted_at: '2024-01-25',
        status: 'approved',
        version: '1.0',
        review_comments: 'Excellent coverage of topics'
      },
      {
        id: '2',
        title: 'Algorithm Analysis Question Set',
        type: 'question_bank',
        course: 'Data Structures & Algorithms',
        submitted_at: '2024-01-28',
        status: 'pending_review',
        version: '1.0',
        review_comments: null
      }
    ]);
  };

  const submitDocument = async () => {
    try {
      if (!newSubmission.file) {
        toast({
          title: 'Error',
          description: 'Please select a file to upload',
          variant: 'destructive'
        });
        return;
      }

      // In a real implementation, you would upload to Supabase Storage
      const fileUrl = `https://example.com/uploads/${newSubmission.file.name}`;

      const submissionData = {
        ...newSubmission,
        submitted_by: teacherData.user_id,
        submitted_at: new Date().toISOString(),
        status: 'pending_review',
        version: '1.0',
        file_url: fileUrl
      };

      setMySubmissions(prev => [...prev, { ...submissionData, id: Date.now().toString() }]);

      toast({
        title: 'Success',
        description: 'Document submitted successfully'
      });

      setNewSubmission({
        title: '',
        document_type: 'exam_paper',
        course_id: '',
        description: '',
        file: null
      });

    } catch (error) {
      console.error('Error submitting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit document',
        variant: 'destructive'
      });
    }
  };

  const downloadDocument = (documentId: string, title: string) => {
    // Simulate document download
    toast({
      title: 'Download Started',
      description: `Downloading ${title}...`
    });
  };

  const filterDocuments = (documents: any[]) => {
    if (!searchTerm) return documents;
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.course?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper permission="upload_materials">
      <div className="space-y-6">
        {/* Search and Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Document Management
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit New Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Document title"
                      value={newSubmission.title}
                      onChange={(e) => setNewSubmission({...newSubmission, title: e.target.value})}
                    />
                    
                    <select
                      className="w-full p-2 border rounded"
                      value={newSubmission.document_type}
                      onChange={(e) => setNewSubmission({...newSubmission, document_type: e.target.value})}
                    >
                      <option value="exam_paper">Exam Paper</option>
                      <option value="question_bank">Question Bank</option>
                      <option value="research_paper">Research Paper</option>
                      <option value="curriculum_doc">Curriculum Document</option>
                    </select>
                    
                    <Input
                      placeholder="Course name"
                      value={newSubmission.course_id}
                      onChange={(e) => setNewSubmission({...newSubmission, course_id: e.target.value})}
                    />
                    
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewSubmission({...newSubmission, file: e.target.files?.[0] || null})}
                    />
                    
                    <Button onClick={submitDocument} className="w-full">
                      Submit Document
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="exam-papers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exam-papers">Exam Papers</TabsTrigger>
            <TabsTrigger value="question-banks">Question Banks</TabsTrigger>
            <TabsTrigger value="policies">Policy Documents</TabsTrigger>
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          </TabsList>

          {/* Exam Papers */}
          <TabsContent value="exam-papers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exam Papers Repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterDocuments(examPapers).map((paper) => (
                    <Card key={paper.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{paper.title}</h3>
                            <Badge variant={paper.status === 'approved' ? 'default' : 'secondary'}>
                              {paper.status}
                            </Badge>
                            <Badge variant="outline">v{paper.version}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Course:</span> {paper.course}</p>
                            <p><span className="font-medium">Semester:</span> {paper.semester}</p>
                            <p><span className="font-medium">Type:</span> {paper.type}</p>
                            <p><span className="font-medium">Submitted by:</span> {paper.submitted_by}</p>
                            <p><span className="font-medium">Date:</span> {new Date(paper.submitted_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => downloadDocument(paper.id, paper.title)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Banks */}
          <TabsContent value="question-banks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Question Banks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterDocuments(questionBanks).map((bank) => (
                    <Card key={bank.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{bank.title}</h3>
                            <Badge variant="outline">{bank.questions_count} questions</Badge>
                            <Badge variant={bank.access_level === 'private' ? 'secondary' : 'default'}>
                              {bank.access_level}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Course:</span> {bank.course}</p>
                            <p><span className="font-medium">Category:</span> {bank.category}</p>
                            <p><span className="font-medium">Created by:</span> {bank.created_by}</p>
                            <p><span className="font-medium">Last updated:</span> {new Date(bank.last_updated).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Browse
                          </Button>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Documents */}
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Policy Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterDocuments(policyDocuments).map((policy) => (
                    <Card key={policy.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{policy.title}</h3>
                            <Badge variant="outline">v{policy.version}</Badge>
                            <Badge variant="secondary">{policy.category}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Effective Date:</span> {new Date(policy.effective_date).toLocaleDateString()}</p>
                            <p><span className="font-medium">Access Level:</span> {policy.access_level}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Submissions */}
          <TabsContent value="my-submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  My Document Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mySubmissions.map((submission) => (
                    <Card key={submission.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{submission.title}</h3>
                            <Badge variant={
                              submission.status === 'approved' ? 'default' : 
                              submission.status === 'pending_review' ? 'secondary' : 
                              'destructive'
                            }>
                              {submission.status === 'pending_review' ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending Review
                                </>
                              ) : submission.status === 'approved' ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : submission.status}
                            </Badge>
                            <Badge variant="outline">{submission.type}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Course:</span> {submission.course}</p>
                            <p><span className="font-medium">Submitted:</span> {new Date(submission.submitted_at).toLocaleDateString()}</p>
                            <p><span className="font-medium">Version:</span> {submission.version}</p>
                            {submission.review_comments && (
                              <p><span className="font-medium">Comments:</span> {submission.review_comments}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {submission.status === 'approved' && (
                            <Button size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionWrapper>
  );
};

export default TeacherDocuments;