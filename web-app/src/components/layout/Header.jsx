import { useState, useEffect } from "react";
import { Search, Bell, Plus, Sparkles, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/ai/AIChat";
import { useTheme } from "@/contexts/ThemeContext";

export function Header({ title, subtitle, onCreateTopic, icon }) {
  const [showAIChat, setShowAIChat] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcut for AI chat (Cmd+J or Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowAIChat(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Chat */}
          <div className="relative">
            <button
              onClick={() => setShowAIChat(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Ask AI anything...
              </span>
              <kbd className="ml-8 font-mono text-xs bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground">
                ⌘J
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {onCreateTopic && (
            <Button
              onClick={onCreateTopic}
              className="gap-2 ai-gradient-bg text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>New Topic</span>
            </Button>
          )}
        </div>
      </header>

      {/* AI Chat Modal */}
      <AIChat open={showAIChat} onOpenChange={setShowAIChat} />
    </>
  );
}
