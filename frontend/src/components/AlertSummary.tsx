import { ShieldAlert } from "lucide-react";

export default function AlertSummary() {
  const alerts = [
    {
      id: "ALT-8F92A1",
      hazard: "FLASH FLOOD",
      severity: "EXTREME",
      region: "Chamoli District, Uttarakhand",
      time: "+2H"
    },
    {
      id: "ALT-3B44C9",
      hazard: "CLOUDBURST",
      severity: "SEVERE",
      region: "Kedarnath Valley",
      time: "+3H"
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
        <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-red-500" />
        Active Warnings
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className="p-2.5 border border-red-200 bg-red-50 rounded flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold tracking-wider">
                {alert.severity}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{alert.id}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{alert.hazard}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">{alert.region}</div>
            <div className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-wider">Lead Time: <span className="text-red-600 font-bold">{alert.time}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
