import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Plus, Trash2, Users, Award, Tag, Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TagAssignment {
  id: string;
  user_id: string;
  tag_id: string;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  user_profiles: {
    first_name: string;
    last_name: string;
    email: string;
    user_code: string;
  };
  user_tags: {
    tag_name: string;
    display_name: string;
    description: string;
    tag_category: string;
    color: string;
    icon: string;
  };
}

interface UserTag {
  id: string;
  tag_name: string;
  display_name: string;
  description: string;
  tag_category: string;
  color: string;
  icon: string;
  is_active: boolean;
  base_user_type: string | null;
}

interface RoleManagementProps {
  userProfile: any;
  adminRoles: any[];
}

const RoleManagement = ({ userProfile, adminRoles }: RoleManagementProps) => {
  const [tagAssignments, setTagAssignments] = useState<TagAssignment[]>([]);
  const [availableTags, setAvailableTags] = useState<UserTag[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Check if user has super_admin tag
  const isSuperAdmin = adminRoles.some(role => 
    role.role_type === 'super_admin' || role.tag_name === 'super_admin'
  );

  useEffect(() => {
    loadTagAssignments();
    loadAvailableTags();
    loadAvailableUsers();
  }, []);

  const loadTagAssignments = async () => {
    try {
      setIsLoading(true);
      
      // First get all tag assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_tag_assignments')
        .select(`
          id,
          user_id,
          tag_id,
          assigned_at,
          expires_at,
          is_active
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        setTagAssignments([]);
        setIsLoading(false);
        return;
      }

      // Get user IDs
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      
      // Get user profiles
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, user_code, college_id')
        .in('id', userIds)
        .eq('college_id', userProfile.college_id);

      if (usersError) {
        throw usersError;
      }

      // Get tag IDs
      const tagIds = [...new Set(assignments.map(a => a.tag_id))];
      
      // Get tags
      const { data: tags, error: tagsError } = await supabase
        .from('user_tags')
        .select('id, tag_name, display_name, description, tag_category, color, icon')
        .in('id', tagIds);

      if (tagsError) {
        throw tagsError;
      }

      // Combine the data
      const combinedData = assignments
        .map(assignment => {
          const user = users?.find(u => u.id === assignment.user_id);
          const tag = tags?.find(t => t.id === assignment.tag_id);
          
          if (!user) return null; // Skip if user not in same college
          
          return {
            ...assignment,
            user_profiles: user,
            user_tags: tag
          };
        })
        .filter(item => item !== null) as TagAssignment[];

      setTagAssignments(combinedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('is_active', true)
        .order('tag_category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error loading tags:', error);
      } else {
        setAvailableTags(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', userProfile.college_id)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
      } else {
        setAvailableUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const assignTag = async () => {
    if (!selectedUser || !selectedTag) {
      toast({
        title: "Missing Information",
        description: "Please select both a user and a tag.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected user's details
      const selectedUserData = availableUsers.find(u => u.id === selectedUser);
      const selectedTagData = availableTags.find(t => t.id === selectedTag);

      if (!selectedUserData || !selectedTagData) {
        toast({
          title: "Error",
          description: "Selected user or tag not found.",
          variant: "destructive",
        });
        return;
      }

      // Validate that the tag's base_user_type matches the user's user_type
      if (selectedTagData.base_user_type) {
        const userType = selectedUserData.user_type.toLowerCase();
        const tagBaseType = selectedTagData.base_user_type.toLowerCase();
        
        if (userType !== tagBaseType) {
          toast({
            title: "Invalid Assignment",
            description: `Cannot assign a ${tagBaseType} role to a ${userType}. Please select a tag that matches the user's type.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Check if user already has this tag
      const { data: existing, error: checkError } = await supabase
        .from('user_tag_assignments')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('tag_id', selectedTag)
        .eq('is_active', true)
        .single();

      if (existing) {
        toast({
          title: "Tag Already Assigned",
          description: "This user already has this tag assigned.",
          variant: "destructive",
        });
        return;
      }

      const assignmentData: any = {
        user_id: selectedUser,
        tag_id: selectedTag,
        assigned_by: userProfile.id,
        is_active: true
      };

      if (expiryDate) {
        assignmentData.expires_at = new Date(expiryDate).toISOString();
      }

      const { error } = await supabase
        .from('user_tag_assignments')
        .insert([assignmentData]);

      if (error) {
        console.error('Error assigning tag:', error);
        toast({
          title: "Error",
          description: "Failed to assign tag. " + error.message,
          variant: "destructive",
        });
      } else {
        // Log the assignment in audit
        await supabase.from('tag_assignment_audit').insert([{
          user_id: selectedUser,
          tag_id: selectedTag,
          action: 'assigned',
          performed_by: userProfile.id,
          new_values: {
            tag_name: selectedTagData?.tag_name,
            expires_at: expiryDate || null
          },
          reason: 'Manual assignment by admin'
        }]);

        toast({
          title: "Success",
          description: `Tag assigned to ${selectedUserData?.first_name} ${selectedUserData?.last_name} successfully.`,
        });

        setIsAssignDialogOpen(false);
        setSelectedUser('');
        setSelectedTag('');
        setExpiryDate('');
        loadTagAssignments();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to assign tag.",
        variant: "destructive",
      });
    }
  };

  const revokeTag = async (assignmentId: string, userId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('user_tag_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error revoking tag:', error);
        toast({
          title: "Error",
          description: "Failed to revoke tag.",
          variant: "destructive",
        });
      } else {
        // Log the revocation in audit
        await supabase.from('tag_assignment_audit').insert([{
          user_id: userId,
          tag_id: tagId,
          action: 'revoked',
          performed_by: userProfile.id,
          reason: 'Manual revocation by admin'
        }]);

        toast({
          title: "Success",
          description: "Tag revoked successfully.",
        });

        loadTagAssignments();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to revoke tag.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'admin_role': 'bg-red-100 text-red-800 border-red-300',
      'faculty_role': 'bg-blue-100 text-blue-800 border-blue-300',
      'student_role': 'bg-green-100 text-green-800 border-green-300',
      'club': 'bg-purple-100 text-purple-800 border-purple-300',
      'committee': 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'admin_role':
        return <Shield className="w-4 h-4" />;
      case 'faculty_role':
        return <Users className="w-4 h-4" />;
      case 'student_role':
        return <Award className="w-4 h-4" />;
      case 'club':
      case 'committee':
        return <Tag className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const filteredAssignments = filterCategory === 'all' 
    ? tagAssignments 
    : tagAssignments.filter(a => a.user_tags.tag_category === filterCategory);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'admin_role', label: 'Admin Roles' },
    { value: 'faculty_role', label: 'Faculty Roles' },
    { value: 'student_role', label: 'Student Roles' },
    { value: 'club', label: 'Clubs' },
    { value: 'committee', label: 'Committees' }
  ];

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only Super Admins can manage role and tag assignments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading role assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Role Management</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-2">
                Assign and manage admin roles for your college. Only Super Admins can manage roles.
              </CardDescription>
            </div>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-60">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Tag
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Assign Tag to User</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Select a user and tag to grant specific roles or permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Select User</Label>
                    <Select 
                      value={selectedUser} 
                      onValueChange={(value) => {
                        setSelectedUser(value);
                        setSelectedTag(''); // Reset tag when user changes
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{user.first_name} {user.last_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({user.user_code}) - {user.user_type}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Tag</Label>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTags
                          .filter(tag => {
                            // If a user is selected, only show tags matching their user_type
                            if (selectedUser) {
                              const user = availableUsers.find(u => u.id === selectedUser);
                              if (user && tag.base_user_type) {
                                return user.user_type.toLowerCase() === tag.base_user_type.toLowerCase();
                              }
                            }
                            return true;
                          })
                          .map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center space-x-2">
                              <Badge className={getCategoryColor(tag.tag_category)}>
                                {tag.tag_category.replace('_', ' ')}
                              </Badge>
                              <div>
                                <div className="font-medium">{tag.display_name}</div>
                                <div className="text-sm text-gray-500">{tag.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedUser && availableTags.filter(tag => {
                      const user = availableUsers.find(u => u.id === selectedUser);
                      if (user && tag.base_user_type) {
                        return user.user_type.toLowerCase() === tag.base_user_type.toLowerCase();
                      }
                      return true;
                    }).length === 0 && (
                      <p className="text-xs text-yellow-600">
                        No tags available for the selected user's type.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date (Optional)</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for permanent assignment
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button onClick={assignTag} className="flex-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Assign Tag
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAssignDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 sm:pt-0">
          {/* Filter */}
          <div className="mb-4 flex items-center space-x-2">
            <Label>Filter by Category:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tag assignments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const isExpired = assignment.expires_at && new Date(assignment.expires_at) < new Date();
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {assignment.user_profiles.first_name} {assignment.user_profiles.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.user_profiles.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {assignment.user_profiles.user_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: assignment.user_tags.color }}
                            />
                            <span className="font-medium">{assignment.user_tags.display_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {assignment.user_tags.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(assignment.user_tags.tag_category)}>
                            <span className="flex items-center space-x-1">
                              {getCategoryIcon(assignment.user_tags.tag_category)}
                              <span>{assignment.user_tags.tag_category.replace('_', ' ')}</span>
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.expires_at ? (
                            <div className={`flex items-center space-x-1 ${isExpired ? 'text-red-600' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(assignment.expires_at).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isExpired ? "destructive" : "default"}>
                            {isExpired ? "Expired" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!isExpired && assignment.user_tags.tag_name !== 'super_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => revokeTag(assignment.id, assignment.user_id, assignment.tag_id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                          {assignment.user_tags.tag_name === 'super_admin' && (
                            <span className="text-xs text-muted-foreground">Protected</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Available Tags Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Available Tags</span>
          </CardTitle>
          <CardDescription>
            Overview of all available tags and their purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 sm:pt-0">
          <Tabs defaultValue="admin_role">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="admin_role">Admin</TabsTrigger>
              <TabsTrigger value="faculty_role">Faculty</TabsTrigger>
              <TabsTrigger value="student_role">Student</TabsTrigger>
            </TabsList>
            
            {['admin_role', 'faculty_role', 'student_role', 'club', 'committee'].map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableTags
                    .filter(tag => tag.tag_category === category)
                    .map((tag) => (
                      <div key={tag.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <h4 className="font-semibold">{tag.display_name}</h4>
                          </div>
                          <Badge className={getCategoryColor(tag.tag_category)}>
                            {getCategoryIcon(tag.tag_category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{tag.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Tag: {tag.tag_name}</span>
                          <Badge variant={tag.is_active ? "default" : "secondary"} className="text-xs">
                            {tag.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {tag.base_user_type && (
                          <div className="mt-2 text-xs text-blue-600">
                            For: {tag.base_user_type}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {availableTags.filter(tag => tag.tag_category === category).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tags available in this category.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;