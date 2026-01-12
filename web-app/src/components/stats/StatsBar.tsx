import { FileText, Link2, Lightbulb, Sparkles, Layers } from "lucide-react";

interface StatItemProps {
  icon: typeof FileText;
  label: string;
  value: number;
  change?: number;
}

function StatItem({ icon: Icon, label, value, change }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-semibold font-mono">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {change !== undefined && (
        <span className={`text-xs font-mono ml-auto ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
  );
}

interface StatsBarProps {
  totalCaptures?: number;
  totalTopics?: number;
  totalResources?: number;
}

export function StatsBar({ totalCaptures = 0, totalTopics = 0, totalResources = 0 }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatItem icon={FileText} label="Total Captures" value={totalCaptures} />
      <StatItem icon={Layers} label="Topics" value={totalTopics} />
      <StatItem icon={Link2} label="Resources" value={totalResources} />
    </div>
  );
}
