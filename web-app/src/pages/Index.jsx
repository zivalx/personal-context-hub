import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { topicsAPI, capturesAPI } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Index() {
  const [activeItem, setActiveItem] = useState("All Items");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', color: '#8B5CF6' });
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
    queryFn: () => capturesAPI.getAll({ limit: 10 }),
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

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) {
      toast.error("Please enter a topic title");
      return;
    }
    createTopicMutation.mutate(newTopic);
  };

  const topics = topicsData?.data?.topics || [];
  const captures = capturesData?.data?.captures || [];
  const totalResources = topics.reduce((sum, topic) => sum + (topic._count?.resources || 0), 0);

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
          title={`Welcome back${user?.name ? `, ${user.name}` : ''}!`}
          subtitle={`${totalResources} resources across ${topics.length} topics`}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <StatsBar
              totalCaptures={captures.length}
              totalTopics={topics.length}
              totalResources={totalResources}
            />
          </div>

          {/* Topics Grid */}
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

          {/* Recent Captures */}
          <section className="opacity-0 animate-fade-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Recent Captures
              </h2>
            </div>

            {capturesLoading ? (
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
                    style={{ animationDelay: `${0.6 + index * 0.05}s`, animationFillMode: 'forwards' }}
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
    </div>
  );
}
