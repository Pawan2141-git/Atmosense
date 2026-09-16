import { Clock, ShieldAlert, Wifi } from "lucide-react";

export default function Topbar() {
  const timeString = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-base font-semibold text-slate-800 tracking-tight">Emergency Command Center</h2>
        
        <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Demo</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-5 text-sm">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{timeString}</span>
        </div>
        
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Wifi className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs">Telemetry Active</span>
        </div>

        <button className="flex items-center space-x-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100 transition-colors">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Issue Override</span>
        </button>
      </div>
    </header>
  );
}
