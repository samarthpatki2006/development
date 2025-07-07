
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Users, MessageSquare, Plus, Search, Send } from 'lucide-react';

interface AlumniNetworkingProps {
  user: any;
}

const AlumniNetworking = ({ user }: AlumniNetworkingProps) => {
  const [networks, setNetworks] = useState<any[]>([]);
  const [forums, setForums] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [selectedForum, setSelectedForum] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNetworks();
    fetchForums();
  }, [user]);

  useEffect(() => {
    if (selectedForum) {
      fetchForumPosts(selectedForum);
    }
  }, [selectedForum]);

  const fetchNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_networks')
        .select(`
          *,
          alumni_network_members(count)
        `)
        .eq('college_id', user.college_id)
        .eq('is_active', true);

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error fetching networks:', error);
    }
  };

  const fetchForums = async () => {
    try {
      const { data, error } = await supabase
        .from('alumni_forums')
        .select('*')
        .eq('college_id', user.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForums(data || []);
      if (data && data.length > 0 && !selectedForum) {
        setSelectedForum(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForumPosts = async (forumId: string) => {
    try {
      const { data, error } = await supabase
        .from('alumni_forum_posts')
        .select(`
          *,
          user_profiles:author_id(first_name, last_name)
        `)
        .eq('forum_id', forumId)
        .is('parent_post_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForumPosts(data || []);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
    }
  };

  const handleJoinNetwork = async (networkId: string) => {
    try {
      const { error } = await supabase
        .from('alumni_network_members')
        .insert({
          network_id: networkId,
          user_id: user.user_id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: 'Joined Network',
        description: 'You have successfully joined the network.',
      });

      fetchNetworks();
    } catch (error: any) {
      console.error('Error joining network:', error);
      toast({
        title: 'Join Failed',
        description: error.message || 'Failed to join network',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedForum) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('alumni_forum_posts')
        .insert({
          forum_id: selectedForum,
          author_id: user.user_id,
          title: newPostTitle,
          content: newPostContent
        });

      if (error) throw error;

      toast({
        title: 'Post Created',
        description: 'Your post has been published successfully.',
      });

      setNewPostTitle('');
      setNewPostContent('');
      fetchForumPosts(selectedForum);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Post Failed',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    }
  };

  const filteredNetworks = networks.filter(network =>
    network.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    network.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="networks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="networks">Alumni Networks</TabsTrigger>
          <TabsTrigger value="forums">Discussion Forums</TabsTrigger>
        </TabsList>

        <TabsContent value="networks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Alumni Networks</span>
              </CardTitle>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search networks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredNetworks.length > 0 ? (
                  filteredNetworks.map((network) => (
                    <Card key={network.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{network.name}</h3>
                              <Badge variant="outline">{network.category}</Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{network.description}</p>
                            <p className="text-sm text-gray-500">
                              {network.alumni_network_members?.[0]?.count || 0} members
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleJoinNetwork(network.id)}
                          >
                            Join Network
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No networks found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forums">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forum List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Forums</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forums.map((forum) => (
                    <div
                      key={forum.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedForum === forum.id
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedForum(forum.id)}
                    >
                      <h4 className="font-medium">{forum.title}</h4>
                      <p className="text-sm text-gray-600">{forum.description}</p>
                      <Badge variant="outline" className="mt-1">{forum.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Forum Posts */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Forum Posts</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          New Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Post title"
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                          />
                          <Textarea
                            placeholder="Write your post content..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            rows={6}
                          />
                          <Button onClick={handleCreatePost} className="w-full">
                            <Send className="h-4 w-4 mr-2" />
                            Publish Post
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forumPosts.length > 0 ? (
                      forumPosts.map((post) => (
                        <Card key={post.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{post.title}</h4>
                              {post.is_pinned && (
                                <Badge variant="default">Pinned</Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{post.content}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>
                                By {post.user_profiles?.first_name} {post.user_profiles?.last_name}
                              </span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-gray-500">Be the first to start a discussion!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniNetworking;
