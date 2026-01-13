import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Link2, Lightbulb, StickyNote, ExternalLink, FileText, Edit, Mic, MicOff, ChevronDown, ChevronRight, Bookmark, CheckSquare, Square, Copy } from "lucide-react";
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
import { topicsAPI, resourcesAPI, bookmarksAPI } from "@/api/client";
import { toast } from "sonner";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

function ResourceCard({ resource, onDelete, onEdit, onBookmarkToggle, onTodoToggle, onClick }) {

  const getIcon = () => {
    switch (resource.type) {
      case "external_link": return <Link2 className="w-4 h-4" />;
      case "note": return <StickyNote className="w-4 h-4" />;
      case "capture": return <FileText className="w-4 h-4" />;
      case "todo": return <CheckSquare className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (resource.type) {
      case "external_link": return "text-purple-400 bg-purple-500/10";
      case "note": return "text-fuchsia-400 bg-fuchsia-500/10";
      case "capture": return "text-violet-400 bg-violet-500/10";
      case "todo": return "text-green-400 bg-green-500/10";
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

  const handleCardClick = () => {
    onClick?.(resource);
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Parse todo items if it's a todo type
  let todoItems = [];
  if (resource.type === 'todo' && resource.content) {
    try {
      todoItems = JSON.parse(resource.content);
    } catch {
      todoItems = [];
    }
  }

  const completedCount = todoItems.filter(item => item.completed).length;

  return (
    <div
      className="glass-card-hover p-4 group flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn("p-2 rounded-lg shrink-0", getTypeColor())}>
            {getIcon()}
          </div>
          <h4 className="font-medium text-sm text-foreground truncate">{resource.title}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onBookmarkToggle?.(resource.id); }}
            className={cn(
              "p-1 hover:bg-muted rounded transition-opacity",
              resource.bookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            title={resource.bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className={cn(
              "w-3.5 h-3.5",
              resource.bookmarked ? "fill-primary text-primary" : "text-muted-foreground"
            )} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Use setTimeout to prevent modal from opening
                  setTimeout(() => onDelete(resource.id, true), 0);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Preview */}
      {resource.type !== 'todo' && (
        <p className="text-xs text-muted-foreground line-clamp-3 mb-2 flex-1">{displayContent}</p>
      )}

      {/* Todo Preview */}
      {resource.type === 'todo' && todoItems.length > 0 && (
        <div className="mb-2 flex-1">
          <p className="text-xs text-muted-foreground">
            {completedCount}/{todoItems.length} completed
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {displaySource && (
            <button
              onClick={handleLinkClick}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {displaySource}
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view
        </span>
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
    todoItems: [],
  });
  const [newTodoItem, setNewTodoItem] = useState('');
  const [showResourceDetail, setShowResourceDetail] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
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
  const [newTodoItemInModal, setNewTodoItemInModal] = useState('');

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
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch every 5 seconds to catch extension updates
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
      setNewResource({ title: '', description: '', type: 'note', content: '', url: '', todoItems: [] });
      setNewTodoItem('');
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

  // Bookmark resource mutation
  const bookmarkResourceMutation = useMutation({
    mutationFn: bookmarksAPI.toggleResource,
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle bookmark");
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
    } else if (newResource.type === 'todo') {
      if (newResource.todoItems.length === 0) {
        toast.error("Please add at least one todo item");
        return;
      }
      resourceData.content = JSON.stringify(newResource.todoItems);
    }

    createResourceMutation.mutate(resourceData);
  };

  const handleAddTodoItem = () => {
    if (!newTodoItem.trim()) return;
    setNewResource({
      ...newResource,
      todoItems: [...newResource.todoItems, { text: newTodoItem.trim(), completed: false }],
    });
    setNewTodoItem('');
  };

  const handleRemoveTodoItem = (index) => {
    setNewResource({
      ...newResource,
      todoItems: newResource.todoItems.filter((_, i) => i !== index),
    });
  };

  const handleOpenResourceDetail = (resource) => {
    setSelectedResource(resource);
    setShowResourceDetail(true);
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

  const handleDeleteResource = (resourceId, fromDropdown = false) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      if (fromDropdown) {
        // Close any potentially opening modal before deleting
        setSelectedResource(null);
        setShowResourceDetail(false);
      }
      deleteResourceMutation.mutate(resourceId);
    }
  };

  const handleTodoToggle = async (resourceId, itemIndex) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource || resource.type !== 'todo') return;

    try {
      const todoItems = JSON.parse(resource.content);
      todoItems[itemIndex].completed = !todoItems[itemIndex].completed;

      const resourceData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        content: JSON.stringify(todoItems),
      };

      await resourcesAPI.update(resourceId, resourceData);
      await queryClient.refetchQueries(['topic', id]);
    } catch (error) {
      toast.error("Failed to update todo item");
    }
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const handleAddTodoItemInModal = async (resourceId) => {
    if (!newTodoItemInModal.trim()) return;

    const resource = resources.find(r => r.id === resourceId);
    if (!resource || resource.type !== 'todo') return;

    try {
      const todoItems = JSON.parse(resource.content || '[]');
      todoItems.push({ text: newTodoItemInModal.trim(), completed: false });

      const resourceData = {
        title: resource.title,
        description: resource.description,
        type: resource.type,
        content: JSON.stringify(todoItems),
      };

      await resourcesAPI.update(resourceId, resourceData);
      await queryClient.refetchQueries(['topic', id]);
      setNewTodoItemInModal('');
      toast.success("Todo item added!");
    } catch (error) {
      toast.error("Failed to add todo item");
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

        {/* Resources Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No resources yet</p>
              <Button variant="outline" onClick={() => setShowAddResource(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Resource
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="opacity-0 animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <ResourceCard
                    resource={resource}
                    onDelete={handleDeleteResource}
                    onEdit={handleOpenEditResource}
                    onBookmarkToggle={(resourceId) => bookmarkResourceMutation.mutate(resourceId)}
                    onTodoToggle={handleTodoToggle}
                    onClick={handleOpenResourceDetail}
                  />
                </div>
              ))}
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
                  onValueChange={(value) => setNewResource({ ...newResource, type: value, todoItems: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="external_link">External Link</SelectItem>
                    <SelectItem value="todo">Todo List</SelectItem>
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

              {newResource.type === 'todo' && (
                <div className="space-y-2">
                  <Label>Todo Items</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a todo item"
                      value={newTodoItem}
                      onChange={(e) => setNewTodoItem(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTodoItem();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTodoItem}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {newResource.todoItems.length > 0 && (
                    <div className="space-y-2 mt-3 p-3 rounded-lg border border-border">
                      {newResource.todoItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm">{item.text}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTodoItem(index)}
                            className="opacity-0 group-hover:opacity-100 h-6 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Resource Detail Modal */}
      <Dialog open={showResourceDetail} onOpenChange={setShowResourceDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {(() => {
            // Get fresh resource data from query
            const currentResource = selectedResource && resources.find(r => r.id === selectedResource.id) || selectedResource;
            if (!currentResource) return null;

            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const getIcon = () => {
                      switch (currentResource.type) {
                        case "external_link": return <Link2 className="w-5 h-5" />;
                        case "note": return <StickyNote className="w-5 h-5" />;
                        case "capture": return <FileText className="w-5 h-5" />;
                        case "todo": return <CheckSquare className="w-5 h-5" />;
                        default: return <Lightbulb className="w-5 h-5" />;
                      }
                    };
                    return getIcon();
                  })()}
                  <span>{currentResource.title}</span>
                  {currentResource.type === 'todo' && (() => {
                    try {
                      const todoItems = JSON.parse(currentResource.content || '[]');
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
                {currentResource.description && (
                  <DialogDescription>{currentResource.description}</DialogDescription>
                )}
              </DialogHeader>

              <div className="py-4">
                {currentResource.type === 'todo' ? (
                  (() => {
                    let todoItems = [];
                    try {
                      todoItems = JSON.parse(currentResource.content || '[]');
                    } catch {
                      todoItems = [];
                    }
                    return (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {todoItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 py-1 group">
                              <button
                                onClick={() => handleTodoToggle(currentResource.id, index)}
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
                                handleAddTodoItemInModal(currentResource.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddTodoItemInModal(currentResource.id)}
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed flex-1">
                          {currentResource.content || currentResource.description || 'No content available'}
                        </p>
                        {(currentResource.content || currentResource.description) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyContent(currentResource.content || currentResource.description)}
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

                {(currentResource.url || currentResource.capture?.source) && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <a
                        href={currentResource.url || currentResource.capture?.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {currentResource.url || currentResource.capture?.source}
                      </a>
                    </div>
                  </div>
                )}

                {currentResource.createdAt && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created {new Date(currentResource.createdAt).toLocaleString()}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this resource?')) {
                      const resourceId = currentResource.id;
                      setShowResourceDetail(false);
                      setSelectedResource(null);
                      setTimeout(() => {
                        deleteResourceMutation.mutate(resourceId);
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
                    setShowResourceDetail(false);
                    handleOpenEditResource(currentResource);
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
                    setShowResourceDetail(false);
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
