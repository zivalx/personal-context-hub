import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Link2, Lightbulb, StickyNote, ExternalLink, FileText, Edit, Mic, MicOff, ChevronDown, ChevronRight, Bookmark, CheckSquare, Square, Copy, GripVertical, FolderMinus, FolderInput, Layers, File, FileImage, FileSpreadsheet, Upload, Download } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { topicsAPI, resourcesAPI, bookmarksAPI, groupsAPI } from "@/api/client";
import { toast } from "sonner";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

function SortableResourceCard({ resource, onDelete, onEdit, onRemoveFromTopic, onMoveToTopic, onAssignToGroup, onBookmarkToggle, onTodoToggle, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ResourceCard
        resource={resource}
        onDelete={onDelete}
        onEdit={onEdit}
        onRemoveFromTopic={onRemoveFromTopic}
        onMoveToTopic={onMoveToTopic}
        onAssignToGroup={onAssignToGroup}
        onBookmarkToggle={onBookmarkToggle}
        onTodoToggle={onTodoToggle}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function ResourceCard({ resource, onDelete, onEdit, onRemoveFromTopic, onMoveToTopic, onAssignToGroup, onBookmarkToggle, onTodoToggle, onClick, dragHandleProps }) {

  const getIcon = () => {
    switch (resource.type) {
      case "external_link": return <Link2 className="w-4 h-4" />;
      case "note": return <StickyNote className="w-4 h-4" />;
      case "capture": return <FileText className="w-4 h-4" />;
      case "todo": return <CheckSquare className="w-4 h-4" />;
      case "file": {
        // Show different icons based on file type
        if (resource.fileType?.startsWith('image/')) {
          return <FileImage className="w-4 h-4" />;
        } else if (resource.fileType === 'application/pdf') {
          return <FileText className="w-4 h-4" />;
        } else if (resource.fileType === 'text/csv' || resource.fileType?.includes('spreadsheet')) {
          return <FileSpreadsheet className="w-4 h-4" />;
        } else {
          return <File className="w-4 h-4" />;
        }
      }
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (resource.type) {
      case "external_link": return "text-purple-400 bg-purple-500/10";
      case "note": return "text-fuchsia-400 bg-fuchsia-500/10";
      case "capture": return "text-violet-400 bg-violet-500/10";
      case "todo": return "text-green-400 bg-green-500/10";
      case "file": return "text-blue-400 bg-blue-500/10";
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
      className="glass-card-hover p-4 group flex flex-col h-full cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Unread indicator */}
      {resource.unread && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" title="Unread" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
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
              {onMoveToTopic && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTopic(resource); }}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Copy/Move to Topic
                </DropdownMenuItem>
              )}
              {onAssignToGroup && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssignToGroup(resource); }}>
                  <Layers className="w-4 h-4 mr-2" />
                  Assign to Group
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onRemoveFromTopic && resource.captureId && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRemoveFromTopic(resource.id); }}>
                  <FolderMinus className="w-4 h-4 mr-2" />
                  Remove from Topic
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Use setTimeout to prevent modal from opening
                  setTimeout(() => onDelete(resource.id), 0);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {resource.captureId ? 'Delete Entirely' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-2 flex-1 min-h-[3rem]">
        {resource.type !== 'todo' && resource.type !== 'file' && displayContent && (
          <p className="text-xs text-muted-foreground line-clamp-2">{displayContent}</p>
        )}

        {/* Todo Preview */}
        {resource.type === 'todo' && todoItems.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {completedCount}/{todoItems.length} completed
          </p>
        )}

        {/* File Preview */}
        {resource.type === 'file' && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground truncate">{resource.fileName}</p>
            {resource.fileSize && (
              <p className="text-xs text-muted-foreground">
                {(resource.fileSize / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {displaySource && resource.type !== 'file' && (
            <button
              onClick={handleLinkClick}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {displaySource}
            </button>
          )}
          {resource.type === 'file' && (
            <a
              href={`http://localhost:3001/api/resources/${resource.id}/download?token=${localStorage.getItem('token')}`}
              download
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </a>
          )}
        </div>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view
        </span>
      </div>
    </div>
  );
}

// CSV Viewer Component
function CSVViewer({ resourceId }) {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/resources/${resourceId}/view?token=${localStorage.getItem('token')}`
        );
        const text = await response.text();

        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          // Simple CSV parsing (handles basic cases)
          return line.split(',').map(cell => cell.trim());
        });

        setCsvData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCSV();
  }, [resourceId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-sm text-destructive">Error loading CSV: {error}</p>;
  if (csvData.length === 0) return <p className="text-sm text-muted-foreground">No data</p>;

  const headers = csvData[0];
  const rows = csvData.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map((header, i) => (
              <th key={i} className="text-left p-2 font-semibold bg-muted/50">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {row.map((cell, j) => (
                <td key={j} className="p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Text File Viewer Component
function TextFileViewer({ resourceId }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/resources/${resourceId}/view?token=${localStorage.getItem('token')}`
        );
        const content = await response.text();
        setText(content);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchText();
  }, [resourceId]);

  if (loading) return 'Loading...';
  if (error) return `Error loading file: ${error}`;
  return text;
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
    file: null,
  });
  const [newTodoItem, setNewTodoItem] = useState('');
  const [showResourceDetail, setShowResourceDetail] = useState(false);
  const [showMoveToTopic, setShowMoveToTopic] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAssignToGroup, setShowAssignToGroup] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedTargetTopicId, setSelectedTargetTopicId] = useState('');
  const [moveOrCopy, setMoveOrCopy] = useState('copy'); // 'copy' or 'move'
  const [newGroup, setNewGroup] = useState({ name: '', color: '#8B5CF6' });
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
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

  // Drag and drop sensors - must be at top level
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
      },
    })
  );

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
      setNewResource({ title: '', description: '', type: 'note', content: '', url: '', todoItems: [], file: null });
      setNewTodoItem('');
      toast.success("Resource added successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add resource");
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: ({ file, title, description }) => resourcesAPI.uploadFile(id, file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      setShowAddResource(false);
      setNewResource({ title: '', description: '', type: 'note', content: '', url: '', todoItems: [], file: null });
      toast.success("File uploaded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload file");
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
      queryClient.invalidateQueries(['captures']); // Refresh captures list
      toast.success("Resource deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete resource");
    },
  });

  // Remove resource from topic mutation
  const removeResourceFromTopicMutation = useMutation({
    mutationFn: resourcesAPI.removeFromTopic,
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      queryClient.invalidateQueries(['captures']); // Refresh captures list
      toast.success("Resource removed from topic!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove resource");
    },
  });

  // Copy resource to topic mutation
  const copyResourceToTopicMutation = useMutation({
    mutationFn: ({ resourceId, topicId }) => resourcesAPI.copyToTopic(resourceId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      queryClient.invalidateQueries(['topics']); // Refresh all topics
      toast.success("Resource copied to new topic!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to copy resource");
    },
  });

  // Move resource to topic mutation
  const moveResourceToTopicMutation = useMutation({
    mutationFn: ({ resourceId, topicId }) => resourcesAPI.moveToTopic(resourceId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      queryClient.invalidateQueries(['topics']); // Refresh all topics
      toast.success("Resource moved to new topic!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move resource");
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

  // Reorder resources mutation
  const reorderResourcesMutation = useMutation({
    mutationFn: (resourceOrders) => resourcesAPI.reorder(id, resourceOrders),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      toast.success("Resources reordered!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder resources");
    },
  });

  // Assign resource to group mutation
  const assignToGroupMutation = useMutation({
    mutationFn: ({ resourceId, groupId }) =>
      resourcesAPI.update(resourceId, { groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      toast.success("Resource assigned to group!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign to group");
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData) => groupsAPI.create(id, groupData),
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      toast.success("Group created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: groupsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['topic', id]);
      toast.success("Group deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete group");
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

    // Handle file upload separately
    if (newResource.type === 'file') {
      if (!newResource.file) {
        toast.error("Please select a file to upload");
        return;
      }
      uploadFileMutation.mutate({
        file: newResource.file,
        title: newResource.title,
        description: newResource.description,
      });
      return;
    }

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

  const handleOpenResourceDetail = async (resource) => {
    setSelectedResource(resource);
    setShowResourceDetail(true);

    // Mark as read if unread
    if (resource.unread) {
      try {
        await resourcesAPI.markAsRead(resource.id);
        queryClient.invalidateQueries(['topic', id]);
        queryClient.invalidateQueries(['bookmarks']);
      } catch (error) {
        console.error('Failed to mark resource as read:', error);
      }
    }
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
    const resource = resources.find(r => r.id === resourceId);
    const message = resource?.captureId
      ? 'Are you sure you want to delete this resource? This will also delete the associated capture from Recent Captures.'
      : 'Are you sure you want to delete this resource?';

    if (confirm(message)) {
      deleteResourceMutation.mutate(resourceId);
    }
  };

  const handleRemoveFromTopic = (resourceId) => {
    if (confirm('Remove this resource from the topic? The capture will remain in Recent Captures.')) {
      removeResourceFromTopicMutation.mutate(resourceId);
    }
  };

  const handleOpenMoveToTopic = (resource) => {
    setSelectedResource(resource);
    setSelectedTargetTopicId('');
    setMoveOrCopy('copy'); // Default to copy
    setShowMoveToTopic(true);
  };

  const handleMoveOrCopyToTopic = (e) => {
    e.preventDefault();
    if (!selectedTargetTopicId) {
      toast.error("Please select a topic");
      return;
    }

    if (moveOrCopy === 'copy') {
      copyResourceToTopicMutation.mutate({
        resourceId: selectedResource.id,
        topicId: selectedTargetTopicId,
      });
    } else {
      moveResourceToTopicMutation.mutate({
        resourceId: selectedResource.id,
        topicId: selectedTargetTopicId,
      });
    }
    setShowMoveToTopic(false);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!newGroup.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      // Create the group first
      const result = await createGroupMutation.mutateAsync({
        name: newGroup.name,
        color: newGroup.color,
      });

      // If we have a selected resource, assign it to the new group
      if (selectedResource && result.data.group) {
        await assignToGroupMutation.mutateAsync({
          resourceId: selectedResource.id,
          groupId: result.data.group.id,
        });
      }

      // Reset state
      setNewGroup({ name: '', color: '#8B5CF6' });
      setShowCreateGroup(false);
      setSelectedResource(null);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleOpenAssignToGroup = (resource) => {
    setSelectedResource(resource);
    setSelectedGroupId(resource.groupId || '');
    setShowAssignToGroup(true);
  };

  const handleAssignToGroup = (e) => {
    e.preventDefault();

    if (!selectedGroupId || selectedGroupId === 'none') {
      // Remove from group
      assignToGroupMutation.mutate({
        resourceId: selectedResource.id,
        groupId: null,
      });
    } else if (selectedGroupId === 'new') {
      // Create new group
      setShowAssignToGroup(false);
      setShowCreateGroup(true);
      return; // Don't close the dialog yet
    } else {
      // Assign to existing group
      assignToGroupMutation.mutate({
        resourceId: selectedResource.id,
        groupId: selectedGroupId,
      });
    }
    setShowAssignToGroup(false);
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

  const toggleGroupCollapse = (groupId) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
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
  const groups = topic?.groups || [];

  // Group resources
  const groupedResources = groups.map(group => ({
    ...group,
    resources: resources.filter(r => r.groupId === group.id),
  }));

  // Ungrouped resources
  const ungroupedResources = resources.filter(r => !r.groupId);

  // Handle drag end - reorder resources
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = resources.findIndex((r) => r.id === active.id);
    const newIndex = resources.findIndex((r) => r.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create new order array
    const newResources = [...resources];
    const [movedResource] = newResources.splice(oldIndex, 1);
    newResources.splice(newIndex, 0, movedResource);

    // Update order values and send to backend
    const resourceOrders = newResources.map((resource, index) => ({
      id: resource.id,
      order: index,
    }));

    reorderResourcesMutation.mutate(resourceOrders);
  };

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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Layers className="w-4 h-4" />
                  Create Group
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
            <div className="space-y-6">
              {/* Grouped Resources */}
              {groupedResources.map((group) => (
                <div key={group.id} className="space-y-3">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="flex items-center gap-2 w-full hover:bg-muted/50 rounded-lg p-2 transition-colors"
                  >
                    {collapsedGroups.has(group.id) ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="font-medium">{group.name}</h3>
                    <span className="text-muted-foreground text-sm">
                      ({group.resources.length})
                    </span>
                  </button>

                  {/* Group Resources */}
                  {!collapsedGroups.has(group.id) && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={group.resources.map((r) => r.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6">
                          {group.resources.map((resource, index) => (
                            <div
                              key={resource.id}
                              className="opacity-0 animate-fade-up"
                              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                            >
                              <SortableResourceCard
                                resource={resource}
                                onDelete={handleDeleteResource}
                                onEdit={handleOpenEditResource}
                                onRemoveFromTopic={handleRemoveFromTopic}
                                onMoveToTopic={handleOpenMoveToTopic}
                                onAssignToGroup={handleOpenAssignToGroup}
                                onBookmarkToggle={(resourceId) => bookmarkResourceMutation.mutate(resourceId)}
                                onTodoToggle={handleTodoToggle}
                                onClick={handleOpenResourceDetail}
                              />
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ))}

              {/* Ungrouped Resources */}
              {ungroupedResources.length > 0 && (
                <div className="space-y-3">
                  {groupedResources.length > 0 && (
                    <h3 className="text-muted-foreground text-sm uppercase font-medium">
                      Ungrouped
                    </h3>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={ungroupedResources.map((r) => r.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ungroupedResources.map((resource, index) => (
                          <div
                            key={resource.id}
                            className="opacity-0 animate-fade-up"
                            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                          >
                            <SortableResourceCard
                              resource={resource}
                              onDelete={handleDeleteResource}
                              onEdit={handleOpenEditResource}
                              onRemoveFromTopic={handleRemoveFromTopic}
                              onMoveToTopic={handleOpenMoveToTopic}
                              onAssignToGroup={handleOpenAssignToGroup}
                              onBookmarkToggle={(resourceId) => bookmarkResourceMutation.mutate(resourceId)}
                              onTodoToggle={handleTodoToggle}
                              onClick={handleOpenResourceDetail}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
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
                  onValueChange={(value) => setNewResource({ ...newResource, type: value, todoItems: [], file: null })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="external_link">External Link</SelectItem>
                    <SelectItem value="todo">Todo List</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
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

              {newResource.type === 'file' && (
                <div className="space-y-2">
                  <Label htmlFor="resourceFile">Choose File</Label>
                  <Input
                    id="resourceFile"
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (10MB limit)
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File too large. Maximum size is 10MB');
                          e.target.value = '';
                          return;
                        }
                        setNewResource({ ...newResource, file, title: newResource.title || file.name });
                      }
                    }}
                    required
                  />
                  {newResource.file && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{newResource.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(newResource.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG, GIF, WEBP, SVG (Max: 10MB)
                  </p>
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
                disabled={createResourceMutation.isPending || uploadFileMutation.isPending}
                className="ai-gradient-bg"
              >
                {createResourceMutation.isPending || uploadFileMutation.isPending ? (newResource.type === 'file' ? 'Uploading...' : 'Adding...') : 'Add Resource'}
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
                        case "file": {
                          if (currentResource.fileType?.startsWith('image/')) {
                            return <FileImage className="w-5 h-5" />;
                          } else if (currentResource.fileType === 'application/pdf') {
                            return <FileText className="w-5 h-5" />;
                          } else if (currentResource.fileType === 'text/csv' || currentResource.fileType?.includes('spreadsheet')) {
                            return <FileSpreadsheet className="w-5 h-5" />;
                          } else {
                            return <File className="w-5 h-5" />;
                          }
                        }
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
                {currentResource.type === 'file' ? (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        {currentResource.fileType?.startsWith('image/') ? <FileImage className="w-5 h-5 text-blue-400" /> :
                         currentResource.fileType === 'application/pdf' ? <FileText className="w-5 h-5 text-blue-400" /> :
                         currentResource.fileType === 'text/csv' || currentResource.fileType?.includes('spreadsheet') ? <FileSpreadsheet className="w-5 h-5 text-blue-400" /> :
                         <File className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{currentResource.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {currentResource.fileSize ? `${(currentResource.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </p>
                      </div>
                      <a
                        href={`http://localhost:3001/api/resources/${currentResource.id}/download?token=${localStorage.getItem('token')}`}
                        download
                        className="shrink-0"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    </div>

                    {/* File Viewer */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      {currentResource.fileType?.startsWith('image/') ? (
                        <img
                          src={`http://localhost:3001/api/resources/${currentResource.id}/view?token=${localStorage.getItem('token')}`}
                          alt={currentResource.fileName}
                          className="w-full h-auto max-h-[60vh] object-contain bg-muted"
                        />
                      ) : currentResource.fileType === 'application/pdf' ? (
                        <iframe
                          src={`http://localhost:3001/api/resources/${currentResource.id}/view?token=${localStorage.getItem('token')}`}
                          className="w-full h-[60vh]"
                          title={currentResource.fileName}
                        />
                      ) : currentResource.fileType === 'text/csv' ? (
                        <div className="p-4 max-h-[60vh] overflow-auto">
                          <CSVViewer resourceId={currentResource.id} />
                        </div>
                      ) : currentResource.fileType === 'text/plain' ? (
                        <div className="p-4 max-h-[60vh] overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            <TextFileViewer resourceId={currentResource.id} />
                          </pre>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <File className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Preview not available for this file type
                          </p>
                          <a
                            href={`http://localhost:3001/api/resources/${currentResource.id}/download?token=${localStorage.getItem('token')}`}
                            download
                          >
                            <Button variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download to View
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : currentResource.type === 'todo' ? (
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

      {/* Move/Copy to Topic Modal */}
      <Dialog open={showMoveToTopic} onOpenChange={setShowMoveToTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy or Move to Topic</DialogTitle>
            <DialogDescription>
              Select a topic and choose whether to copy or move this resource
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMoveOrCopyToTopic}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="targetTopic">Target Topic</Label>
                <Select
                  value={selectedTargetTopicId}
                  onValueChange={setSelectedTargetTopicId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topicsList.filter(t => t.id !== id).map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          {topic.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Action</Label>
                <RadioGroup value={moveOrCopy} onValueChange={setMoveOrCopy}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="copy" id="copy" />
                    <Label htmlFor="copy" className="font-normal cursor-pointer">
                      Copy to topic (keep in current topic)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="move" id="move" />
                    <Label htmlFor="move" className="font-normal cursor-pointer">
                      Move to topic (remove from current topic)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedResource && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Resource:</p>
                  <p className="text-sm font-medium">{selectedResource.title}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMoveToTopic(false);
                  setSelectedTargetTopicId('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={moveResourceToTopicMutation.isPending || copyResourceToTopicMutation.isPending}
                className="ai-gradient-bg"
              >
                {moveResourceToTopicMutation.isPending || copyResourceToTopicMutation.isPending
                  ? (moveOrCopy === 'copy' ? 'Copying...' : 'Moving...')
                  : (moveOrCopy === 'copy' ? 'Copy to Topic' : 'Move to Topic')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize resources within this topic
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Research Links, Ideas"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupColor">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="groupColor"
                    type="color"
                    value={newGroup.color}
                    onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{newGroup.color}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="ai-gradient-bg">
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign to Group Modal */}
      <Dialog open={showAssignToGroup} onOpenChange={setShowAssignToGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Group</DialogTitle>
            <DialogDescription>
              Choose which group this resource belongs to
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignToGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="selectGroup">Group</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group or create new" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No group (ungrouped)</span>
                    </SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="w-3 h-3" />
                        Create New Group
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedResource && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Resource:</p>
                  <p className="text-sm font-medium">{selectedResource.title}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignToGroup(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignToGroupMutation.isPending}
                className="ai-gradient-bg"
              >
                {assignToGroupMutation.isPending ? 'Assigning...' : 'Assign to Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
