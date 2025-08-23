
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  FileText, 
  Plus,
  Video,
  Phone,
  MessageSquare,
  Share
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TeacherParentInteractionProps {
  teacherData: any;
}

const TeacherParentInteraction = ({ teacherData }: TeacherParentInteractionProps) => {
  const [students, setStudents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [progressReports, setProgressReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMeeting, setNewMeeting] = useState({
    student_id: '',
    parent_id: '',
    meeting_date: '',
    meeting_type: 'in_person',
    agenda: ''
  });

  const [newReport, setNewReport] = useState({
    student_id: '',
    report_period: '',
    attendance_percentage: 0,
    behavioral_notes: '',
    strengths: '',
    areas_for_improvement: '',
    shared_with_parents: false
  });

  useEffect(() => {
    fetchData();
  }, [teacherData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudents(),
        fetchMeetings(),
        fetchProgressReports()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', teacherData.user_id);

    if (coursesData) {
      const courseIds = coursesData.map(course => course.id);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          user_profiles!enrollments_student_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          courses (
            course_name
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'enrolled');

      if (!error && data) {
        setStudents(data);
      }
    }
  };

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('parent_meetings')
      .select(`
        *,
        user_profiles!parent_meetings_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('teacher_id', teacherData.user_id)
      .order('meeting_date', { ascending: false });

    if (!error && data) {
      setMeetings(data);
    }
  };

  const fetchProgressReports = async () => {
    const { data, error } = await supabase
      .from('student_progress_reports')
      .select(`
        *,
        user_profiles!student_progress_reports_student_id_fkey (
          first_name,
          last_name
        ),
        courses (
          course_name
        )
      `)
      .eq('teacher_id', teacherData.user_id)
      .order('generated_at', { ascending: false });

    if (!error && data) {
      setProgressReports(data);
    }
  };

  const scheduleMeeting = async () => {
    try {
      const { error } = await supabase
        .from('parent_meetings')
        .insert({
          ...newMeeting,
          teacher_id: teacherData.user_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Meeting scheduled successfully'
      });

      setNewMeeting({
        student_id: '',
        parent_id: '',
        meeting_date: '',
        meeting_type: 'in_person',
        agenda: ''
      });

      fetchMeetings();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        variant: 'destructive'
      });
    }
  };

  const createProgressReport = async () => {
    try {
      const { error } = await supabase
        .from('student_progress_reports')
        .insert({
          ...newReport,
          teacher_id: teacherData.user_id,
          course_id: students.find(s => s.student_id === newReport.student_id)?.course_id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Progress report created successfully'
      });

      setNewReport({
        student_id: '',
        report_period: '',
        attendance_percentage: 0,
        behavioral_notes: '',
        strengths: '',
        areas_for_improvement: '',
        shared_with_parents: false
      });

      fetchProgressReports();
    } catch (error) {
      console.error('Error creating progress report:', error);
      toast({
        title: 'Error',
        description: 'Failed to create progress report',
        variant: 'destructive'
      });
    }
  };

  const shareReportWithParents = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('student_progress_reports')
        .update({ shared_with_parents: true })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report shared with parents'
      });

      fetchProgressReports();
    } catch (error) {
      console.error('Error sharing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to share report',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="meetings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meetings">Parent Meetings</TabsTrigger>
          <TabsTrigger value="reports">Progress Reports</TabsTrigger>
        </TabsList>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Parent Meetings
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Parent Meeting</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={newMeeting.student_id}
                        onValueChange={(value) => setNewMeeting({...newMeeting, student_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.student_id} value={student.student_id}>
                              {student.user_profiles?.first_name} {student.user_profiles?.last_name} - {student.courses?.course_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="datetime-local"
                        value={newMeeting.meeting_date}
                        onChange={(e) => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
                      />

                      <Select
                        value={newMeeting.meeting_type}
                        onValueChange={(value) => setNewMeeting({...newMeeting, meeting_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Meeting type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="video_call">Video Call</SelectItem>
                          <SelectItem value="phone_call">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Meeting agenda"
                        value={newMeeting.agenda}
                        onChange={(e) => setNewMeeting({...newMeeting, agenda: e.target.value})}
                      />

                      <Button onClick={scheduleMeeting} className="w-full">
                        Schedule Meeting
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className=" text-center py-4">No meetings scheduled</p>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <Card key={meeting.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">
                                {meeting.user_profiles?.first_name} {meeting.user_profiles?.last_name}
                              </p>
                              <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}>
                                {meeting.status}
                              </Badge>
                              <Badge variant="outline">
                                {meeting.meeting_type === 'in_person' && <Users className="h-3 w-3 mr-1" />}
                                {meeting.meeting_type === 'video_call' && <Video className="h-3 w-3 mr-1" />}
                                {meeting.meeting_type === 'phone_call' && <Phone className="h-3 w-3 mr-1" />}
                                {meeting.meeting_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm ">{meeting.agenda}</p>
                            <p className="text-xs  mt-1">
                              {new Date(meeting.meeting_date).toLocaleDateString()} at {new Date(meeting.meeting_date).toLocaleTimeString()}
                            </p>
                            {meeting.notes && (
                              <p className="text-sm  mt-2 p-2 rounded">
                                Notes: {meeting.notes}
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
        </TabsContent>

        {/* Progress Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Progress Reports
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Progress Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <Select
                        value={newReport.student_id}
                        onValueChange={(value) => setNewReport({...newReport, student_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.student_id} value={student.student_id}>
                              {student.user_profiles?.first_name} {student.user_profiles?.last_name} - {student.courses?.course_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Report period (e.g., Q1 2024)"
                        value={newReport.report_period}
                        onChange={(e) => setNewReport({...newReport, report_period: e.target.value})}
                      />

                      <Input
                        type="number"
                        placeholder="Attendance percentage"
                        value={newReport.attendance_percentage}
                        onChange={(e) => setNewReport({...newReport, attendance_percentage: parseFloat(e.target.value) || 0})}
                      />

                      <Textarea
                        placeholder="Behavioral notes"
                        value={newReport.behavioral_notes}
                        onChange={(e) => setNewReport({...newReport, behavioral_notes: e.target.value})}
                      />

                      <Textarea
                        placeholder="Strengths"
                        value={newReport.strengths}
                        onChange={(e) => setNewReport({...newReport, strengths: e.target.value})}
                      />

                      <Textarea
                        placeholder="Areas for improvement"
                        value={newReport.areas_for_improvement}
                        onChange={(e) => setNewReport({...newReport, areas_for_improvement: e.target.value})}
                      />

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newReport.shared_with_parents}
                          onChange={(e) => setNewReport({...newReport, shared_with_parents: e.target.checked})}
                        />
                        Share with parents immediately
                      </label>

                      <Button onClick={createProgressReport} className="w-full">
                        Create Report
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressReports.length === 0 ? (
                <p className=" text-center py-4">No progress reports created</p>
              ) : (
                <div className="space-y-3">
                  {progressReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">
                                {report.user_profiles?.first_name} {report.user_profiles?.last_name}
                              </p>
                              <Badge variant="outline">{report.courses?.course_name}</Badge>
                              <Badge variant="secondary">{report.report_period}</Badge>
                              {report.shared_with_parents && (
                                <Badge variant="default">Shared</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="font-medium ">Attendance</p>
                                <p>{report.attendance_percentage}%</p>
                              </div>
                              <div>
                                <p className="font-medium ">Strengths</p>
                                <p>{report.strengths || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="font-medium ">Areas for Improvement</p>
                                <p>{report.areas_for_improvement || 'Not specified'}</p>
                              </div>
                            </div>

                            {report.behavioral_notes && (
                              <div className="mt-3 p-2 border rounded">
                                <p className="text-sm font-medium ">Behavioral Notes:</p>
                                <p className="text-sm">{report.behavioral_notes}</p>
                              </div>
                            )}

                            <p className="text-xs mt-2">
                              Generated: {new Date(report.generated_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {!report.shared_with_parents && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => shareReportWithParents(report.id)}
                            >
                              <Share className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherParentInteraction;
