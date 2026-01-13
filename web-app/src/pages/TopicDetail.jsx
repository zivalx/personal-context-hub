import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Link2, Lightbulb, StickyNote, ExternalLink, FileText, Edit, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { topicsAPI, resourcesAPI } from "@/api/client";
import { toast } from "sonner";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

function CaptureItem({ resource, onDelete, onEdit }) {
  const getIcon = () => {
    switch (resource.type) {
      case "external_link": return <Link2 className="w-4 h-4" />;
      case "note": return <StickyNote className="w-4 h-4" />;
      case "capture": return <FileText className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (resource.type) {
      case "external_link": return "text-purple-400 bg-purple-500/10";
      case "note": return "text-fuchsia-400 bg-fuchsia-500/10";
      case "capture": return "text-violet-400 bg-violet-500/10";
      default: return "text-indigo-400 bg-indigo-500/10";
    }
  };

  const displayContent = resource.description || resource.content || resource.url || '';
  const sourceUrl = resource.url || resource.capture?.source;
  const displaySource = sourceUrl ? (() => {
    try {
      return new URL(sourceUrl).hostname;
    } catch {
      return null;
    }
  })() : null;

  const handleClick = () => {
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn(
        "glass-card-hover p-4 group",
        sourceUrl && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn("p-2 rounded-lg", getTypeColor())}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
              {displaySource && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {displaySource}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{displayContent}</p>
            {resource.createdAt && (
              <span className="text-xs text-muted-foreground mt-2 block">
                {new Date(resource.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(resource); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function TopicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = useState("All Items");
  const [showAddResource, setShowAddResource] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [showEditResource, setShowEditResource] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'note',
    content: '',
    url: '',
  });
  const [editTopic, setEditTopic] = useState({
    title: '',
    description: '',
    color: '#8B5CF6',
  });
  const [editResource, setEditResource] = useState({
    id: '',
    title: '',
    description: '',
    type: 'note',
    content: '',
    url: '',
  });

  // Speech to text for Add Resource
  const addResourceSpeech = useSpeechToText();

  // Speech to text for Edit Resource
  const editResourceSpeech = useSpeechToText();

  // Update newResource content when speech is detected
  useEffect(() => {
    if (addResourceSpeech.transcript) {
      setNewResource((prev) => ({
        ...prev,
        content: addResourceSpeech.transcript + addResourceSpeech.interimTranscript,
      }));
    }
  }, [addResourceSpeech.transcript, addResourceSpeech.interimTranscript]);

  // Update editResource content when speech is detected
  useEffect(() => {
    if (editResourceSpeech.transcript) {
      setEditResource((prev) => ({
        ...prev,
        content: editResourceSpeech.transcript + editResourceSpeech.interimTranscript,
      }));
    }
  }, [editResourceSpeech.transcript, editResourceSpeech.interimTranscript]);

  // Fetch topic data
  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => topicsAPI.getById(id),
  });

  // Fetch all topics for sidebar
  const { data: topicsListData } = useQuery({
    queryKey: ['topics'],
    queryFn: topicsAPI.getAll,
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (resourceData) => resourcesAPI.create(id, resourceData),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      setShowAddResource(false);
      setNewResource({ title: '', description: '', type: 'note', content: '', url: '' });
      toast.success("Resource added successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add resource");
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ resourceId, resourceData }) => resourcesAPI.update(resourceId, resourceData),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      setShowEditResource(false);
      toast.success("Resource updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource");
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: resourcesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      toast.success("Resource deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete resource");
    },
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: (topicData) => topicsAPI.update(id, topicData),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      queryClient.invalidateQueries(['topics']);
      setShowEditTopic(false);
      toast.success("Topic updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update topic");
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: topicsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success("Topic deleted successfully!");
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete topic");
    },
  });

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!newResource.title.trim()) {
      toast.error("Please enter a resource title");
      return;
    }

    const resourceData = {
      title: newResource.title,
      description: newResource.description,
      type: newResource.type,
    };

    if (newResource.type === 'note') {
      resourceData.content = newResource.content;
    } else if (newResource.type === 'external_link') {
      resourceData.url = newResource.url;
    }

    createResourceMutation.mutate(resourceData);
  };

  const handleOpenEditResource = (resource) => {
    setEditResource({
      id: resource.id,
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      content: resource.content || '',
      url: resource.url || '',
    });
    setShowEditResource(true);
  };

  const handleEditResource = (e) => {
    e.preventDefault();
    if (!editResource.title.trim()) {
      toast.error("Please enter a resource title");
      return;
    }

    const resourceData = {
      title: editResource.title,
      description: editResource.description,
      type: editResource.type,
    };

    if (editResource.type === 'note') {
      resourceData.content = editResource.content;
    } else if (editResource.type === 'external_link') {
      resourceData.url = editResource.url;
    }

    updateResourceMutation.mutate({ resourceId: editResource.id, resourceData });
  };

  const handleDeleteResource = (resourceId) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      deleteResourceMutation.mutate(resourceId);
    }
  };

  const handleOpenEditTopic = () => {
    if (topic) {
      setEditTopic({
        title: topic.title,
        description: topic.description || '',
        color: topic.color || '#8B5CF6',
      });
      setShowEditTopic(true);
    }
  };

  const handleEditTopic = (e) => {
    e.preventDefault();
    if (!editTopic.title.trim()) {
      toast.error("Please enter a topic title");
      return;
    }
    updateTopicMutation.mutate(editTopic);
  };

  const handleDeleteTopic = () => {
    if (confirm('Are you sure you want to delete this topic? All resources will be deleted.')) {
      deleteTopicMutation.mutate(id);
    }
  };

  if (topicLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const topic = topicData?.data?.topic;
  const resources = topic?.resources || [];
  const topicsList = topicsListData?.data?.topics || [];

  if (!topic) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Topic not found</p>
          <Button onClick={() => navigate("/")}>Back to Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemSelect={setActiveItem} topics={topicsList} />

      <div className="flex-1 flex flex-col">
        {/* Topic Header */}
        <header className="border-b border-border">
          <div className="px-6 py-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Hub</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: topic.color || '#8B5CF6' }}
                />
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{topic.title}</h1>
                  {topic.description && (
                    <p className="text-muted-foreground mt-1 max-w-2xl">{topic.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowAddResource(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleOpenEditTopic}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Topic
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDeleteTopic}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Topic
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {resources.length} resources
              </span>
            </div>
          </div>
        </header>

        {/* Resources List */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <CaptureItem resource={resource} onDelete={handleDeleteResource} onEdit={handleOpenEditResource} />
              </div>
            ))}
          </div>

          {resources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No resources yet</p>
              <Button variant="outline" onClick={() => setShowAddResource(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Resource
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Add Resource Modal */}
      <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to this topic
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResource}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="resourceType">Type</Label>
                <Select
                  value={newResource.type}
                  onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="external_link">External Link</SelectItem>
                    <SelectItem value="capture">Capture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceTitle">Title</Label>
                <Input
                  id="resourceTitle"
                  placeholder="Resource title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceDescription">Description (optional)</Label>
                <Textarea
                  id="resourceDescription"
                  placeholder="Brief description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  rows={2}
                />
              </div>

              {newResource.type === 'note' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resourceContent">Content</Label>
                    {addResourceSpeech.isSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (addResourceSpeech.isListening) {
                            addResourceSpeech.stopListening();
                          } else {
                            addResourceSpeech.resetTranscript();
                            setNewResource({ ...newResource, content: '' });
                            addResourceSpeech.startListening();
                          }
                        }}
                        className={cn(
                          "gap-2",
                          addResourceSpeech.isListening && "bg-red-500/10 text-red-500 border-red-500/50"
                        )}
                      >
                        {addResourceSpeech.isListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Voice Input
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="resourceContent"
                    placeholder={addResourceSpeech.isListening ? "Listening... speak now" : "Note content"}
                    value={newResource.content}
                    onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                    rows={5}
                    className={cn(
                      addResourceSpeech.isListening && "border-red-500/50 focus-visible:ring-red-500/50"
                    )}
                  />
                  {addResourceSpeech.isListening && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      Recording...
                    </p>
                  )}
                </div>
              )}

              {newResource.type === 'external_link' && (
                <div className="space-y-2">
                  <Label htmlFor="resourceUrl">URL</Label>
                  <Input
                    id="resourceUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddResource(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createResourceMutation.isPending}
                className="ai-gradient-bg"
              >
                {createResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Modal */}
      <Dialog open={showEditTopic} onOpenChange={setShowEditTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update your topic information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditTopic}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  placeholder="Topic title"
                  value={editTopic.title}
                  onChange={(e) => setEditTopic({ ...editTopic, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description (optional)</Label>
                <Textarea
                  id="editDescription"
                  placeholder="Topic description"
                  value={editTopic.description}
                  onChange={(e) => setEditTopic({ ...editTopic, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editColor">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="editColor"
                    type="color"
                    value={editTopic.color}
                    onChange={(e) => setEditTopic({ ...editTopic, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{editTopic.color}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditTopic(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTopicMutation.isPending}
                className="ai-gradient-bg"
              >
                {updateTopicMutation.isPending ? 'Updating...' : 'Update Topic'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Modal */}
      <Dialog open={showEditResource} onOpenChange={setShowEditResource}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update your resource information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditResource}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editResourceType">Type</Label>
                <Select
                  value={editResource.type}
                  onValueChange={(value) => setEditResource({ ...editResource, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="external_link">External Link</SelectItem>
                    <SelectItem value="capture">Capture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editResourceTitle">Title</Label>
                <Input
                  id="editResourceTitle"
                  placeholder="Resource title"
                  value={editResource.title}
                  onChange={(e) => setEditResource({ ...editResource, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editResourceDescription">Description (optional)</Label>
                <Textarea
                  id="editResourceDescription"
                  placeholder="Brief description"
                  value={editResource.description}
                  onChange={(e) => setEditResource({ ...editResource, description: e.target.value })}
                  rows={2}
                />
              </div>

              {editResource.type === 'note' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="editResourceContent">Content</Label>
                    {editResourceSpeech.isSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editResourceSpeech.isListening) {
                            editResourceSpeech.stopListening();
                          } else {
                            editResourceSpeech.resetTranscript();
                            setEditResource({ ...editResource, content: '' });
                            editResourceSpeech.startListening();
                          }
                        }}
                        className={cn(
                          "gap-2",
                          editResourceSpeech.isListening && "bg-red-500/10 text-red-500 border-red-500/50"
                        )}
                      >
                        {editResourceSpeech.isListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Voice Input
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="editResourceContent"
                    placeholder={editResourceSpeech.isListening ? "Listening... speak now" : "Note content"}
                    value={editResource.content}
                    onChange={(e) => setEditResource({ ...editResource, content: e.target.value })}
                    rows={5}
                    className={cn(
                      editResourceSpeech.isListening && "border-red-500/50 focus-visible:ring-red-500/50"
                    )}
                  />
                  {editResourceSpeech.isListening && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      Recording...
                    </p>
                  )}
                </div>
              )}

              {editResource.type === 'external_link' && (
                <div className="space-y-2">
                  <Label htmlFor="editResourceUrl">URL</Label>
                  <Input
                    id="editResourceUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={editResource.url}
                    onChange={(e) => setEditResource({ ...editResource, url: e.target.value })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditResource(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateResourceMutation.isPending}
                className="ai-gradient-bg"
              >
                {updateResourceMutation.isPending ? 'Updating...' : 'Update Resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
