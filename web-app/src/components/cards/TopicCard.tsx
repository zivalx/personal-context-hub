import { FileText, Link2, Lightbulb, MoreHorizontal, Trash2, Share2, Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopicCardProps {
  id: string;
  name: string;
  description: string;
  color: string;
  itemCount: number;
  linkCount: number;
  noteCount: number;
  lastUpdated: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TopicCard({
  id,
  name,
  description,
  color,
  itemCount,
  linkCount,
  noteCount,
  lastUpdated,
  className,
  style
}: TopicCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/topic/${id}`);
  };

  const handleMenuAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`${action} topic: ${name}`);
  };

  return (
    <div 
      className={cn("glass-card-hover p-5 cursor-pointer group", className)} 
      style={style}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-medium text-foreground">{name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => handleMenuAction(e as unknown as React.MouseEvent, 'copy')}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuAction(e as unknown as React.MouseEvent, 'share')}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuAction(e as unknown as React.MouseEvent, 'export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => handleMenuAction(e as unknown as React.MouseEvent, 'delete')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {itemCount} items
        </span>
        <span className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          {linkCount} links
        </span>
        <span className="flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          {noteCount} notes
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            View →
          </span>
        </div>
      </div>
    </div>
  );
}
