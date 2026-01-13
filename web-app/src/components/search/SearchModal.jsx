import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, FileText, Link2, StickyNote, Lightbulb, Layers } from 'lucide-react';
import { searchAPI } from '@/api/client';
import { cn } from '@/lib/utils';

export function SearchModal({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when modal closes
      setQuery('');
      setResults(null);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await searchAPI.globalSearch(query.trim());
      setResults(response.data);
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type, id) => {
    onOpenChange(false);
    if (type === 'topic') {
      navigate(`/topic/${id}`);
    }
    // For captures and resources, we stay on the current page
    // You could extend this to navigate to specific views
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'external_link': return <Link2 className="w-4 h-4" />;
      case 'note': return <StickyNote className="w-4 h-4" />;
      case 'capture': return <FileText className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'external_link': return 'text-purple-400 bg-purple-500/10';
      case 'note': return 'text-fuchsia-400 bg-fuchsia-500/10';
      case 'capture': return 'text-violet-400 bg-violet-500/10';
      default: return 'text-indigo-400 bg-indigo-500/10';
    }
  };

  const getCaptureIcon = (type) => {
    switch (type) {
      case 'link': return <Link2 className="w-4 h-4" />;
      case 'note': return <StickyNote className="w-4 h-4" />;
      case 'quote': return <Lightbulb className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCaptureTypeColor = (type) => {
    switch (type) {
      case 'link': return 'text-blue-400 bg-blue-500/10';
      case 'note': return 'text-green-400 bg-green-500/10';
      case 'quote': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search topics, resources, and captures..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {query.trim().length < 2 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          )}

          {query.trim().length >= 2 && !loading && !results && !error && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found</p>
            </div>
          )}

          {results && results.totalResults === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {results && results.totalResults > 0 && (
            <div className="p-2 space-y-4">
              {/* Topics */}
              {results.topics && results.topics.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Topics ({results.topics.length})
                  </h3>
                  <div className="space-y-1">
                    {results.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleResultClick('topic', topic.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{topic.title}</p>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground truncate">{topic.description}</p>
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: topic.color || '#8B5CF6' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {results.resources && results.resources.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Resources ({results.resources.length})
                  </h3>
                  <div className="space-y-1">
                    {results.resources.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => resource.topic && handleResultClick('topic', resource.topic.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className={cn("p-2 rounded-lg", getResourceTypeColor(resource.type))}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{resource.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {resource.topic && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {resource.topic.title}
                              </span>
                            )}
                            {resource.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {resource.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Captures */}
              {results.captures && results.captures.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Captures ({results.captures.length})
                  </h3>
                  <div className="space-y-1">
                    {results.captures.map((capture) => (
                      <div
                        key={capture.id}
                        className="flex items-center gap-3 p-3 rounded-lg"
                      >
                        <div className={cn("p-2 rounded-lg", getCaptureTypeColor(capture.type))}>
                          {getCaptureIcon(capture.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {capture.title || 'Untitled'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {capture.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <kbd className="px-2 py-1 bg-muted rounded">ESC</kbd>
            <span>to close</span>
          </div>
          {results && results.totalResults > 0 && (
            <span>{results.totalResults} results</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
