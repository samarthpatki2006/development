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
  Check,
  AlertCircle
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newSubmission, setNewSubmission] = useState({
    title: '',
    content_type: 'exam_paper',
    category: '',
    description: '',
    access_level: 'public',
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
        access_level: 'all_teachers'
      },
      {
        id: '2',
        title: 'Grading Policy Manual',
        category: 'Assessment',
        version: '1.5',
        effective_date: '2024-01-15',
        document_url: '#',
        access_level: 'all_teachers'
      },
      {
        id: '3',
        title: 'Emergency Procedures Handbook',
        category: 'Safety',
        version: '3.0',
        effective_date: '2024-02-01',
        document_url: '#',
        access_level: 'all_teachers'
      }
    ]);
  };

  const fetchMySubmissions = async () => {
    try {
      // Fetch actual submissions from content_resources table
      const { data, error } = await supabase
        .from('content_resources')
        .select('*')
        .eq('created_by', teacherData.id)
        .eq('college_id', teacherData.college_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        // Fallback to mock data if there's an error
        setMySubmissions([
          {
            id: '1',
            title: 'Computer Science Mid-Term Paper',
            content_type: 'exam_paper',
            category: 'Computer Science Fundamentals',
            created_at: '2024-01-25',
            access_level: 'public',
            description: 'Mid-term examination paper'
          },
          {
            id: '2',
            title: 'Algorithm Analysis Question Set',
            content_type: 'question_bank',
            category: 'Data Structures & Algorithms',
            created_at: '2024-01-28',
            access_level: 'department',
            description: 'Comprehensive question bank for algorithms'
          }
        ]);
      } else {
        setMySubmissions(data || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setMySubmissions([]);
    }
  };

  const uploadFileToSupabase = async (file: File) => {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'video/mp4',
        'audio/mpeg',
        'audio/mp3'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not supported`);
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${teacherData.college_id}/${teacherData.id}/${fileName}`;

      console.log('Uploading file:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      // Check if storage bucket exists and is accessible
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error('Storage service unavailable');
      }

      const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
      if (!documentsBucket) {
        throw new Error('Documents storage bucket not found');
      }

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const submitDocument = async () => {
    try {
      setSubmitting(true);

      if (!newSubmission.file) {
        toast({
          title: 'Error',
          description: 'Please select a file to upload',
          variant: 'destructive'
        });
        return;
      }

      if (!newSubmission.title.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a document title',
          variant: 'destructive'
        });
        return;
      }

      // Validate required fields
      if (!teacherData?.id || !teacherData?.college_id) {
        toast({
          title: 'Error',
          description: 'Teacher data is incomplete',
          variant: 'destructive'
        });
        return;
      }

      let fileUrl = null;
      
      try {
        // Upload file to Supabase Storage
        fileUrl = await uploadFileToSupabase(newSubmission.file);
        console.log('File uploaded successfully:', fileUrl);
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }

      // Save document metadata to content_resources table
      const insertData = {
        college_id: teacherData.college_id,
        title: newSubmission.title.trim(),
        content_type: newSubmission.content_type,
        content_url: fileUrl,
        description: newSubmission.description.trim() || null,
        category: newSubmission.category.trim() || null,
        access_level: newSubmission.access_level,
        target_users: {},
        is_active: true,
        created_by: teacherData.id
      };

      console.log('Inserting document metadata:', insertData);

      const { data, error } = await supabase
        .from('content_resources')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to save document metadata');
      }

      toast({
        title: 'Success',
        description: 'Document submitted successfully'
      });

      // Reset form
      setNewSubmission({
        title: '',
        content_type: 'exam_paper',
        category: '',
        description: '',
        access_level: 'public',
        file: null
      });

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Close dialog
      setIsDialogOpen(false);

      // Refresh submissions
      await fetchMySubmissions();

    } catch (error) {
      console.error('Error submitting document:', error);
      
      let errorMessage = 'Failed to submit document. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadDocument = (documentUrl: string, title: string) => {
    if (documentUrl && documentUrl !== '#' && documentUrl.startsWith('http')) {
      window.open(documentUrl, '_blank');
    } else {
      toast({
        title: 'Download Started',
        description: `Downloading ${title}...`
      });
    }
  };

  const filterDocuments = (documents: any[]) => {
    if (!searchTerm) return documents;
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.course?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewSubmission({ ...newSubmission, file });
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit New Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Document Title *</label>
                      <Input
                        placeholder="Enter document title"
                        value={newSubmission.title}
                        onChange={(e) => setNewSubmission({...newSubmission, title: e.target.value})}
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Content Type *</label>
                      <select
                        className="w-full p-2 border rounded focus:outline-none bg-black focus:ring-2"
                        value={newSubmission.content_type}
                        onChange={(e) => setNewSubmission({...newSubmission, content_type: e.target.value})}
                      >
                        <option value="exam_paper">Exam Paper</option>
                        <option value="question_bank">Question Bank</option>
                        <option value="research_paper">Research Paper</option>
                        <option value="curriculum_doc">Curriculum Document</option>
                        <option value="presentation">Presentation</option>
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Input
                        placeholder="e.g., Course name, Subject"
                        value={newSubmission.category}
                        onChange={(e) => setNewSubmission({...newSubmission, category: e.target.value})}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Access Level *</label>
                      <select
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 bg-black"
                        value={newSubmission.access_level}
                        onChange={(e) => setNewSubmission({...newSubmission, access_level: e.target.value})}
                      >
                        <option value="public">Public</option>
                        <option value="department">Department Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        className="w-full p-2 border rounded min-h-[80px] focus:outline-none focus:ring-2 bg-black"
                        placeholder="Brief description of the document (optional)"
                        value={newSubmission.description}
                        onChange={(e) => setNewSubmission({...newSubmission, description: e.target.value})}
                        maxLength={500}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">File *</label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.txt"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>Max file size: 10MB. Supported: PDF, DOC, PPT, MP4, MP3, TXT</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={submitDocument} 
                      className="w-full"
                      disabled={submitting || !newSubmission.file || !newSubmission.title.trim()}
                    >
                      {submitting ? 'Submitting...' : 'Submit Document'}
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
                            onClick={() => downloadDocument('#', paper.title)}
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
                  {mySubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents submitted yet.</p>
                      <p>Click "Submit Document" to add your first document.</p>
                    </div>
                  ) : (
                    mySubmissions.map((submission) => (
                      <Card key={submission.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{submission.title}</h3>
                              <Badge variant="default">
                                <Check className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                              <Badge variant="outline">{submission.content_type}</Badge>
                              <Badge variant={
                                submission.access_level === 'public' ? 'default' : 
                                submission.access_level === 'department' ? 'secondary' : 
                                'destructive'
                              }>
                                {submission.access_level}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {submission.category && (
                                <p><span className="font-medium">Category:</span> {submission.category}</p>
                              )}
                              {submission.description && (
                                <p><span className="font-medium">Description:</span> {submission.description}</p>
                              )}
                              <p><span className="font-medium">Submitted:</span> {new Date(submission.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => downloadDocument(submission.content_url, submission.title)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
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