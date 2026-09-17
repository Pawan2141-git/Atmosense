"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Compass,
  Zap,
  CloudRain,
  Waves,
  ShieldAlert,
  Sparkles,
  Wind,
  Thermometer,
  Droplets,
  RefreshCw,
  Layers,
  ArrowRight,
} from "lucide-react";
import LeafletMapContainer from "@/components/LeafletMapContainer";
import type { MapMetric } from "@/components/LeafletMap";
import SeverityBadge from "@/components/SeverityBadge";
import { useLocation } from "@/context/LocationContext";
import WeatherIcon, { getWeatherTypeFromTelemetry, WEATHER_LABELS } from "@/components/WeatherIcon";
import {
  fetchOpenMeteoGrid,
  getAtmosphericSnapshot,
  getXAIExplanation,
  GridCell,
  OpenMeteoGridData,
  AtmosphericSnapshot,
  XAIExplanation,
} from "@/lib/api";

export default function LeafMapPage() {
  const { location, setLocation, gridSize, dataMode } = useLocation();

  // Active Map State
  const [activeCenter, setActiveCenter] = useState<[number, number]>([location.lat, location.lon]);
  const [gridData, setGridData] = useState<OpenMeteoGridData | null>(null);
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [activeMetric, setActiveMetric] = useState<MapMetric>("risk");
  const [selectedHorizon, setSelectedHorizon] = useState<string>("+4H");
  const [loadingGrid, setLoadingGrid] = useState(true);

  // Synchronized Output State according to Map
  const [activeWeather, setActiveWeather] = useState<AtmosphericSnapshot | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [xaiData, setXaiData] = useState<XAIExplanation | null>(null);
  const [loadingXAI, setLoadingXAI] = useState(false);

  // Computed Hazard Probabilities for current map point
  const [hazardScores, setHazardScores] = useState({
    thunderstorm: 65,
    cloudburst: 78,
    flashFlood: 72,
    severity: "high" as "critical" | "high" | "moderate" | "low",
  });

  const horizons = ["+2H", "+3H", "+4H", "+5H", "+6H"];

  // When location changes from Header or presets, sync map center and load grid
  useEffect(() => {
    setActiveCenter([location.lat, location.lon]);
    loadMapGrid(location.lat, location.lon);
    loadPointTelemetry(location.lat, location.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lon, gridSize]);

  async function loadMapGrid(lat: number, lon: number) {
    setLoadingGrid(true);
    try {
      const data = await fetchOpenMeteoGrid(lat, lon, gridSize || 7);
      setGridData(data);
      // Automatically select center cell
      if (data.cells && data.cells.length > 0) {
        const midIdx = Math.floor(data.cells.length / 2);
        setSelectedCell(data.cells[midIdx]);
      }
    } catch (e) {
      console.warn("Grid fetch error:", e);
    } finally {
      setLoadingGrid(false);
    }
  }

  async function loadPointTelemetry(lat: number, lon: number) {
    setLoadingWeather(true);
    setLoadingXAI(true);
    const forecastHourNum = Number(selectedHorizon.replace("+", "").replace("H", ""));

    try {
      // 1. Fetch live atmospheric snapshot for this exact map coordinate
      const snap = await getAtmosphericSnapshot(lat, lon);
      setActiveWeather(snap);

      // Dynamically compute hazard scores from live readings
      const cape = snap.cape ?? 1800;
      const rain = snap.precipitation ?? 14;
      const rh = snap.relative_humidity_2m ?? 75;

      const tScore = Math.min(96, Math.max(25, Math.round((cape / 2600) * 85 + (rh / 100) * 15)));
      const cScore = Math.min(95, Math.max(20, Math.round((rain / 30) * 75 + (cape / 2600) * 25)));
      const fScore = Math.min(94, Math.max(20, Math.round((rain / 25) * 80 + 15)));

      const maxScore = Math.max(tScore, cScore, fScore);
      const sev: "critical" | "high" | "moderate" | "low" =
        maxScore > 80 ? "critical" : maxScore > 60 ? "high" : maxScore > 40 ? "moderate" : "low";

      setHazardScores({
        thunderstorm: tScore,
        cloudburst: cScore,
        flashFlood: fScore,
        severity: sev,
      });

      // 2. Fetch Explainable AI attribution for this coordinate
      const xai = await getXAIExplanation(lat, lon, "cloudburst", forecastHourNum);
      setXaiData(xai);
    } catch (err) {
      console.warn("Error loading telemetry for map point:", err);
    } finally {
      setLoadingWeather(false);
      setLoadingXAI(false);
    }
  }

  // Handle when user clicks ANYWHERE on the Leaflet map or a specific cell
  const handleMapCoordSelect = (lat: number, lon: number) => {
    setActiveCenter([lat, lon]);

    // Update global LocationContext so ALL tabs / views in the app reflect this map point
    setLocation({
      lat,
      lon,
      name: `Sector (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
      state: "Leafmap Interactive Coordinate",
    });

    loadPointTelemetry(lat, lon);
  };

  const handleCellSelect = (cell: GridCell) => {
    setSelectedCell(cell);
    handleMapCoordSelect(cell.lat, cell.lon);
  };

  return (
    <div className="space-y-6 pb-14 max-w-[1680px] mx-auto animate-in fade-in duration-300">
      {/* Top Bar Header & Controls */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base font-extrabold text-navy tracking-tight">Spatial Intelligence</h2>
              <span className="text-[11px] font-mono font-bold bg-brand/10 text-brand px-2.5 py-0.5 rounded-full border border-brand/20">
                {activeCenter[0].toFixed(3)}°N, {activeCenter[1].toFixed(3)}°E
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Open-Meteo ({dataMode})
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Interactive 0.25° GIS raster grid with synchronized hyperlocal telemetry & XAI risk output.
            </p>
          </div>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center space-x-2 bg-page p-1.5 rounded-xl border border-border">
          <span className="text-xs font-bold text-muted px-2 uppercase tracking-wider">Horizon:</span>
          {horizons.map((h) => (
            <button
              key={h}
              onClick={() => {
                setSelectedHorizon(h);
                loadPointTelemetry(activeCenter[0], activeCenter[1]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedHorizon === h
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-navy hover:bg-white/60"
              }`}
            >
              {h}
            </button>
          ))}
          <button
            onClick={() => {
              loadMapGrid(activeCenter[0], activeCenter[1]);
              loadPointTelemetry(activeCenter[0], activeCenter[1]);
            }}
            title="Refresh Map & Telemetry"
            className="p-1.5 bg-white border border-border rounded-lg text-muted hover:text-navy hover:bg-page transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingGrid || loadingWeather ? "animate-spin text-brand" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Map (8 cols) + Synchronized Output Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Interactive Leaflet Map */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Active GIS Raster Layer ({gridSize}×{gridSize} Regional Cells)
                </h3>
              </div>
              <div className="flex items-center space-x-1.5 bg-page/80 p-1 rounded-xl border border-border">
                {(
                  [
                    { id: "risk", label: "Multi-Risk" },
                    { id: "cape", label: "CAPE" },
                    { id: "precipitation", label: "Rain" },
                    { id: "wind", label: "Wind" },
                    { id: "temp", label: "Temp" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMetric(m.id)}
                    className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                      activeMetric === m.id
                        ? "bg-brand text-white shadow-xs"
                        : "text-muted hover:text-navy hover:bg-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaflet Map Display */}
            <div className="h-[620px] w-full rounded-2xl overflow-hidden relative">
              <LeafletMapContainer
                gridData={gridData}
                center={activeCenter}
                zoom={9}
                metric={activeMetric}
                selectedCell={selectedCell}
                onSelectCell={handleCellSelect}
                onSelectCoords={handleMapCoordSelect}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Micro Grid Matrix Table (All 49 Cells quick access) */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Spatial Grid Matrix (Click to Jump & Recalculate Output)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-muted">
                {gridData?.cells?.length ?? 0} Active Nodes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-56 overflow-y-auto pr-1">
              {gridData?.cells?.map((cell, idx) => {
                const isSelected = selectedCell?.lat === cell.lat && selectedCell?.lon === cell.lon;
                return (
                  <button
                    key={`matrix-node-${cell.lat}-${cell.lon}-${idx}`}
                    onClick={() => handleCellSelect(cell)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-brand text-white border-brand shadow-sm scale-102"
                        : "bg-page/70 border-border/80 hover:bg-white hover:border-brand/40 text-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9.5px] font-mono font-bold ${isSelected ? "text-white/80" : "text-muted"}`}>
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : cell.risk_level === "critical"
                            ? "bg-red-100 text-red-700"
                            : cell.risk_level === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {cell.risk_level}
                      </span>
                    </div>
                    <div className={`text-[11px] font-bold font-mono ${isSelected ? "text-white" : "text-navy"}`}>
                      {cell.lat.toFixed(2)}°, {cell.lon.toFixed(2)}°
                    </div>
                    <div className={`text-[10px] mt-0.5 flex justify-between ${isSelected ? "text-white/90" : "text-muted"}`}>
                      <span>CAPE: {cell.cape}</span>
                      <span>{cell.precipitation}mm</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Entire Output Synchronized with Map */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Target Card */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <div className="flex items-start justify-between mb-3.5 pb-3 border-b border-border">
              <div>
                <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider block">
                  Map Synchronized Focus
                </span>
                <h3 className="text-base font-extrabold text-navy tracking-tight mt-0.5">
                  Sector {activeCenter[0].toFixed(3)}°N, {activeCenter[1].toFixed(3)}°E
                </h3>
                <span className="text-xs text-muted">
                  {location.name || "Target Field Coordinate"}
                </span>
              </div>
              <SeverityBadge level={hazardScores.severity} />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-page/80 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Surface Elevation</span>
                <strong className="font-mono text-sm text-navy">{activeWeather?.elevation_m ?? 680} m</strong>
              </div>
              <div className="bg-page/80 p-2.5 rounded-xl border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Horizon Window</span>
                <strong className="font-mono text-sm text-brand">{selectedHorizon} Projection</strong>
              </div>
            </div>
          </div>

          {/* Hyperlocal Atmospheric Telemetry (Live from Open-Meteo for this Map Point) */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border">
              <div className="flex items-center space-x-2.5">
                {activeWeather && (
                  <WeatherIcon
                    type={getWeatherTypeFromTelemetry(
                      activeWeather.cloud_cover,
                      activeWeather.precipitation,
                      activeWeather.cape
                    )}
                    size={22}
                    darkBadge={true}
                    title={WEATHER_LABELS[getWeatherTypeFromTelemetry(activeWeather.cloud_cover, activeWeather.precipitation, activeWeather.cape)]}
                  />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Atmospheric Telemetry (Map Point)
                  </h4>
                  {activeWeather && (
                    <span className="text-[10.5px] font-mono text-brand font-semibold block">
                      {WEATHER_LABELS[getWeatherTypeFromTelemetry(activeWeather.cloud_cover, activeWeather.precipitation, activeWeather.cape)]}
                    </span>
                  )}
                </div>
              </div>
              {loadingWeather && <span className="text-[10px] font-mono text-brand animate-pulse">Syncing...</span>}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-page/60 p-3 rounded-xl border border-border">
                <div className="flex items-center space-x-1.5 text-muted mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10.5px] font-medium">Temperature</span>
                </div>
                <div className="text-lg font-bold font-mono text-navy">
                  {activeWeather?.temperature_2m.toFixed(1) ?? "24.5"} <span className="text-xs text-muted">°C</span>
                </div>
              </div>

              <div className="bg-page/60 p-3 rounded-xl border border-border">
                <div className="flex items-center space-x-1.5 text-muted mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10.5px] font-medium">Humidity</span>
                </div>
                <div className="text-lg font-bold font-mono text-navy">
                  {activeWeather?.relative_humidity_2m.toFixed(0) ?? "82"} <span className="text-xs text-muted">%</span>
                </div>
              </div>

              <div className="bg-page/60 p-3 rounded-xl border border-border">
                <div className="flex items-center space-x-1.5 text-muted mb-1">
                  <Wind className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10.5px] font-medium">10m Wind</span>
                </div>
                <div className="text-lg font-bold font-mono text-navy">
                  {activeWeather?.wind_speed_10m.toFixed(1) ?? "18.2"} <span className="text-xs text-muted">km/h</span>
                </div>
              </div>

              <div className="bg-page/60 p-3 rounded-xl border border-border">
                <div className="flex items-center space-x-1.5 text-muted mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10.5px] font-medium">Hourly Rain</span>
                </div>
                <div className="text-lg font-bold font-mono text-navy">
                  {activeWeather?.precipitation.toFixed(1) ?? "12.4"} <span className="text-xs text-muted">mm</span>
                </div>
              </div>

              <div className="bg-page/60 p-3 rounded-xl border border-border col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 text-muted">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[10.5px] font-medium">Convective Available Potential Energy (CAPE)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700">
                    {activeWeather?.cape.toFixed(0) ?? "1850"} J/kg
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 via-amber-400 to-purple-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((activeWeather?.cape ?? 1850) / 3000) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Hazard Risk Forecast for this Point */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3 pb-2 border-b border-border">
              Nowcast Hazard Probabilities ({selectedHorizon})
            </h4>

            <div className="space-y-3">
              {/* Thunderstorm */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-bold text-navy">Severe Thunderstorm</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">{hazardScores.thunderstorm}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${hazardScores.thunderstorm}%` }}
                  ></div>
                </div>
              </div>

              {/* Cloudburst */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center space-x-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-bold text-navy">Localized Cloudburst</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600">{hazardScores.cloudburst}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${hazardScores.cloudburst}%` }}
                  ></div>
                </div>
              </div>

              {/* Flash Flood */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Waves className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-navy">Flash-Flood Inundation</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">{hazardScores.flashFlood}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${hazardScores.flashFlood}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable AI (XAI) Attribution for Map Coordinate */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  XAI Key Risk Drivers
                </h4>
              </div>
              <span className="text-[10px] font-mono text-muted">Risk Driver Attribution</span>
            </div>

            {loadingXAI ? (
              <div className="text-xs text-muted font-mono animate-pulse py-3">Computing neural attributions for coordinate...</div>
            ) : xaiData && Array.isArray(xaiData.feature_attributions) && xaiData.feature_attributions.length > 0 ? (
              <div className="space-y-2 text-xs">
                {xaiData.feature_attributions.slice(0, 4).map((f) => (
                  <div key={f.feature_name} className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-slate-600 font-medium">{f.display_name}</span>
                    <span className="font-mono font-bold text-navy">
                      {f.value} {f.unit} ({f.attribution_weight}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-slate-600">Convective Buoyancy</span>
                  <span className="font-mono font-bold text-navy">{activeWeather?.cape ?? 1850} J/kg</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-slate-600">Moisture Convergence</span>
                  <span className="font-mono font-bold text-navy">{activeWeather?.relative_humidity_2m ?? 82}% RH</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Precipitation Rate (QPE)</span>
                  <span className="font-mono font-bold text-navy">{activeWeather?.precipitation ?? 12.4} mm/h</span>
                </div>
              </div>
            )}
          </div>

          {/* Civil Defense Directive for this Map Point */}
          <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/50 p-4 rounded-2xl border border-rose-200/80 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Civil Defense Action Recommendation</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {hazardScores.severity === "critical"
                ? `Immediate trigger of floodgates and low-lying evacuation advisory around ${activeCenter[0].toFixed(2)}°N, ${activeCenter[1].toFixed(2)}°E.`
                : `Monitor convective radar returns over this sector. Pre-position quick response drainage units for the ${selectedHorizon} window.`}
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-rose-200/60">
              <Link
                href="/alerts"
                className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center space-x-1"
              >
                <span>Open Emergency Broadcast</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/meteorology"
                className="text-xs font-bold text-brand hover:underline"
              >
                Full Sounding &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
