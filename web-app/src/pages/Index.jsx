import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TopicCard } from "@/components/cards/TopicCard";
import { CaptureCard } from "@/components/cards/CaptureCard";
import { StatsBar } from "@/components/stats/StatsBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { topicsAPI, capturesAPI, resourcesAPI } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Index() {
  const [activeItem, setActiveItem] = useState("All Items");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', color: '#8B5CF6' });

  // Capture modals
  const [showEditCapture, setShowEditCapture] = useState(false);
  const [showAddToTopic, setShowAddToTopic] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [editCapture, setEditCapture] = useState({ title: '', content: '', type: 'text' });
  const [selectedTopicForCapture, setSelectedTopicForCapture] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch topics from API
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: topicsAPI.getAll,
  });

  // Fetch recent captures
  const { data: capturesData, isLoading: capturesLoading } = useQuery({
    queryKey: ['captures'],
    queryFn: () => capturesAPI.getAll({ limit: activeItem === 'Recent' ? 50 : 10 }),
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: topicsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      setShowCreateTopic(false);
      setNewTopic({ title: '', description: '', color: '#8B5CF6' });
      toast.success("Topic created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create topic");
    },
  });

  // Update capture mutation
  const updateCaptureMutation = useMutation({
    mutationFn: ({ id, data }) => capturesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
      setShowEditCapture(false);
      toast.success("Capture updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update capture");
    },
  });

  // Delete capture mutation
  const deleteCaptureMutation = useMutation({
    mutationFn: capturesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
      toast.success("Capture deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete capture");
    },
  });

  // Add capture to topic mutation (creates a resource)
  const addCaptureToTopicMutation = useMutation({
    mutationFn: ({ topicId, captureId, title, content }) =>
      resourcesAPI.create(topicId, {
        title,
        description: content.substring(0, 100),
        type: 'capture',
        captureId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      setShowAddToTopic(false);
      setSelectedTopicForCapture('');
      toast.success("Capture added to topic!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to topic");
    },
  });

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) {
      toast.error("Please enter a topic title");
      return;
    }
    createTopicMutation.mutate(newTopic);
  };

  const handleEditCapture = (capture) => {
    setSelectedCapture(capture);
    setEditCapture({
      title: capture.title || '',
      content: capture.content,
      type: capture.type,
    });
    setShowEditCapture(true);
  };

  const handleSaveEditCapture = (e) => {
    e.preventDefault();
    if (!editCapture.content.trim()) {
      toast.error("Please enter content");
      return;
    }
    updateCaptureMutation.mutate({
      id: selectedCapture.id,
      data: editCapture,
    });
  };

  const handleDeleteCapture = (captureId) => {
    if (confirm('Are you sure you want to delete this capture?')) {
      deleteCaptureMutation.mutate(captureId);
    }
  };

  const handleOpenAddToTopic = (capture) => {
    setSelectedCapture(capture);
    setShowAddToTopic(true);
  };

  const handleAddToTopic = (e) => {
    e.preventDefault();
    if (!selectedTopicForCapture) {
      toast.error("Please select a topic");
      return;
    }
    addCaptureToTopicMutation.mutate({
      topicId: selectedTopicForCapture,
      captureId: selectedCapture.id,
      title: selectedCapture.title || 'Untitled Capture',
      content: selectedCapture.content,
    });
  };

  const topics = topicsData?.data?.topics || [];
  const captures = capturesData?.data?.captures || [];
  const totalResources = topics.reduce((sum, topic) => sum + (topic._count?.resources || 0), 0);

  // Get first name only
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemSelect={setActiveItem}
        topics={topics}
        onCreateTopic={() => setShowCreateTopic(true)}
      />

      <div className="flex-1 flex flex-col">
        <Header
          title={`Welcome back${firstName ? `, ${firstName}` : ''}!`}
          subtitle={`${totalResources} resources across ${topics.length} topics`}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats - Only show on All Items view */}
          {activeItem === 'All Items' && (
            <div className="mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <StatsBar
                totalCaptures={captures.length}
                totalTopics={topics.length}
                totalResources={totalResources}
              />
            </div>
          )}

          {/* Topics Grid - Only show on All Items view */}
          {activeItem === 'All Items' && (
            <section className="mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Your Topics
                </h2>
              </div>

              {topicsLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading topics...</p>
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No topics yet</p>
                  <p className="text-sm text-muted-foreground">Create your first topic to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {topics.map((topic, index) => (
                    <TopicCard
                      key={topic.id}
                      id={topic.id}
                      name={topic.title}
                      description={topic.description}
                      color={topic.color || 'bg-violet-500'}
                      itemCount={topic._count?.resources || 0}
                      lastUpdated={new Date(topic.updatedAt).toLocaleDateString()}
                      className="opacity-0 animate-fade-up"
                      style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'forwards' }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Recent Captures / Bookmarks */}
          <section className="opacity-0 animate-fade-up" style={{ animationDelay: activeItem === 'All Items' ? '0.5s' : '0.2s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {activeItem === 'Recent' ? 'Recent Captures' : activeItem === 'Bookmarks' ? 'Bookmarked Items' : 'Recent Captures'}
              </h2>
            </div>

            {activeItem === 'Bookmarks' ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">Bookmarks feature coming soon!</p>
                <p className="text-sm text-muted-foreground">Mark your favorite items to access them quickly</p>
              </div>
            ) : capturesLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading captures...</p>
              </div>
            ) : captures.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No captures yet</p>
                <p className="text-sm text-muted-foreground">Start capturing content from the Chrome extension or web app!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {captures.map((capture, index) => (
                  <CaptureCard
                    key={capture.id}
                    type={capture.type}
                    title={capture.title || 'Untitled'}
                    content={capture.content}
                    source={capture.source}
                    timestamp={new Date(capture.createdAt).toLocaleDateString()}
                    className="opacity-0 animate-fade-up"
                    style={{ animationDelay: `${(activeItem === 'All Items' ? 0.6 : 0.3) + index * 0.05}s`, animationFillMode: 'forwards' }}
                    onEdit={() => handleEditCapture(capture)}
                    onDelete={() => handleDeleteCapture(capture.id)}
                    onAddToTopic={() => handleOpenAddToTopic(capture)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Create Topic Modal */}
      <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>
              Organize your captures into topics for better organization
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTopic}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. AI Research, Web Development"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What will you store in this topic?"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newTopic.color}
                    onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{newTopic.color}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateTopic(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTopicMutation.isPending}
                className="ai-gradient-bg"
              >
                {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Capture Modal */}
      <Dialog open={showEditCapture} onOpenChange={setShowEditCapture}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Capture</DialogTitle>
            <DialogDescription>
              Update your capture information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditCapture}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCaptureType">Type</Label>
                <Select
                  value={editCapture.type}
                  onValueChange={(value) => setEditCapture({ ...editCapture, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCaptureTitle">Title (optional)</Label>
                <Input
                  id="editCaptureTitle"
                  placeholder="Capture title"
                  value={editCapture.title}
                  onChange={(e) => setEditCapture({ ...editCapture, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCaptureContent">Content</Label>
                <Textarea
                  id="editCaptureContent"
                  placeholder="Capture content"
                  value={editCapture.content}
                  onChange={(e) => setEditCapture({ ...editCapture, content: e.target.value })}
                  rows={5}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditCapture(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCaptureMutation.isPending}
                className="ai-gradient-bg"
              >
                {updateCaptureMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add to Topic Modal */}
      <Dialog open={showAddToTopic} onOpenChange={setShowAddToTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Topic</DialogTitle>
            <DialogDescription>
              Choose a topic to add this capture to
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddToTopic}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="selectTopic">Topic</Label>
                <Select
                  value={selectedTopicForCapture}
                  onValueChange={setSelectedTopicForCapture}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCapture && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Capture:</p>
                  <p className="text-sm font-medium truncate">{selectedCapture.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{selectedCapture.content}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddToTopic(false);
                  setSelectedTopicForCapture('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addCaptureToTopicMutation.isPending}
                className="ai-gradient-bg"
              >
                {addCaptureToTopicMutation.isPending ? 'Adding...' : 'Add to Topic'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
