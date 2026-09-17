export default function MetricsPanel() {
  const metrics = [
    { name: "IWV (Moisture)", value: "58.2", unit: "kg/m²", trend: "+4.1", status: "critical" },
    { name: "CAPE (Instability)", value: "3100", unit: "J/kg", trend: "+400", status: "critical" },
    { name: "CIN (Inhibition)", value: "-12", unit: "J/kg", trend: "+5", status: "high" },
    { name: "Wind Shear", value: "28.5", unit: "m/s", trend: "+2.0", status: "high" },
    { name: "Cloud Top Temp", value: "212", unit: "K", trend: "-12", status: "critical" },
    { name: "QPE (Rainfall)", value: "65.0", unit: "mm/hr", trend: "+15", status: "critical" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "normal": return "text-blue-600";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
        <span>Atmospheric Telemetry</span>
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 border border-slate-200">HOTSPOT AVG</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.name} className="flex flex-col p-2.5 bg-slate-50 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 mb-0.5">{m.name}</span>
            <div className="flex items-end space-x-1">
              <span className={`text-lg font-mono font-semibold ${getStatusColor(m.status)}`}>{m.value}</span>
              <span className="text-[10px] text-slate-400 mb-0.5">{m.unit}</span>
            </div>
            <div className="text-[10px] mt-0.5">
              <span className={m.trend.startsWith("+") ? "text-red-500" : "text-blue-500"}>
                {m.trend} {m.unit}/hr
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
