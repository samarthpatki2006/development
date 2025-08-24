import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  IndianRupee,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HostelFacilityProps {
  studentData: any;
}

const HostelFacility: React.FC<HostelFacilityProps> = ({ studentData }) => {
  const [hostelRooms, setHostelRooms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityRequests, setFacilityRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hostels');

  // Format currency in INR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get badge color based on status
  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'allocated':
      case 'approved':
      case 'available':
      case 'resolved':
        return 'default';
      case 'submitted':
      case 'pending':
      case 'in_progress':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Check if student has already applied for a specific room
  const hasAppliedForRoom = (roomId: string) => {
    return applications.some(app => 
      app.room_id === roomId && 
      ['pending', 'approved'].includes(app.status)
    );
  };

  // Check if student has applied for any room in a specific block
  const hasAppliedForBlock = (blockName: string) => {
    return applications.some(app => 
      app.hostel_rooms?.block_name === blockName && 
      ['pending', 'approved'].includes(app.status)
    );
  };

  // Get count of active applications for a block
  const getActiveApplicationsForBlock = (blockName: string) => {
    return applications.filter(app => 
      app.hostel_rooms?.block_name === blockName && 
      ['pending', 'approved'].includes(app.status)
    ).length;
  };

  // Get available rooms for application (not already applied to)
  const getAvailableRoomsForApplication = (rooms: any[]) => {
    return rooms.filter(room => 
      room.current_occupancy < room.capacity && 
      !hasAppliedForRoom(room.id)
    );
  };

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch hostel rooms
    const { data: hostelRoomsData } = await supabase
      .from('hostel_rooms')
      .select('*')
      .eq('is_available', true)
      .order('block_name', { ascending: true });
    setHostelRooms(hostelRoomsData || []);

    // Fetch applications
    const { data: applicationsData } = await supabase
      .from('hostel_applications')
      .select(`
        *,
        hostel_rooms (room_number, block_name, room_type, monthly_fee)
      `)
      .eq('student_id', studentData.user_id)
      .order('application_date', { ascending: false });
    setApplications(applicationsData || []);

    // Fetch facilities
    const { data: facilitiesData } = await supabase
      .from('facilities')
      .select('*')
      .eq('is_available', true)
      .order('facility_name', { ascending: true });
    setFacilities(facilitiesData || []);

    // Fetch facility requests
    const { data: requestsData } = await supabase
      .from('facility_requests')
      .select(`
        *,
        facilities (facility_name, facility_type, location)
      `)
      .eq('student_id', studentData.user_id)
      .order('submitted_at', { ascending: false });
    setFacilityRequests(requestsData || []);

    setLoading(false);
  };

  const applyForHostel = async (roomId: string, preferredRoomType: string, comments: string) => {
    const { data: newApplication } = await supabase
      .from('hostel_applications')
      .insert({
        student_id: studentData.id,
        room_id: roomId === 'no-preference' ? null : roomId,
        preferred_room_type: preferredRoomType,
        comments: comments,
        status: 'pending'
      })
      .select(`
        *,
        hostel_rooms (room_number, block_name, room_type, monthly_fee)
      `)
      .single();

    if (newApplication) {
      setApplications([newApplication, ...applications]);
      setActiveTab('applications');
    }
  };

  const submitFacilityRequest = async (
    facilityId: string,
    requestType: string,
    title: string,
    description: string,
    priority: string
  ) => {
    const { data: newRequest } = await supabase
      .from('facility_requests')
      .insert({
        student_id: studentData.id,
        facility_id: facilityId === 'general' ? null : facilityId,
        request_type: requestType,
        title: title,
        description: description,
        priority: priority,
        status: 'submitted'
      })
      .select(`
        *,
        facilities (facility_name, facility_type, location)
      `)
      .single();

    if (newRequest) {
      setFacilityRequests([newRequest, ...facilityRequests]);
    }
  };

  // Group hostel rooms by block
  const hostelBlocks = hostelRooms.reduce((blocks, room) => {
    if (!blocks[room.block_name]) {
      blocks[room.block_name] = [];
    }
    blocks[room.block_name].push(room);
    return blocks;
  }, {} as Record<string, any[]>);

  const currentAllocation = applications.find(app => app.status === 'allocated');
  const activeApplications = applications.filter(app => ['pending', 'approved'].includes(app.status));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel & Facilities</h2>
        <div className="flex gap-2">
          {activeApplications.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {activeApplications.length} Active Application{activeApplications.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="px-3 py-1">
            {Object.keys(hostelBlocks).length} Hostel Blocks Available
          </Badge>
        </div>
      </div>

      {/* Show info about multiple applications */}
      {activeApplications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Multiple Applications Active</h4>
                <p className="text-sm text-blue-700 mt-1">
                  You have {activeApplications.length} active hostel application{activeApplications.length > 1 ? 's' : ''}. 
                  You can continue applying to different blocks, but cannot apply to the same room twice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hostels">
            <Building className="h-4 w-4 mr-2" />
            Hostels
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Bed className="h-4 w-4 mr-2" />
            My Applications
            {applications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {applications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="facilities">
            <Wrench className="h-4 w-4 mr-2" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hostels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(hostelBlocks).map(([blockName, rooms]) => {
              const availableRooms = getAvailableRoomsForApplication(rooms);
              const activeAppsForBlock = getActiveApplicationsForBlock(blockName);
              const canApplyToBlock = availableRooms.length > 0;
              
              return (
                <Card key={blockName} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{blockName}</CardTitle>
                      <Badge variant='default'>Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Hostel Block</p>
                    {activeAppsForBlock > 0 && (
                      <Badge variant="secondary" className="w-fit">
                        {activeAppsForBlock} Application{activeAppsForBlock > 1 ? 's' : ''} Pending
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        {rooms.length} Total Rooms
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Types: {[...new Set(rooms.map(r => r.room_type))].join(', ')}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Available for Application:</span>
                        <span className={availableRooms.length === 0 ? "text-red-600" : "text-green-600"}>
                          {availableRooms.length}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Physically Available:</span>
                        <span>
                          {rooms.filter(r => r.current_occupancy < r.capacity).length}
                        </span>
                      </div>

                      <HostelApplicationDialog 
                        onApply={applyForHostel} 
                        rooms={availableRooms}
                        blockName={blockName}
                        canApply={canApplyToBlock}
                        hasAllocation={!!currentAllocation}
                        activeAppsForBlock={activeAppsForBlock}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {currentAllocation && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Current Hostel Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-green-900">
                      {currentAllocation.hostel_rooms?.block_name} - Room {currentAllocation.hostel_rooms?.room_number}
                    </p>
                    <p className="text-sm text-green-700 capitalize">
                      {currentAllocation.hostel_rooms?.room_type} Room
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Allocated: {new Date(currentAllocation.allocated_at || currentAllocation.application_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>My Hostel Applications</CardTitle>
              <p className="text-sm text-gray-600">
                You can apply to multiple hostel blocks to increase your chances of getting accommodation.
              </p>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Bed className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-gray-600">No hostel applications submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application: any) => (
                    <Card key={application.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">Application #{application.id.slice(-8)}</p>
                            <p className="text-sm font-semibold text-blue-700">
                              {application.hostel_rooms ? 
                                `${application.hostel_rooms.block_name} - Room ${application.hostel_rooms.room_number}` :
                                'No specific room requested'
                              }
                            </p>
                            <p className="text-sm ">
                              Applied: {new Date(application.application_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm  capitalize">
                              Preferred Room: {application.preferred_room_type}
                            </p>
                            {application.comments && (
                              <p className="text-sm  italic mt-1">"{application.comments}"</p>
                            )}
                          </div>
                          <Badge variant={getStatusColor(application.status)} className="mb-2">
                            {application.status.toUpperCase()}
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

        <TabsContent value="facilities" className="space-y-6">
          <div className="flex justify-end">
            <FacilityRequestDialog onSubmit={submitFacilityRequest} facilities={facilities} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Facility Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {facilityRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12  mx-auto mb-4" />
                  <p className="text-gray-600">No facility requests submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {facilityRequests.map((request: any) => (
                    <Card key={request.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm  capitalize">
                              {request.request_type} Request
                            </p>
                            {request.facilities && (
                              <p className="text-sm ">
                                Facility: {request.facilities.facility_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <p className="text-xs  mt-1">
                              {new Date(request.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3">{request.description}</p>
                        
                        <Badge variant="outline" className="capitalize">
                          {request.priority} Priority
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campus Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilities.map((facility: any) => (
                  <Card key={facility.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{facility.facility_name}</h4>
                      <div className="space-y-1 text-sm ">
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
  blockName: string;
  canApply: boolean;
  hasAllocation: boolean;
  activeAppsForBlock: number;
}> = ({ onApply, rooms, blockName, canApply, hasAllocation, activeAppsForBlock }) => {
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

  const getButtonText = () => {
    if (hasAllocation) return 'Apply for Room Change';
    if (!canApply) return 'No Available Rooms';
    if (activeAppsForBlock > 0) return `Apply to ${blockName} (${activeAppsForBlock} pending)`;
    return `Apply to ${blockName}`;
  };

  const getButtonColor = () => {
    if (!canApply) return "secondary";
    if (activeAppsForBlock > 0) return "outline";
    return "default";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={!canApply} 
          variant={getButtonColor()}
          className="w-full mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {blockName} Block</DialogTitle>
          <DialogDescription>
            Submit your application for hostel accommodation in {blockName}.
            {activeAppsForBlock > 0 && (
              <span className=" block mt-2">
                Note: You already have {activeAppsForBlock} pending application{activeAppsForBlock > 1 ? 's' : ''} for this block.
              </span>
            )}
          </DialogDescription>
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
                    Room {room.room_number} ({room.room_type}) - {room.capacity - room.current_occupancy} spots available
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

          <Button onClick={handleSubmit} className="w-full">
            Submit Application to {blockName}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Facility Request Dialog Component (unchanged)
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
          <DialogDescription>
            Submit a request for facility maintenance, booking, or other issues.
          </DialogDescription>
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