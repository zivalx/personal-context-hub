import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, FileText, Link2, StickyNote, Lightbulb, Layers, Sparkles, Send } from 'lucide-react';
import { searchAPI } from '@/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function SearchModal({ open, onOpenChange }) {
  const [mode, setMode] = useState('search'); // 'search' or 'ai'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiSources, setAiSources] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults(null);
      setError('');
      setAiResponse(null);
      setAiSources([]);
      setMode('search');
    }
  }, [open]);

  useEffect(() => {
    if (mode === 'search') {
      const delayDebounce = setTimeout(() => {
        if (query.trim().length >= 2) {
          handleSearch();
        } else {
          setResults(null);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [query, mode]);

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

  const handleAIAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setAiResponse(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      setAiResponse(data.data.answer);
      setAiSources(data.data.sources || []);
    } catch (err) {
      setError(err.message);
      setAiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && mode === 'ai') {
      e.preventDefault();
      handleAIAsk();
    }
  };

  const handleResultClick = (type, id) => {
    onOpenChange(false);
    if (type === 'topic') {
      navigate(`/topic/${id}`);
    }
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
        {/* Mode Toggle */}
        <div className="p-2 border-b border-border flex gap-1 bg-muted/30">
          <button
            onClick={() => {
              setMode('search');
              setAiResponse(null);
              setError('');
            }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
              mode === 'search'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={() => {
              setMode('ai');
              setResults(null);
              setError('');
            }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
              mode === 'ai'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative flex gap-2">
            {mode === 'search' ? (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            ) : (
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            )}
            <Input
              ref={inputRef}
              type="text"
              placeholder={mode === 'search' ? "Search topics, resources, and captures..." : "Ask AI anything about your captures..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-10 h-12 text-base flex-1"
            />
            {mode === 'ai' && (
              <Button
                onClick={handleAIAsk}
                disabled={!query.trim() || loading}
                className="ai-gradient-bg h-12 px-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            )}
            {loading && mode === 'search' && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[500px] overflow-y-auto">
          {mode === 'search' ? (
            <>
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
            </>
          ) : (
            // AI Mode
            <div className="p-6">
              {!aiResponse && !loading && !error && (
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full ai-gradient-bg opacity-10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Ask AI anything</h3>
                  <p className="text-sm mb-6">
                    I'll search through your captures and help answer your questions
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setQuery('What are the main topics I\'ve saved?')}
                      className="block mx-auto text-sm text-primary hover:underline"
                    >
                      What are the main topics I've saved?
                    </button>
                    <button
                      onClick={() => setQuery('Summarize my recent captures')}
                      className="block mx-auto text-sm text-primary hover:underline"
                    >
                      Summarize my recent captures
                    </button>
                  </div>
                </div>
              )}

              {aiResponse && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-muted rounded-lg p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{aiResponse}</ReactMarkdown>
                      </div>
                      {aiSources && aiSources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiSources.map((source) => (
                              <span
                                key={source.id}
                                className="text-xs px-2 py-1 rounded bg-background/50 text-foreground"
                              >
                                {source.title || 'Untitled'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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
            {mode === 'ai' && (
              <>
                <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd>
                <span>to ask</span>
              </>
            )}
          </div>
          {mode === 'search' && results && results.totalResults > 0 && (
            <span>{results.totalResults} results</span>
          )}
          {mode === 'ai' && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by Grok AI
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
