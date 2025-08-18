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
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle,
  AirVent,
  Bath,
  Tv,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  BookOpen,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HostelFacilityProps {
  studentData: any;
}

const HostelFacility: React.FC<HostelFacilityProps> = ({ studentData }) => {
  const [hostels, setHostels] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [hostelRooms, setHostelRooms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityRequests, setFacilityRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      case 'approved':
      case 'allocated':
      case 'available':
        return 'default';
      case 'pending':
      case 'under_review':
        return 'secondary';
      case 'rejected':
      case 'unavailable':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Fetch all hostel data
  useEffect(() => {
    fetchHostelData();
  }, []);

  const fetchHostelData = async () => {
    try {
      setLoading(true);

      // Fetch hostels - using existing facilities table for now as a workaround
      const { data: hostelsData } = await supabase
        .from('facilities')
        .select('*')
        .eq('facility_type', 'hostel');

      // Simulate hostel data structure
      const hostelData = hostelsData?.map((facility: any) => ({
        id: facility.id,
        hostel_name: facility.facility_name,
        hostel_type: 'Student Hostel',
        location: facility.location || 'Campus',
        total_rooms: facility.capacity || 50,
        occupied_rooms: Math.floor((facility.capacity || 50) * 0.7),
        amenities: ['WiFi', 'Laundry', 'Common Room', 'Security'],
        description: 'Modern hostel facility with all basic amenities',
        is_active: facility.is_available
      })) || [];

      setHostels(hostelData);

      // Fetch applications
      if (studentData?.id) {
        const { data: applicationsData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', studentData.id)
          .limit(1);

        // Simulate application data
        setApplications([]);
      }

      // Fetch facility requests - using existing data structure
      if (studentData?.id) {
        const { data: requestsData } = await supabase
          .from('facilities')
          .select('*')
          .limit(10);

        // Simulate facility requests
        const mockRequests = requestsData?.slice(0, 3).map((facility: any, index: number) => ({
          id: `req_${index + 1}`,
          student_id: studentData.id,
          facility_id: facility.id,
          request_type: ['maintenance', 'booking', 'complaint'][index % 3],
          title: `Request for ${facility.facility_name}`,
          description: `Request related to ${facility.facility_name} facility`,
          priority: ['normal', 'high', 'low'][index % 3],
          status: ['submitted', 'in_progress', 'resolved'][index % 3],
          submitted_at: new Date().toISOString(),
          facilities: facility
        })) || [];

        setFacilityRequests(mockRequests);
      }

      // Fetch facilities
      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('*')
        .eq('is_available', true);

      setFacilities(facilitiesData || []);

    } catch (error) {
      console.error('Error fetching hostel data:', error);
      toast({
        title: "Error",
        description: "Failed to load hostel information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectHostel = async (hostel: any) => {
    setSelectedHostel(hostel);
    
    // Simulate room data for the selected hostel
    const mockRooms = Array.from({ length: 12 }, (_, i) => ({
      id: `room_${i + 1}`,
      room_number: `${Math.floor(i / 4) + 1}${String.fromCharCode(65 + (i % 4))}`,
      hostel_id: hostel.id,
      room_type: ['single', 'shared', 'suite'][i % 3],
      floor_number: Math.floor(i / 4) + 1,
      current_occupancy: Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 1 : 0,
      capacity: ['single', 'shared', 'suite'][i % 3] === 'single' ? 1 : ['shared', 'suite'][i % 2] === 'shared' ? 2 : 4,
      monthly_fee: [8000, 6000, 12000][i % 3],
      is_available: Math.random() > 0.2,
      amenities: {
        'AC': i % 2 === 0,
        'WiFi': true,
        'Study Table': true,
        'Wardrobe': true
      }
    }));

    setHostelRooms(mockRooms);
  };

  const applyForHostel = async (roomId: string, preferredRoomType: string, comments: string) => {
    try {
      // In a real app, this would create an application in the database
      toast({
        title: "Application Submitted",
        description: "Your hostel application has been submitted successfully.",
      });

      // Refresh applications
      fetchHostelData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  const submitFacilityRequest = async (
    facilityId: string,
    requestType: string,
    title: string,
    description: string,
    priority: string
  ) => {
    try {
      // In a real app, this would create a facility request
      toast({
        title: "Request Submitted",
        description: "Your facility request has been submitted.",
      });

      // Refresh requests
      fetchHostelData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Hostel & Facilities</h2>
        <Badge variant="outline" className="px-3 py-1">
          {hostels.length} Hostels Available
        </Badge>
      </div>

      <Tabs defaultValue="hostels" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hostels">
            <Building className="h-4 w-4 mr-2" />
            Hostels
          </TabsTrigger>
          <TabsTrigger value="applications">
            <Bed className="h-4 w-4 mr-2" />
            My Applications
          </TabsTrigger>
          <TabsTrigger value="facilities">
            <Wrench className="h-4 w-4 mr-2" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hostels" className="space-y-6">
          {!selectedHostel ? (
            // Hostel List View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostels.map((hostel) => (
                <Card key={hostel.id} className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{hostel.hostel_name}</CardTitle>
                      <Badge variant={hostel.is_active ? 'default' : 'destructive'}>
                        {hostel.is_active ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{hostel.hostel_type}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {hostel.location}
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {hostel.total_rooms} Rooms
                        </span>
                        <span className="text-green-600">
                          {hostel.total_rooms - hostel.occupied_rooms} Available
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {hostel.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {hostel.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{hostel.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <Button 
                        onClick={() => selectHostel(hostel)}
                        className="w-full mt-4"
                        disabled={!hostel.is_active}
                      >
                        View Rooms & Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Selected Hostel Detail View
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedHostel.hostel_name}</h3>
                  <p className="text-gray-600">{selectedHostel.location}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedHostel(null)}>
                  Back to Hostels
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hostel Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHostel.amenities.map((amenity: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Occupancy</h4>
                      <p className="text-sm text-gray-600">
                        {selectedHostel.occupied_rooms} of {selectedHostel.total_rooms} rooms occupied
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(selectedHostel.occupied_rooms / selectedHostel.total_rooms) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Rooms */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Available Rooms</CardTitle>
                    <HostelApplicationDialog onApply={applyForHostel} rooms={hostelRooms} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hostelRooms.filter((room: any) => room.is_available).map((room: any) => (
                      <Card key={room.id} className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">Room {room.room_number}</h4>
                              <p className="text-sm text-gray-600">Floor {room.floor_number}</p>
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
                              <IndianRupee className="h-4 w-4 text-gray-400" />
                              <span>{formatCurrency(room.monthly_fee)}/month</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-1">Amenities:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(room.amenities).map(([amenity, hasIt]) => 
                                hasIt ? (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ) : null
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600 font-medium">
                                {room.capacity - room.current_occupancy} spots available
                              </span>
                              <Badge variant="default">Available</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Hostel Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hostel applications submitted yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Browse hostels and submit an application to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application: any) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Application #{application.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            Applied: {new Date(application.application_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    </div>
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
                        </div>
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
                    Room {room.room_number} ({room.room_type})
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
