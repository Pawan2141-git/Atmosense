interface ForecastTimelineProps {
  activeHour: number;
  setActiveHour: (hour: number) => void;
}

export default function ForecastTimeline({ activeHour, setActiveHour }: ForecastTimelineProps) {
  const hours = [2, 3, 4, 5, 6];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center h-full">
      <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-widest">
        <span>Nowcast Window</span>
        <span>+6H Horizon</span>
      </div>
      
      <div className="relative flex items-center justify-between">
        {/* Track */}
        <div className="absolute left-3 right-3 h-1 bg-slate-100 top-1/2 -translate-y-1/2 rounded-full" />
        
        {hours.map(hour => {
          const isActive = activeHour === hour;
          return (
            <button
              key={hour}
              onClick={() => setActiveHour(hour)}
              className="relative z-10 flex flex-col items-center group"
            >
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white ring-2 ring-blue-100" 
                    : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                +{hour}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
