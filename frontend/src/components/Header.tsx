"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, Check, SlidersHorizontal, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocation, POPULAR_LOCATIONS, GeoLocation } from "@/context/LocationContext";
import WeatherIcon, { getWeatherTypeFromTelemetry, WEATHER_LABELS } from "@/components/WeatherIcon";

export default function Header() {
  const pathname = usePathname();
  const { location, setLocation, gridSize, setGridSize, dataMode, refreshSnapshot, isLoading, snapshot } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customLat, setCustomLat] = useState(String(location.lat));
  const [customLon, setCustomLon] = useState(String(location.lon));
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitles: Record<string, { title: string; sub: string }> = {
    "/": { title: "Command Center", sub: "Dynamic Open-Meteo Regional Ingestion · Early Warnings · Operational Decisions" },
    "/map": { title: "Nowcast Map", sub: `Hyperlocal ${gridSize}×${gridSize} Probability Grid · Interactive Spatial Coordinates` },
    "/leafmap": { title: "Spatial Intelligence", sub: "Spatial Grid Ingestion · Interactive Weather Layers · Cell-Level Intelligence" },
    "/meteorology": { title: "Meteorological Drivers & Explainable Risk", sub: "Deep Atmospheric Telemetry · Convective Parameters · XAI Attribution" },
    "/flash-flood": { title: "Flash-Flood Intelligence", sub: "Live Precipitation Inundation × Terrain Vulnerability Matrix" },
    "/alerts": { title: "Operational Warnings & Event Intelligence", sub: "Active Hazard Protocols · Targeted Spatial Warning Dispatch" },
  };

  const current = pageTitles[pathname] || pageTitles["/"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (loc: GeoLocation) => {
    setLocation(loc);
    setCustomLat(String(loc.lat));
    setCustomLon(String(loc.lon));
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setLocation({
        lat,
        lon,
        name: `Custom Grid (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
        state: "Dynamic Center",
      });
      setIsOpen(false);
    }
  };

  return (
    <header className="w-full h-20 bg-page flex items-center justify-between px-8 shrink-0 border-b border-border/60 z-30 relative select-none">
      <div className="flex flex-col">
        <h2 className="text-[22px] font-bold text-navy tracking-tight">{current.title}</h2>
        <div className="text-[12.5px] text-muted font-normal mt-0.5">{current.sub}</div>
      </div>

      <div className="flex items-center space-x-3">

        {/* Dynamic Location & Grid Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2.5 bg-white/95 hover:bg-white px-3.5 py-2 rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all group"
          >
            <div className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <span>Region</span>
                <span className="text-brand font-mono">({gridSize}×{gridSize} Grid)</span>
              </div>
              <div className="text-xs font-bold text-navy max-w-[170px] truncate leading-tight mt-0.5">
                {location.name}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Modal Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-[0_12px_40px_rgba(20,45,100,0.18)] border border-border p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand" /> Spatial Target & Grid
                </span>
                <div className="flex items-center space-x-1 bg-page p-1 rounded-xl border border-border text-[11px] font-mono">
                  {[3, 5, 7].map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                        gridSize === size ? "bg-brand text-white shadow-xs" : "text-muted hover:text-navy"
                      }`}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search preset */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search preset Indian regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-page rounded-xl pl-8 pr-3 py-2 border border-border outline-none focus:border-brand"
                />
              </div>

              {/* Presets List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 mb-3 divide-y divide-border/40">
                {filteredLocations.map((loc) => {
                  const isSelected = loc.name === location.name;
                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelect(loc)}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                        isSelected ? "bg-brand/10 text-brand font-bold" : "hover:bg-page text-navy"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{loc.name}</div>
                        <div className="text-[10px] text-muted">{loc.state} · {loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Coordinates Form */}
              <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-border/70 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Direct Coordinates (Lat / Lon)</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full text-xs bg-page rounded-lg px-2.5 py-1.5 border border-border outline-none font-mono"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="w-full text-xs bg-page rounded-lg px-2.5 py-1.5 border border-border outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-1 bg-brand hover:bg-brand/90 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-xs"
                >
                  Set Target Coordinates
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Live Weather Condition Badge */}
        {snapshot && (
          <div className="hidden sm:flex items-center space-x-2 bg-white/95 px-3 py-1.5 rounded-2xl border border-border/80 shadow-xs">
            <WeatherIcon
              type={getWeatherTypeFromTelemetry(
                snapshot.cloud_cover,
                snapshot.precipitation,
                snapshot.cape
              )}
              size={20}
              darkBadge={true}
              title={`${location.name}: ${WEATHER_LABELS[getWeatherTypeFromTelemetry(snapshot.cloud_cover, snapshot.precipitation, snapshot.cape)]}`}
            />
            <div className="flex flex-col text-left">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted">
                {WEATHER_LABELS[getWeatherTypeFromTelemetry(snapshot.cloud_cover, snapshot.precipitation, snapshot.cape)]}
              </span>
              <span className="text-[11px] font-bold text-navy font-mono">
                {snapshot.temperature_2m.toFixed(1)}°C · {snapshot.precipitation > 0 ? `${snapshot.precipitation.toFixed(1)}mm` : `${snapshot.cloud_cover.toFixed(0)}% cloud`}
              </span>
            </div>
          </div>
        )}

        {/* Live Provider & Refresh Indicator */}
        <div className="flex items-center space-x-2.5 bg-white/95 px-3.5 py-2 rounded-2xl border border-border/80 shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-success">
              {dataMode === "LIVE" ? "● OPEN-METEO LIVE" : "● DEMO FALLBACK"}
            </span>
            <span className="text-[11px] font-bold text-navy truncate max-w-[130px]">
              {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
            </span>
          </div>
          <button
            onClick={() => refreshSnapshot()}
            disabled={isLoading}
            title="Refresh atmospheric snapshot"
            className="p-1 hover:bg-page rounded-lg text-muted hover:text-navy transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
