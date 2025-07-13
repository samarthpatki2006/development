
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  Bed, 
  Wrench, 
  Plus,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HostelFacilityProps {
  studentData: any;
}

const HostelFacility: React.FC<HostelFacilityProps> = ({ studentData }) => {
  const [hostelRooms, setHostelRooms] = useState([]);
  const [hostelApplications, setHostelApplications] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilityRequests, setFacilityRequests] = useState([]);
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHostelFacilityData();
  }, [studentData]);

  const fetchHostelFacilityData = async () => {
    try {
      // Fetch hostel rooms
      const { data: roomsData } = await supabase
        .from('hostel_rooms')
        .select('*')
        .eq('college_id', studentData.college_id)
        .eq('is_available', true)
        .order('block_name');

      setHostelRooms(roomsData || []);

      // Fetch student's hostel applications
      const { data: applicationsData } = await supabase
        .from('hostel_applications')
        .select(`
          *,
          hostel_rooms(room_number, block_name, room_type, monthly_fee)
        `)
        .eq('student_id', studentData.user_id)
        .order('application_date', { ascending: false });

      setHostelApplications(applicationsData || []);

      // Get current active application
      const activeApp = applicationsData?.find(app => 
        ['pending', 'approved', 'allocated'].includes(app.status)
      );
      setCurrentApplication(activeApp);

      // Fetch facilities
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('*')
        .eq('college_id', studentData.college_id)
        .eq('is_available', true)
        .order('facility_name');

      setFacilities(facilitiesData || []);

      // Fetch student's facility requests
      const { data: requestsData } = await supabase
        .from('facility_requests')
        .select(`
          *,
          facilities(facility_name, facility_type)
        `)
        .eq('student_id', studentData.user_id)
        .order('submitted_at', { ascending: false });

      setFacilityRequests(requestsData || []);

    } catch (error) {
      console.error('Error fetching hostel/facility data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch hostel and facility information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyForHostel = async (roomId: string, preferredRoomType: string, comments: string) => {
    try {
      const { error } = await supabase
        .from('hostel_applications')
        .insert({
          student_id: studentData.user_id,
          room_id: roomId || null,
          preferred_room_type: preferredRoomType,
          comments: comments,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Application Submitted',
        description: 'Your hostel application has been submitted successfully',
      });

      fetchHostelFacilityData();
    } catch (error) {
      console.error('Error submitting hostel application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit hostel application',
        variant: 'destructive',
      });
    }
  };

  const submitFacilityRequest = async (facilityId: string, requestType: string, title: string, description: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('facility_requests')
        .insert({
          student_id: studentData.user_id,
          facility_id: facilityId || null,
          request_type: requestType,
          title: title,
          description: description,
          priority: priority,
          status: 'submitted'
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your facility request has been submitted successfully',
      });

      fetchHostelFacilityData();
    } catch (error) {
      console.error('Error submitting facility request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit facility request',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'allocated':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'submitted':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading hostel and facility information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel & Facility Management</h2>
        <div className="flex space-x-2">
          <Badge variant="outline">{hostelRooms.length} Rooms Available</Badge>
          <Badge variant="outline">{facilities.length} Facilities</Badge>
        </div>
      </div>

      <Tabs defaultValue="hostel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hostel" className="flex items-center space-x-2">
            <Bed className="h-4 w-4" />
            <span>Hostel Accommodation</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Facility Requests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hostel" className="space-y-6">
          {/* Current Application Status */}
          {currentApplication && (
            <Card className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bed className="h-5 w-5" />
                  <span>Current Application Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Application Date</p>
                    <p className="font-medium">{new Date(currentApplication.application_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={getStatusColor(currentApplication.status)}>
                      {currentApplication.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Preferred Room Type</p>
                    <p className="font-medium capitalize">{currentApplication.preferred_room_type}</p>
                  </div>
                </div>
                {currentApplication.hostel_rooms && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Allocated Room</h4>
                    <div className="text-sm text-green-700">
                      <p>Room: {currentApplication.hostel_rooms.room_number}</p>
                      <p>Block: {currentApplication.hostel_rooms.block_name}</p>
                      <p>Type: {currentApplication.hostel_rooms.room_type}</p>
                      <p>Monthly Fee: ${currentApplication.hostel_rooms.monthly_fee}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Rooms */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Available Hostel Rooms</CardTitle>
                {!currentApplication && (
                  <HostelApplicationDialog onApply={applyForHostel} rooms={hostelRooms} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hostelRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No rooms available at this time</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hostelRooms.map((room: any) => (
                    <Card key={room.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Room {room.room_number}</h4>
                            <p className="text-sm text-gray-600">{room.block_name} Block</p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {room.room_type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>Capacity: {room.capacity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>Occupied: {room.current_occupancy}/{room.capacity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>${room.monthly_fee}/month</span>
                          </div>
                        </div>

                        {room.amenities && Object.keys(room.amenities).length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-1">Amenities:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(room.amenities).map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600 font-medium">
                              {room.capacity - room.current_occupancy} spots available
                            </span>
                            {room.capacity > room.current_occupancy && (
                              <Badge variant="default">Available</Badge>
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

          {/* Application History */}
          <Card>
            <CardHeader>
              <CardTitle>Application History</CardTitle>
            </CardHeader>
            <CardContent>
              {hostelApplications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hostel applications found</p>
              ) : (
                <div className="space-y-4">
                  {hostelApplications.map((application: any) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Application #{application.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            Applied: {new Date(application.application_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Preferred: {application.preferred_room_type}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                      
                      {application.comments && (
                        <div className="bg-gray-50 p-3 rounded mt-3">
                          <p className="text-sm">{application.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          {/* New Request Button */}
          <div className="flex justify-end">
            <FacilityRequestDialog onSubmit={submitFacilityRequest} facilities={facilities} />
          </div>

          {/* My Requests */}
          <Card>
            <CardHeader>
              <CardTitle>My Facility Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {facilityRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No facility requests submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {facilityRequests.map((request: any) => (
                    <Card key={request.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {request.request_type} Request
                            </p>
                            {request.facilities && (
                              <p className="text-sm text-gray-600">
                                Facility: {request.facilities.facility_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(request.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                        
                        <div className="flex justify-between items-center text-sm">
                          <Badge variant="outline" className="capitalize">
                            {request.priority} Priority
                          </Badge>
                          {request.resolved_at && (
                            <span className="text-green-600">
                              Resolved: {new Date(request.resolved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {request.response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">Response:</p>
                            <p className="text-sm text-blue-700">{request.response}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Facilities */}
          <Card>
            <CardHeader>
              <CardTitle>Campus Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              {facilities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No facilities information available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilities.map((facility: any) => (
                    <Card key={facility.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{facility.facility_name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span className="capitalize">{facility.facility_type}</span>
                          </div>
                          {facility.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{facility.location}</span>
                            </div>
                          )}
                          {facility.capacity && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Capacity: {facility.capacity}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <Badge variant={facility.is_available ? 'default' : 'destructive'}>
                            {facility.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
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

// Hostel Application Dialog Component
const HostelApplicationDialog: React.FC<{
  onApply: (roomId: string, preferredRoomType: string, comments: string) => void;
  rooms: any[];
}> = ({ onApply, rooms }) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [preferredRoomType, setPreferredRoomType] = useState('shared');
  const [comments, setComments] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onApply(selectedRoom, preferredRoomType, comments);
    setSelectedRoom('');
    setPreferredRoomType('shared');
    setComments('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Hostel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hostel Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Preferred Room (Optional)</label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a specific room or leave blank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-preference">No preference</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.block_name} ({room.room_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Preferred Room Type</label>
            <Select value={preferredRoomType} onValueChange={setPreferredRoomType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Room</SelectItem>
                <SelectItem value="shared">Shared Room</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Additional Comments</label>
            <Textarea
              placeholder="Any special requirements or preferences..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your application will be reviewed by the hostel administration. 
              You will be notified of the status via email and on this portal.
            </p>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Submit Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Facility Request Dialog Component
const FacilityRequestDialog: React.FC<{
  onSubmit: (facilityId: string, requestType: string, title: string, description: string, priority: string) => void;
  facilities: any[];
}> = ({ onSubmit, facilities }) => {
  const [facilityId, setFacilityId] = useState('');
  const [requestType, setRequestType] = useState('maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    onSubmit(facilityId, requestType, title, description, priority);
    setFacilityId('');
    setRequestType('maintenance');
    setTitle('');
    setDescription('');
    setPriority('normal');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Facility Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Facility (Optional)</label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility or leave blank for general request" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Request</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.facility_name} ({facility.facility_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Request Type</label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="booking">Room/Facility Booking</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Brief title for your request..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Detailed description of your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!title.trim() || !description.trim()}
            className="w-full"
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostelFacility;
