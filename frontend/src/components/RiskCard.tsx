import { LucideIcon } from "lucide-react";

interface RiskCardProps {
  title: string;
  level: "low" | "moderate" | "high" | "critical" | "extreme";
  probability: number;
  icon: LucideIcon;
}

export default function RiskCard({ title, level, probability, icon: Icon }: RiskCardProps) {
  const getColors = () => {
    switch(level) {
      case "low": return { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" };
      case "moderate": return { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" };
      case "high": return { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" };
      case "critical":
      case "extreme": return { border: "border-red-200", bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-700" };
      default: return { border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-600", badge: "bg-slate-100 text-slate-600" };
    }
  };

  const getLabel = () => {
    return level === "extreme" ? "CRITICAL" : level.toUpperCase();
  };

  const c = getColors();

  return (
    <div className={`p-4 rounded-lg border ${c.border} ${c.bg} flex flex-col justify-between h-28`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${c.text}`} />
          <span className="font-medium text-sm text-slate-700">{title}</span>
        </div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.badge} uppercase tracking-wider`}>
          {getLabel()}
        </div>
      </div>
      
      <div>
        <div className={`text-3xl font-light font-mono tracking-tighter ${c.text}`}>
          {(probability * 100).toFixed(1)}<span className="text-lg opacity-50">%</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Model Probability</div>
      </div>
    </div>
  );
}
