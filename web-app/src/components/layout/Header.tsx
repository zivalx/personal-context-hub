import { Search, Bell, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* AI Search */}
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors cursor-pointer group">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Ask AI anything...
            </span>
            <kbd className="ml-8 font-mono text-xs bg-background/50 px-1.5 py-0.5 rounded text-muted-foreground">
              ⌘J
            </kbd>
          </div>
        </div>

        {/* Actions */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>

        <Button className="gap-2 ai-gradient-bg text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>New Topic</span>
        </Button>
      </div>
    </header>
  );
}
