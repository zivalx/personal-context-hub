import { Sparkles, ArrowRight, TrendingUp, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
  type: "trend" | "suggestion" | "connection";
  title: string;
  description: string;
  action?: string;
  className?: string;
}

const typeConfig = {
  trend: { icon: TrendingUp, label: "Trending" },
  suggestion: { icon: Lightbulb, label: "Suggestion" },
  connection: { icon: Zap, label: "Connection" },
};

export function AIInsightCard({
  type,
  title,
  description,
  action,
  className
}: AIInsightCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 cursor-pointer group",
      "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
      "border border-primary/20 hover:border-primary/40 transition-all duration-300",
      className
    )}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            AI {config.label}
          </span>
        </div>

        <h4 className="font-medium text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>

        {action && (
          <button className="flex items-center gap-1.5 text-xs text-primary font-medium group/btn">
            <span>{action}</span>
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
