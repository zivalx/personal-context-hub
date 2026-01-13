import { Link2, FileText, Lightbulb, ExternalLink, Sparkles, Quote, AlignLeft, MoreHorizontal, Trash2, Edit, FolderPlus } from "lucide-react";
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
  type: string;
  title: string;
  content: string;
  source?: string;
  topic?: { name: string; color: string };
  aiSummary?: string;
  timestamp: string;
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
};

const typeLabels: Record<string, string> = {
  link: "Link",
  note: "Note",
  idea: "Idea",
  text: "Text",
  quote: "Quote",
};

export function CaptureCard({
  type,
  title,
  content,
  source,
  topic,
  aiSummary,
  timestamp,
  className,
  style,
  onEdit,
  onDelete,
  onAddToTopic,
  onClick
}: CaptureCardProps) {
  const Icon = typeIcons[type] || FileText;

  const handleOpenSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source) {
      window.open(source, '_blank');
    }
  };

  return (
    <div className={cn("glass-card p-4 cursor-pointer group hover:border-border transition-colors", className)} style={style} onClick={onClick}>
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-1">
              {source && (
                <button
                  onClick={handleOpenSource}
                  className="p-1 hover:bg-muted rounded transition-opacity opacity-0 group-hover:opacity-100"
                  title="Open source"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onAddToTopic && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToTopic(); }}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Add to Topic
                    </DropdownMenuItem>
                  )}
                  {(onEdit || onAddToTopic) && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {content}
          </p>

          {/* AI Summary */}
          {aiSummary && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{aiSummary}</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs">
            {topic && (
              <span className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", topic.color)} />
                <span className="text-muted-foreground">{topic.name}</span>
              </span>
            )}
            {source && (
              <span className="text-muted-foreground truncate max-w-[150px]">
                {source}
              </span>
            )}
            <span className="text-muted-foreground ml-auto">{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
