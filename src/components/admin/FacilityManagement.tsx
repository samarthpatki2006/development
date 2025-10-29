import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building, 
  Plus, 
  Edit, 
  MapPin, 
  Users, 
  Search, 
  Wrench, 
  AlertCircle,
  Bed,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  college_id: string;
  user_type: string;
}

const FacilityManagement = ({ userProfile }: { userProfile: UserProfile }) => {
  const [activeTab, setActiveTab] = useState('hostels');
  
  // Hostel States
  const [hostelRooms, setHostelRooms] = useState<any[]>([]);
  const [hostelApplications, setHostelApplications] = useState<any[]>([]);
  const [isAddHostelOpen, setIsAddHostelOpen] = useState(false);
  
  // Facility States
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityRequests, setFacilityRequests] = useState<any[]>([]);
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  
  // Common States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hostel Form
  const [hostelForm, setHostelForm] = useState({
    room_number: '',
    block_name: '',
    room_type: 'shared',
    capacity: 2,
    monthly_fee: 0,
    amenities: {
      wifi: false,
      ac: false,
      attached_bathroom: false,
      study_table: false,
      wardrobe: false
    },
    is_available: true
  });

  // Facility Form
  const [facilityForm, setFacilityForm] = useState({
    facility_name: '',
    facility_type: '',
    capacity: 0,
    location: '',
    amenities: {
      wifi: false,
      ac: false,
      projector: false,
      whiteboard: false,
      sound_system: false
    },
    is_available: true
  });

  useEffect(() => {
    loadAllData();
  }, [userProfile]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadHostelRooms(),
      loadHostelApplications(),
      loadFacilities(),
      loadFacilityRequests()
    ]);
    setIsLoading(false);
  };

  const loadHostelRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('hostel_rooms')
        .select('*')
        .eq('college_id', userProfile.college_id)
        .order('block_name', { ascending: true });

      if (error) throw error;
      setHostelRooms(data || []);
    } catch (error) {
      console.error('Error loading hostel rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load hostel rooms.",
        variant: "destructive",
      });
    }
  };

  const loadHostelApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('hostel_applications')
        .select(`
          *,
          user_profiles!hostel_applications_student_id_fkey (
            first_name,
            last_name,
            email,
            user_code
          ),
          hostel_rooms (
            room_number,
            block_name,
            room_type,
            monthly_fee
          )
        `)
        .eq('user_profiles.college_id', userProfile.college_id)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setHostelApplications(data || []);
    } catch (error) {
      console.error('Error loading hostel applications:', error);
      toast({
        title: "Error",
        description: "Failed to load hostel applications.",
        variant: "destructive",
      });
    }
  };

  const loadFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast({
        title: "Error",
        description: "Failed to load facilities.",
        variant: "destructive",
      });
    }
  };

  const loadFacilityRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_requests')
        .select(`
          *,
          user_profiles!facility_requests_student_id_fkey (
            first_name,
            last_name,
            email,
            user_code
          ),
          facilities (
            facility_name,
            facility_type,
            location
          )
        `)
        .eq('user_profiles.college_id', userProfile.college_id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setFacilityRequests(data || []);
    } catch (error) {
      console.error('Error loading facility requests:', error);
      toast({
        title: "Error",
        description: "Failed to load facility requests.",
        variant: "destructive",
      });
    }
  };

  const handleAddHostelRoom = async () => {
    if (!hostelForm.room_number || !hostelForm.block_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in room number and block name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('hostel_rooms')
        .insert([{
          ...hostelForm,
          college_id: userProfile.college_id,
          current_occupancy: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setHostelRooms([data, ...hostelRooms]);
      setIsAddHostelOpen(false);
      resetHostelForm();

      toast({
        title: "Success",
        description: "Hostel room added successfully.",
      });
    } catch (error) {
      console.error('Error adding hostel room:', error);
      toast({
        title: "Error",
        description: "Failed to add hostel room.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFacility = async () => {
    if (!facilityForm.facility_name || !facilityForm.facility_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in facility name and type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('facilities')
        .insert([{
          ...facilityForm,
          college_id: userProfile.college_id
        }])
        .select()
        .single();

      if (error) throw error;

      setFacilities([data, ...facilities]);
      setIsAddFacilityOpen(false);
      resetFacilityForm();

      toast({
        title: "Success",
        description: "Facility added successfully.",
      });
    } catch (error) {
      console.error('Error adding facility:', error);
      toast({
        title: "Error",
        description: "Failed to add facility.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHostelApplicationAction = async (applicationId: string, action: 'approved' | 'rejected', roomId?: string) => {
    try {
      const updateData: any = {
        status: action,
        processed_by: userProfile.id
      };

      if (action === 'approved' && roomId) {
        updateData.room_id = roomId;
        updateData.status = 'allocated';
        updateData.allocated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('hostel_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Update room occupancy if allocated
      if (action === 'approved' && roomId) {
        const room = hostelRooms.find(r => r.id === roomId);
        if (room) {
          await supabase
            .from('hostel_rooms')
            .update({ current_occupancy: room.current_occupancy + 1 })
            .eq('id', roomId);
        }
      }

      await loadHostelApplications();
      await loadHostelRooms();

      toast({
        title: "Success",
        description: `Application ${action} successfully.`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    }
  };

  const handleFacilityRequestAction = async (requestId: string, action: 'resolved' | 'rejected' | 'in_progress', response?: string) => {
    try {
      const updateData: any = {
        status: action,
        assigned_to: userProfile.id
      };

      if (response) {
        updateData.response = response;
      }

      if (action === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('facility_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      await loadFacilityRequests();

      toast({
        title: "Success",
        description: `Request ${action} successfully.`,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request.",
        variant: "destructive",
      });
    }
  };

  const resetHostelForm = () => {
    setHostelForm({
      room_number: '',
      block_name: '',
      room_type: 'shared',
      capacity: 2,
      monthly_fee: 0,
      amenities: {
        wifi: false,
        ac: false,
        attached_bathroom: false,
        study_table: false,
        wardrobe: false
      },
      is_available: true
    });
  };

  const resetFacilityForm = () => {
    setFacilityForm({
      facility_name: '',
      facility_type: '',
      capacity: 0,
      location: '',
      amenities: {
        wifi: false,
        ac: false,
        projector: false,
        whiteboard: false,
        sound_system: false
      },
      is_available: true
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      allocated: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredApplications = hostelApplications.filter(app => {
    const matchesSearch = 
      app.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = facilityRequests.filter(req => {
    const matchesSearch = 
      req.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Hostel & Facility Management</span>
              </CardTitle>
              <CardDescription>
                Manage hostels, facilities, applications, and requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hostels">
                <Bed className="w-4 h-4 mr-2" />
                Hostels ({hostelRooms.length})
              </TabsTrigger>
              <TabsTrigger value="applications">
                <Clock className="w-4 h-4 mr-2" />
                Applications ({hostelApplications.length})
              </TabsTrigger>
              <TabsTrigger value="facilities">
                <Building className="w-4 h-4 mr-2" />
                Facilities ({facilities.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                <Wrench className="w-4 h-4 mr-2" />
                Requests ({facilityRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* Hostel Rooms Tab */}
            <TabsContent value="hostels" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Hostel Rooms</h3>
                <Dialog open={isAddHostelOpen} onOpenChange={setIsAddHostelOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Hostel Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Hostel Room</DialogTitle>
                      <DialogDescription>
                        Add a new room to the hostel system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="room_number">Room Number *</Label>
                        <Input
                          id="room_number"
                          value={hostelForm.room_number}
                          onChange={(e) => setHostelForm({...hostelForm, room_number: e.target.value})}
                          placeholder="e.g., 101"
                        />
                      </div>
                      <div>
                        <Label htmlFor="block_name">Block Name *</Label>
                        <Input
                          id="block_name"
                          value={hostelForm.block_name}
                          onChange={(e) => setHostelForm({...hostelForm, block_name: e.target.value})}
                          placeholder="e.g., A Block"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room_type">Room Type</Label>
                        <Select value={hostelForm.room_type} onValueChange={(value) => setHostelForm({...hostelForm, room_type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="shared">Shared</SelectItem>
                            <SelectItem value="suite">Suite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={hostelForm.capacity}
                          onChange={(e) => setHostelForm({...hostelForm, capacity: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="monthly_fee">Monthly Fee (₹)</Label>
                        <Input
                          id="monthly_fee"
                          type="number"
                          value={hostelForm.monthly_fee}
                          onChange={(e) => setHostelForm({...hostelForm, monthly_fee: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.keys(hostelForm.amenities).map((amenity) => (
                            <label key={amenity} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={hostelForm.amenities[amenity as keyof typeof hostelForm.amenities]}
                                onChange={(e) => setHostelForm({
                                  ...hostelForm,
                                  amenities: {
                                    ...hostelForm.amenities,
                                    [amenity]: e.target.checked
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddHostelOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddHostelRoom} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Room'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostelRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.block_name}</TableCell>
                        <TableCell>{room.room_number}</TableCell>
                        <TableCell className="capitalize">{room.room_type}</TableCell>
                        <TableCell>
                          {room.current_occupancy}/{room.capacity}
                        </TableCell>
                        <TableCell>₹{room.monthly_fee?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={room.is_available ? "default" : "secondary"}>
                            {room.is_available ? "Available" : "Full"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Hostel Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <HostelApplicationCard
                      key={app.id}
                      application={app}
                      hostelRooms={hostelRooms}
                      onAction={handleHostelApplicationAction}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No applications found</p>
                </div>
              )}
            </TabsContent>

            {/* Facilities Tab */}
            <TabsContent value="facilities" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Facilities</h3>
                <Dialog open={isAddFacilityOpen} onValueChange={setIsAddFacilityOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Facility
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Facility</DialogTitle>
                      <DialogDescription>
                        Register a new facility in the campus
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="col-span-2">
                        <Label htmlFor="facility_name">Facility Name *</Label>
                        <Input
                          id="facility_name"
                          value={facilityForm.facility_name}
                          onChange={(e) => setFacilityForm({...facilityForm, facility_name: e.target.value})}
                          placeholder="e.g., Main Auditorium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facility_type">Facility Type *</Label>
                        <Select value={facilityForm.facility_type} onValueChange={(value) => setFacilityForm({...facilityForm, facility_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classroom">Classroom</SelectItem>
                            <SelectItem value="lab">Laboratory</SelectItem>
                            <SelectItem value="auditorium">Auditorium</SelectItem>
                            <SelectItem value="library">Library</SelectItem>
                            <SelectItem value="sports">Sports Facility</SelectItem>
                            <SelectItem value="cafeteria">Cafeteria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={facilityForm.capacity}
                          onChange={(e) => setFacilityForm({...facilityForm, capacity: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={facilityForm.location}
                          onChange={(e) => setFacilityForm({...facilityForm, location: e.target.value})}
                          placeholder="Building, Floor, Room details"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.keys(facilityForm.amenities).map((amenity) => (
                            <label key={amenity} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={facilityForm.amenities[amenity as keyof typeof facilityForm.amenities]}
                                onChange={(e) => setFacilityForm({
                                  ...facilityForm,
                                  amenities: {
                                    ...facilityForm.amenities,
                                    [amenity]: e.target.checked
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm capitalize">{amenity.replace(/_/g, ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddFacilityOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFacility} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Facility'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facility</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell className="font-medium">{facility.facility_name}</TableCell>
                        <TableCell className="capitalize">{facility.facility_type}</TableCell>
                        <TableCell>{facility.location || 'N/A'}</TableCell>
                        <TableCell>{facility.capacity || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={facility.is_available ? "default" : "secondary"}>
                            {facility.is_available ? "Available" : "Maintenance"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Facility Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <FacilityRequestCard
                      key={request.id}
                      request={request}
                      onAction={handleFacilityRequestAction}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No requests found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Hostel Application Card Component
const HostelApplicationCard: React.FC<{
  application: any;
  hostelRooms: any[];
  onAction: (id: string, action: 'approved' | 'rejected', roomId?: string) => void;
  getStatusColor: (status: string) => string;
}> = ({ application, hostelRooms, onAction, getStatusColor }) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const availableRooms = hostelRooms.filter(room => 
    room.current_occupancy < room.capacity &&
    room.is_available &&
    (!application.room_id || room.id === application.room_id) &&
    (!application.hostel_rooms || room.block_name === application.hostel_rooms.block_name)
  );

  const handleAction = () => {
    if (actionType === 'approve') {
      if (!selectedRoom) {
        toast({
          title: "Error",
          description: "Please select a room to allocate.",
          variant: "destructive",
        });
        return;
      }
      onAction(application.id, 'approved', selectedRoom);
    } else {
      onAction(application.id, 'rejected');
    }
    setIsActionDialogOpen(false);
    setSelectedRoom('');
  };

  const isPending = application.status === 'pending';

  return (
    <Card className="border">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-lg">
                {application.user_profiles?.first_name} {application.user_profiles?.last_name}
              </h4>
              <Badge className={getStatusColor(application.status)}>
                {application.status.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Email: {application.user_profiles?.email}</p>
              <p>Student ID: {application.user_profiles?.user_code}</p>
              <p>Applied: {new Date(application.application_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs text-gray-500">Preferred Block/Room</Label>
            <p className="font-medium">
              {application.hostel_rooms ? 
                `${application.hostel_rooms.block_name} - Room ${application.hostel_rooms.room_number}` :
                'No specific preference'
              }
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Preferred Room Type</Label>
            <p className="font-medium capitalize">{application.preferred_room_type}</p>
          </div>
        </div>

        {application.comments && (
          <div className="mb-4">
            <Label className="text-xs text-gray-500">Comments</Label>
            <p className="text-sm italic bg-gray-50 p-3 rounded">"{application.comments}"</p>
          </div>
        )}

        {isPending && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1" 
                  onClick={() => setActionType('approve')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Allocate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
                  </DialogTitle>
                  <DialogDescription>
                    {actionType === 'approve' 
                      ? 'Select a room to allocate to the student' 
                      : 'Are you sure you want to reject this application?'}
                  </DialogDescription>
                </DialogHeader>
                {actionType === 'approve' && (
                  <div className="py-4">
                    <Label>Select Room</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.length > 0 ? (
                          availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.block_name} - Room {room.room_number} ({room.room_type}) - 
                              {room.capacity - room.current_occupancy} spots available
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No available rooms</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableRooms.length === 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        No available rooms in the requested block. Please add more rooms or consider other blocks.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAction}
                    variant={actionType === 'approve' ? 'default' : 'destructive'}
                    disabled={actionType === 'approve' && !selectedRoom}
                  >
                    {actionType === 'approve' ? 'Approve & Allocate' : 'Reject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => {
                setActionType('reject');
                setIsActionDialogOpen(true);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {application.status === 'allocated' && (
          <div className="bg-green-50 p-3 rounded mt-4">
            <p className="text-sm text-green-800">
              <strong>Allocated:</strong> {application.hostel_rooms?.block_name} - Room {application.hostel_rooms?.room_number}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Allocated on {new Date(application.allocated_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Facility Request Card Component
const FacilityRequestCard: React.FC<{
  request: any;
  onAction: (id: string, action: 'resolved' | 'rejected' | 'in_progress', response?: string) => void;
  getStatusColor: (status: string) => string;
}> = ({ request, onAction, getStatusColor }) => {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'resolve' | 'reject' | 'progress'>('progress');
  const [response, setResponse] = useState('');

  const handleAction = () => {
    const action = actionType === 'resolve' ? 'resolved' : actionType === 'reject' ? 'rejected' : 'in_progress';
    onAction(request.id, action, response);
    setIsActionDialogOpen(false);
    setResponse('');
  };

  const isSubmitted = request.status === 'submitted' || request.status === 'in_progress';

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="border">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-lg">{request.title}</h4>
              <Badge className={getStatusColor(request.status)}>
                {request.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={getPriorityColor(request.priority)}>
                {request.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Student: {request.user_profiles?.first_name} {request.user_profiles?.last_name}</p>
              <p>Email: {request.user_profiles?.email}</p>
              <p>Submitted: {new Date(request.submitted_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs text-gray-500">Request Type</Label>
            <p className="font-medium capitalize">{request.request_type.replace('_', ' ')}</p>
          </div>
          {request.facilities && (
            <div>
              <Label className="text-xs text-gray-500">Facility</Label>
              <p className="font-medium">{request.facilities.facility_name}</p>
              <p className="text-xs text-gray-500">{request.facilities.location}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label className="text-xs text-gray-500">Description</Label>
          <p className="text-sm bg-gray-50 p-3 rounded">{request.description}</p>
        </div>

        {request.response && (
          <div className="mb-4">
            <Label className="text-xs text-gray-500">Response</Label>
            <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-500">
              {request.response}
            </p>
          </div>
        )}

        {isSubmitted && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1" 
                  variant="default"
                  onClick={() => setActionType('progress')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark In Progress
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {actionType === 'resolve' && 'Resolve Request'}
                    {actionType === 'reject' && 'Reject Request'}
                    {actionType === 'progress' && 'Mark as In Progress'}
                  </DialogTitle>
                  <DialogDescription>
                    {actionType === 'resolve' && 'Mark this request as resolved and provide a response'}
                    {actionType === 'reject' && 'Reject this request and provide a reason'}
                    {actionType === 'progress' && 'Update the status to in progress and provide an update'}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Response/Update</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={`Provide ${actionType === 'progress' ? 'an update' : 'a response'}...`}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAction}>
                    {actionType === 'resolve' && 'Resolve'}
                    {actionType === 'reject' && 'Reject'}
                    {actionType === 'progress' && 'Update'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              className="flex-1" 
              variant="default"
              onClick={() => {
                setActionType('resolve');
                setIsActionDialogOpen(true);
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setActionType('reject');
                setIsActionDialogOpen(true);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {request.status === 'resolved' && (
          <div className="bg-green-50 p-3 rounded mt-4">
            <p className="text-sm text-green-800">
              <strong>✓ Resolved</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Resolved on {new Date(request.resolved_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacilityManagement;