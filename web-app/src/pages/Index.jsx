import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Copy, ExternalLink, FileText, Link2, Lightbulb, AlignLeft, Quote, ChevronDown, ChevronRight, Trash2, Edit, CheckSquare, Square, Plus } from "lucide-react";
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
import { topicsAPI, capturesAPI, resourcesAPI, bookmarksAPI } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Index() {
  const [activeItem, setActiveItem] = useState("All Items");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', color: '#8B5CF6' });

  // Capture modals
  const [showEditCapture, setShowEditCapture] = useState(false);
  const [showAddToTopic, setShowAddToTopic] = useState(false);
  const [showCaptureDetail, setShowCaptureDetail] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [editCapture, setEditCapture] = useState({ title: '', content: '', type: 'text' });
  const [selectedTopicForCapture, setSelectedTopicForCapture] = useState('');
  const [showFullCaptureInAddToTopic, setShowFullCaptureInAddToTopic] = useState(false);
  const [newTodoItemInModal, setNewTodoItemInModal] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch topics from API
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: topicsAPI.getAll,
  });

  // Fetch recent captures
  const { data: capturesData, isLoading: capturesLoading } = useQuery({
    queryKey: ['captures'],
    queryFn: () => capturesAPI.getAll({ limit: activeItem === 'Recent' ? 50 : 10 }),
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds to catch extension updates
  });

  // Fetch bookmarks
  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksAPI.getAll,
    enabled: activeItem === 'Bookmarks',
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

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: topicsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      queryClient.invalidateQueries(['bookmarks']);
      toast.success("Topic deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete topic");
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

  // Bookmark mutations
  const bookmarkTopicMutation = useMutation({
    mutationFn: bookmarksAPI.toggleTopic,
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      queryClient.invalidateQueries(['bookmarks']);
    },
  });

  const bookmarkCaptureMutation = useMutation({
    mutationFn: bookmarksAPI.toggleCapture,
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
      queryClient.invalidateQueries(['bookmarks']);
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
      // Prevent any modal from opening
      setShowCaptureDetail(false);
      setSelectedCapture(null);
      deleteCaptureMutation.mutate(captureId);
    }
  };

  const handleDeleteTopic = (topicId) => {
    if (confirm('Are you sure you want to delete this topic? All resources in this topic will also be deleted.')) {
      deleteTopicMutation.mutate(topicId);
    }
  };

  const handleOpenAddToTopic = (capture) => {
    setSelectedCapture(capture);
    setShowAddToTopic(true);
    setShowFullCaptureInAddToTopic(false);
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

  const handleOpenCaptureDetail = async (capture) => {
    setSelectedCapture(capture);
    setShowCaptureDetail(true);

    // Mark as read if unread
    if (capture.unread) {
      try {
        await capturesAPI.markAsRead(capture.id);
        queryClient.invalidateQueries(['captures']);
        queryClient.invalidateQueries(['bookmarks']);
      } catch (error) {
        console.error('Failed to mark capture as read:', error);
      }
    }
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const captureTodoToggleMutation = useMutation({
    mutationFn: async ({ captureId, itemIndex }) => {
      const capture = captures.find(c => c.id === captureId) ||
                      bookmarks.captures?.find(c => c.id === captureId);
      if (!capture || capture.type !== 'todo') throw new Error('Invalid capture');

      const todoItems = JSON.parse(capture.content);
      todoItems[itemIndex].completed = !todoItems[itemIndex].completed;

      return capturesAPI.update(captureId, {
        type: capture.type,
        title: capture.title,
        content: JSON.stringify(todoItems),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['captures']);
      queryClient.invalidateQueries(['bookmarks']);
    },
    onError: () => {
      toast.error("Failed to update todo item");
    }
  });

  const handleCaptureTodoToggle = (captureId, itemIndex) => {
    captureTodoToggleMutation.mutate({ captureId, itemIndex });
  };

  const handleAddCaptureTodoItemInModal = async (captureId) => {
    if (!newTodoItemInModal.trim()) return;

    const capture = captures.find(c => c.id === captureId) ||
                    bookmarks.captures?.find(c => c.id === captureId);
    if (!capture || capture.type !== 'todo') return;

    try {
      const todoItems = JSON.parse(capture.content || '[]');
      todoItems.push({ text: newTodoItemInModal.trim(), completed: false });

      await capturesAPI.update(captureId, {
        type: capture.type,
        title: capture.title,
        content: JSON.stringify(todoItems),
      });

      await queryClient.refetchQueries(['captures']);
      await queryClient.refetchQueries(['bookmarks']);
      setNewTodoItemInModal('');
      toast.success("Todo item added!");
    } catch (error) {
      toast.error("Failed to add todo item");
    }
  };

  const getCaptureIcon = (type) => {
    switch (type) {
      case "link": return Link2;
      case "note": return FileText;
      case "idea": return Lightbulb;
      case "text": return AlignLeft;
      case "quote": return Quote;
      case "todo": return CheckSquare;
      default: return FileText;
    }
  };

  const topics = topicsData?.data?.topics || [];
  const captures = capturesData?.data?.captures || [];
  const bookmarks = bookmarksData?.data || { topics: [], captures: [], resources: [], totalCount: 0 };
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
          title={`${getGreeting()}${firstName ? `, ${firstName}` : ''}!`}
          subtitle={`${totalResources} resources across ${topics.length} topics`}
          onCreateTopic={() => setShowCreateTopic(true)}
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
                <h2 className="text-[15px] font-medium text-muted-foreground uppercase tracking-wider">
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
                      bookmarked={topic.bookmarked}
                      onBookmarkToggle={(topicId) => bookmarkTopicMutation.mutate(topicId)}
                      onDelete={handleDeleteTopic}
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
              <h2 className="text-[15px] font-medium text-muted-foreground uppercase tracking-wider">
                {activeItem === 'Recent' ? 'Recent Captures' : activeItem === 'Bookmarks' ? 'Bookmarked Items' : 'Recent Captures'}
              </h2>
            </div>

            {activeItem === 'Bookmarks' ? (
              bookmarksLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading bookmarks...</p>
                </div>
              ) : bookmarks.totalCount === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">No bookmarks yet</p>
                  <p className="text-sm text-muted-foreground">Click the bookmark icon on any item to save it here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bookmarked Topics */}
                  {bookmarks.topics.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Topics</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {bookmarks.topics.map((topic) => (
                          <TopicCard
                            key={topic.id}
                            id={topic.id}
                            name={topic.title}
                            description={topic.description}
                            color={topic.color || 'bg-violet-500'}
                            itemCount={topic._count?.resources || 0}
                            lastUpdated={new Date(topic.updatedAt).toLocaleDateString()}
                            bookmarked={true}
                            onBookmarkToggle={(topicId) => bookmarkTopicMutation.mutate(topicId)}
                            onDelete={handleDeleteTopic}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookmarked Captures */}
                  {bookmarks.captures.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Captures</h3>
                      <div className="space-y-3">
                        {bookmarks.captures.map((capture) => (
                          <CaptureCard
                            key={capture.id}
                            id={capture.id}
                            type={capture.type}
                            title={capture.title || 'Untitled'}
                            content={capture.content}
                            source={capture.source}
                            timestamp={new Date(capture.createdAt).toLocaleDateString()}
                            bookmarked={true}
                            unread={capture.unread}
                            onBookmarkToggle={(captureId) => bookmarkCaptureMutation.mutate(captureId)}
                            onEdit={() => handleEditCapture(capture)}
                            onDelete={() => handleDeleteCapture(capture.id)}
                            onAddToTopic={() => handleOpenAddToTopic(capture)}
                            onClick={() => handleOpenCaptureDetail(capture)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookmarked Resources */}
                  {bookmarks.resources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Resources</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {bookmarks.resources.map((resource) => (
                          <div key={resource.id} className="glass-card p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{resource.title}</p>
                                {resource.topic && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Topic: {resource.topic.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
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
                    id={capture.id}
                    type={capture.type}
                    title={capture.title || 'Untitled'}
                    content={capture.content}
                    source={capture.source}
                    timestamp={new Date(capture.createdAt).toLocaleDateString()}
                    bookmarked={capture.bookmarked}
                    unread={capture.unread}
                    onBookmarkToggle={(captureId) => bookmarkCaptureMutation.mutate(captureId)}
                    className="opacity-0 animate-fade-up"
                    style={{ animationDelay: `${(activeItem === 'All Items' ? 0.6 : 0.3) + index * 0.05}s`, animationFillMode: 'forwards' }}
                    onEdit={() => handleEditCapture(capture)}
                    onDelete={() => handleDeleteCapture(capture.id)}
                    onAddToTopic={() => handleOpenAddToTopic(capture)}
                    onClick={() => handleOpenCaptureDetail(capture)}
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
                <div className="rounded-lg bg-muted/30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullCaptureInAddToTopic(!showFullCaptureInAddToTopic)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Capture Preview:</p>
                      <p className="text-sm font-medium truncate">{selectedCapture.title || 'Untitled'}</p>
                      {!showFullCaptureInAddToTopic && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{selectedCapture.content}</p>
                      )}
                    </div>
                    {showFullCaptureInAddToTopic ? (
                      <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-2 shrink-0" />
                    )}
                  </button>
                  {showFullCaptureInAddToTopic && (
                    <div className="p-3 pt-0 max-h-40 overflow-y-auto">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedCapture.content}</p>
                    </div>
                  )}
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

      {/* Capture Detail Modal */}
      <Dialog open={showCaptureDetail} onOpenChange={setShowCaptureDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" key={selectedCapture?.id}>
          {(() => {
            // Get fresh capture data from queries
            const currentCapture = selectedCapture && (
              captures.find(c => c.id === selectedCapture.id) ||
              bookmarks.captures?.find(c => c.id === selectedCapture.id) ||
              selectedCapture
            );

            if (!currentCapture) return null;

            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = getCaptureIcon(currentCapture.type);
                    return <Icon className="w-5 h-5" />;
                  })()}
                  <span>{currentCapture.title || 'Untitled Capture'}</span>
                  {currentCapture.type === 'todo' && (() => {
                    try {
                      const todoItems = JSON.parse(currentCapture.content || '[]');
                      const completed = todoItems.filter(item => item.completed).length;
                      return (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({completed}/{todoItems.length})
                        </span>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </DialogTitle>
                {currentCapture.type && (
                  <DialogDescription>
                    {currentCapture.type.charAt(0).toUpperCase() + currentCapture.type.slice(1)}
                    {currentCapture.createdAt && ` • ${new Date(currentCapture.createdAt).toLocaleString()}`}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="py-4">
                {currentCapture.type === 'todo' ? (
                  (() => {
                    let todoItems = [];
                    try {
                      todoItems = JSON.parse(currentCapture.content || '[]');
                    } catch {
                      todoItems = [];
                    }
                    return (
                      <div className="space-y-3" key={currentCapture.content}>
                        <div className="space-y-2">
                          {todoItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 py-1 group">
                              <button
                                onClick={() => handleCaptureTodoToggle(currentCapture.id, index)}
                                className="mt-0.5 shrink-0"
                              >
                                {item.completed ? (
                                  <CheckSquare className="w-5 h-5 text-primary" />
                                ) : (
                                  <Square className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                )}
                              </button>
                              <span className={cn(
                                "text-base flex-1",
                                item.completed ? "text-muted-foreground line-through" : "text-foreground"
                              )}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Input
                            placeholder="Add new item..."
                            value={newTodoItemInModal}
                            onChange={(e) => setNewTodoItemInModal(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCaptureTodoItemInModal(currentCapture.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddCaptureTodoItemInModal(currentCapture.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border max-h-[50vh] overflow-y-auto">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed flex-1">
                          {currentCapture.content || 'No content'}
                        </p>
                        {currentCapture.content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyContent(currentCapture.content)}
                            className="shrink-0"
                            title="Copy content"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentCapture.source && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <a
                        href={currentCapture.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {currentCapture.source}
                      </a>
                    </div>
                  </div>
                )}

                {currentCapture.summary && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">AI Summary</p>
                    <p className="text-sm text-foreground">{currentCapture.summary}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this capture?')) {
                      const captureId = currentCapture.id;
                      setShowCaptureDetail(false);
                      setSelectedCapture(null);
                      setTimeout(() => {
                        deleteCaptureMutation.mutate(captureId);
                      }, 100);
                    }
                  }}
                  className="text-destructive hover:text-destructive mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCaptureDetail(false);
                    handleEditCapture(currentCapture);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCaptureDetail(false);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
