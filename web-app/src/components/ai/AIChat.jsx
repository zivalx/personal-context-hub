import { useState } from 'react';
import { Sparkles, Send, X, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function AIChat({ open, onOpenChange }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState([]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      const aiMessage = {
        role: 'assistant',
        content: data.data.answer,
        sources: data.data.sources || [],
        capturesUsed: data.data.capturesUsed || 0,
        timestamp: new Date(),
      };

      setConversation((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      // Remove user message if error
      setConversation((prev) => prev.slice(0, -1));
      setQuestion(userMessage.content); // Restore question
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleClear = () => {
    setConversation([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span>Ask AI</span>
            </DialogTitle>
            {conversation.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ask questions about your captures and I'll help you find answers
          </p>
        </DialogHeader>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full ai-gradient-bg opacity-10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ask me anything</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                I can search through your captures and help answer questions about your saved content
              </p>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setQuestion('What are the main topics I\'ve saved?')}
                  className="block text-sm text-primary hover:underline"
                >
                  What are the main topics I've saved?
                </button>
                <button
                  onClick={() => setQuestion('Summarize my recent captures')}
                  className="block text-sm text-primary hover:underline"
                >
                  Summarize my recent captures
                </button>
                <button
                  onClick={() => setQuestion('What links have I saved about programming?')}
                  className="block text-sm text-primary hover:underline"
                >
                  What links have I saved about programming?
                </button>
              </div>
            </div>
          ) : (
            conversation.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg ai-gradient-bg flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">
                            Sources: {message.capturesUsed} captures used
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source) => (
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
                    </>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-semibold text-sm">
                    U
                  </div>
                )}
              </div>
            ))
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

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your captures..."
              className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              disabled={loading}
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="ai-gradient-bg self-end"
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
