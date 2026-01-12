import { Link2, FileText, Lightbulb, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type CaptureType = "link" | "note" | "idea";

interface CaptureCardProps {
  type: CaptureType;
  title: string;
  content: string;
  source?: string;
  topic?: { name: string; color: string };
  aiSummary?: string;
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
}

const typeIcons: Record<CaptureType, typeof Link2> = {
  link: Link2,
  note: FileText,
  idea: Lightbulb,
};

const typeLabels: Record<CaptureType, string> = {
  link: "Link",
  note: "Note",
  idea: "Idea",
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
  style
}: CaptureCardProps) {
  const Icon = typeIcons[type];

  return (
    <div className={cn("glass-card p-4 cursor-pointer group hover:border-border transition-colors", className)} style={style}>
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{title}</h4>
            {type === "link" && (
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
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
