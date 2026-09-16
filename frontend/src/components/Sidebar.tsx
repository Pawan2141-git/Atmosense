"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map as MapIcon, Activity, AlertTriangle, CloudLightning, Waves, Layers3 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const items = [
    { name: "Command Center", href: "/", icon: LayoutDashboard, badge: "Live" },
    { name: "Nowcast Map", href: "/map", icon: MapIcon, badge: null },
    { name: "Spatial Intelligence", href: "/leafmap", icon: Layers3, badge: "New" },
    { name: "Meteorology", href: "/meteorology", icon: Activity, badge: null },
    { name: "Flash-Flood", href: "/flash-flood", icon: Waves, badge: "High" },
    { name: "Alerts & Actions", href: "/alerts", icon: AlertTriangle, badge: "4" },
  ];

  return (
    <div className="w-[230px] h-screen bg-sidebar flex flex-col shrink-0 border-r border-border/80 shadow-[1px_0_16px_rgba(15,35,80,0.03)] z-20 relative select-none">
      {/* Brand Header */}
      <div className="px-6 py-6 flex items-center space-x-3.5 border-b border-border/60">
        <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(40,87,214,0.3)]">
          <CloudLightning className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-[18px] leading-none tracking-tight text-navy">Atmosense</h1>
        </div>
      </div>
      
      {/* Nav List */}
      <div className="flex-1 py-5 flex flex-col gap-1.5 px-3.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-muted/70 uppercase tracking-widest px-3 mb-1">Navigation</div>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.name}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 ${
                active 
                  ? "bg-brand text-white shadow-[0_4px_14px_rgba(40,87,214,0.25)] translate-x-0.5" 
                  : "text-muted hover:text-navy hover:bg-[#F2F6FC]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? "text-white" : "text-muted group-hover:text-navy"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-white/20 text-white"
                      : item.badge === "High"
                      ? "bg-[#FBDADB] text-[#C23948]"
                      : "bg-[#DCEAFB] text-[#3568C4]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Bottom Anchor: System Status */}
      <div className="p-4 mx-3 mb-4 rounded-2xl bg-[#F7FAFD] border border-border/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span className="text-xs font-bold text-navy">System Status</span>
          </div>
        </div>
        
        <div className="space-y-1.5 text-[11px] pt-2 border-t border-border/60">
          <div className="flex justify-between items-center text-muted">
            <span>Radar Layer</span>
            <span className="text-success font-semibold flex items-center">● Radar Layer Available</span>
          </div>
          <div className="flex justify-between items-center text-muted">
            <span>Inference</span>
            <span className="text-success font-semibold flex items-center">● Inference Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
