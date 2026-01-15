import { Link2, FileText, Lightbulb, ExternalLink, Sparkles, Quote, AlignLeft, MoreHorizontal, Trash2, Edit, FolderPlus, Bookmark, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CaptureType = "link" | "note" | "idea" | "text" | "quote";

interface CaptureCardProps {
  id?: string;
  type: string;
  title: string;
  content: string;
  source?: string;
  topic?: { name: string; color: string };
  aiSummary?: string;
  timestamp: string;
  bookmarked?: boolean;
  unread?: boolean;
  onBookmarkToggle?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToTopic?: () => void;
  onClick?: () => void;
}

const typeIcons: Record<string, typeof Link2> = {
  link: Link2,
  note: FileText,
  idea: Lightbulb,
  text: AlignLeft,
  quote: Quote,
  todo: CheckSquare,
};

const typeLabels: Record<string, string> = {
  link: "Link",
  note: "Note",
  idea: "Idea",
  text: "Text",
  quote: "Quote",
  todo: "Todo",
};

export function CaptureCard({
  id,
  type,
  title,
  content,
  source,
  topic,
  aiSummary,
  timestamp,
  bookmarked = false,
  unread = false,
  onBookmarkToggle,
  className,
  style,
  onEdit,
  onDelete,
  onAddToTopic,
  onClick
}: CaptureCardProps) {
  const Icon = typeIcons[type] || FileText;

  // For todo type, show count instead of raw JSON
  const displayContent = (() => {
    if (type === 'todo') {
      try {
        const todoItems = JSON.parse(content || '[]');
        const completed = todoItems.filter((item: any) => item.completed).length;
        return `${completed}/${todoItems.length} completed`;
      } catch {
        return content;
      }
    }
    return content;
  })();

  const handleOpenSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source) {
      window.open(source, '_blank');
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      onBookmarkToggle?.(id);
    }
  };

  const handleCardClick = () => {
    onClick?.();
  };

  return (
    <div
      className={cn(
        "glass-card p-3 group hover:border-border transition-colors relative",
        onClick && "cursor-pointer",
        className
      )}
      style={style}
      onClick={handleCardClick}
    >
      {/* Unread indicator */}
      {unread && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" title="Unread" />
      )}

      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-1">
              {id && (
                <button
                  onClick={handleBookmarkClick}
                  className={cn(
                    "p-1 hover:bg-muted rounded transition-opacity",
                    bookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  title={bookmarked ? "Remove bookmark" : "Add bookmark"}
                >
                  <Bookmark className={cn(
                    "w-3.5 h-3.5",
                    bookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                  )} />
                </button>
              )}
              {source && (
                <button
                  onClick={handleOpenSource}
                  className="p-1 hover:bg-muted rounded transition-opacity opacity-0 group-hover:opacity-100"
                  title="Open source"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onAddToTopic && (
                    <DropdownMenuItem onClick={onAddToTopic}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Add to Topic
                    </DropdownMenuItem>
                  )}
                  {(onEdit || onAddToTopic) && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => onDelete(), 0);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {displayContent}
          </p>

          {/* AI Summary */}
          {aiSummary && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-2">
              <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-1">{aiSummary}</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs">
            {topic && (
              <span className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", topic.color)} />
                <span className="text-muted-foreground">{topic.name}</span>
              </span>
            )}
            <span className="text-muted-foreground ml-auto">{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
