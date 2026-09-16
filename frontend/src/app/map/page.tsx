"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Layers, MapPin, ArrowRight, Compass, Sparkles } from "lucide-react";
import SeverityBadge from "@/components/SeverityBadge";
import OSMIndiaMapContainer from "@/components/OSMIndiaMapContainer";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "@/context/LocationContext";
import { getXAIExplanation, XAIExplanation, getPredictions, getAtmosphericSnapshot } from "@/lib/api";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type LayerType = "thunderstorm" | "cloudburst" | "flash_flood";

interface GridNode {
  id: string;
  coords: string;
  lat: number;
  lon: number;
  risk: "low" | "moderate" | "high" | "critical";
  thunderstorm: string;
  cloudburst: string;
  flashFlood: string;
  elevation: string;
  soilMoisture: string;
  qpe: string;
}

const HORIZONS = ["+2H", "+3H", "+4H", "+5H", "+6H"];

function NowcastMapContent() {
  const { location, gridSize, dataMode } = useLocation();
  const searchParams = useSearchParams();
  const [selectedHorizon, setSelectedHorizon] = useState<string>("+4H");
  const [activeLayer, setActiveLayer] = useState<LayerType>("cloudburst");
  const [showSatellite, setShowSatellite] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GridNode | null>(null);
  const [xaiData, setXaiData] = useState<XAIExplanation | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(false);

  // Ref to track the currently selected lat/lon to avoid stale closures
  const selectedCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // Fetch real prediction + atmospheric + XAI data for the selected cell and horizon
  const fetchCellData = useCallback(async (lat: number, lon: number, horizonStr: string, hazardType: string) => {
    const forecastHourNum = Number(horizonStr.replace("+", "").replace("H", ""));
    selectedCoordsRef.current = { lat, lon };
    setLoadingPanel(true);
    // Clear stale values immediately
    setSelectedNode(null);
    setXaiData(null);

    try {
      // Fetch predictions for this cell from existing API endpoints concurrently
      const [predResponse, snapResponse, xaiResponse] = await Promise.allSettled([
        getPredictions(forecastHourNum, lat, lon, 1),
        getAtmosphericSnapshot(lat, lon),
        getXAIExplanation(lat, lon, hazardType, forecastHourNum)
      ]);

      // If coords changed while fetching, discard
      if (
        selectedCoordsRef.current?.lat !== lat ||
        selectedCoordsRef.current?.lon !== lon
      ) return;

      if (xaiResponse.status === "fulfilled" && xaiResponse.value) {
        setXaiData(xaiResponse.value);
      }

      // Parse predictions
      let cloudburstProb = "—";
      let thunderstormProb = "—";
      let flashFloodProb = "—";
      let risk: GridNode["risk"] = "moderate";

      if (predResponse.status === "fulfilled" && predResponse.value) {
        const predData = predResponse.value;
        // Find the closest cell to the selected lat/lon
        const cells = predData.cells || [];
        let closestCell = cells[0];
        let minDist = Infinity;
        for (const cell of cells) {
          const d = Math.abs(cell.lat - lat) + Math.abs(cell.lon - lon);
          if (d < minDist) { minDist = d; closestCell = cell; }
        }
        if (closestCell) {
          const cb = closestCell.predictions?.cloudburst;
          const ts = closestCell.predictions?.thunderstorm;
          const ff = closestCell.predictions?.flash_flood;
          if (cb) cloudburstProb = `${Math.round(cb.probability * 100)}%`;
          if (ts) thunderstormProb = `${Math.round(ts.probability * 100)}%`;
          if (ff) flashFloodProb = `${Math.round(ff.probability * 100)}%`;

          // Determine overall risk from active layer
          const activePred = hazardType === "cloudburst" ? cb : hazardType === "thunderstorm" ? ts : ff;
          if (activePred) {
            const p = activePred.probability;
            risk = p > 0.8 ? "critical" : p > 0.6 ? "high" : p > 0.4 ? "moderate" : "low";
          }
        }
      }

      // Parse atmospheric snapshot for QPE / elevation
      let qpe = "—";
      let elevation = "—";
      if (snapResponse.status === "fulfilled") {
        const snap = snapResponse.value;
        qpe = `${snap.precipitation.toFixed(1)} mm/hr`;
        elevation = `${Math.round(snap.elevation_m)} m`;
      }

      setSelectedNode({
        id: `GRID-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        coords: `${lat.toFixed(4)}°N | ${lon.toFixed(4)}°E`,
        lat,
        lon,
        risk,
        cloudburst: cloudburstProb,
        thunderstorm: thunderstormProb,
        flashFlood: flashFloodProb,
        elevation,
        soilMoisture: "—",
        qpe,
      });
    } catch (err) {
      console.error("Cell data fetch error", err);
    } finally {
      if (
        selectedCoordsRef.current?.lat === lat &&
        selectedCoordsRef.current?.lon === lon
      ) {
        setLoadingPanel(false);
      }
    }
  }, []);

  useEffect(() => {
    let layer = activeLayer;
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const hazardParam = searchParams.get("hazard");
    const horizonParam = searchParams.get("horizon");

    if (hazardParam) {
      const h = hazardParam.toLowerCase();
      if (h.includes("thunderstorm")) { setActiveLayer("thunderstorm"); layer = "thunderstorm"; }
      else if (h.includes("flash")) { setActiveLayer("flash_flood"); layer = "flash_flood"; }
      else if (h.includes("cloudburst")) { setActiveLayer("cloudburst"); layer = "cloudburst"; }
    }

    let horizon = "+4H";
    if (horizonParam) {
      const formatted = horizonParam.startsWith("+") ? horizonParam : `+${horizonParam.replace("H", "")}H`;
      if (HORIZONS.includes(formatted)) {
        setSelectedHorizon(formatted);
        horizon = formatted;
      }
    }

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        fetchCellData(lat, lon, horizon, layer);
      }
    }
  }, [searchParams, fetchCellData]);

  // Re-fetch when forecast horizon or hazard layer changes and a cell is already selected
  useEffect(() => {
    if (selectedCoordsRef.current) {
      const { lat, lon } = selectedCoordsRef.current;
      fetchCellData(lat, lon, selectedHorizon, activeLayer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHorizon, activeLayer]);

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto animate-in fade-in duration-300" suppressHydrationWarning>
      {/* Top Bar Controls */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-navy">Hyperlocal Probability Field</h3>
              <span className="text-[10.5px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full border border-brand/20">
                {location.name} ({gridSize}×{gridSize} Grid)
              </span>
            </div>
            <p className="text-xs text-muted">0.25° Spatial Grid Resolution with Open-Meteo Live Atmospheric Ingestion</p>
          </div>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center space-x-2 bg-page p-1.5 rounded-xl border border-border">
          <span className="text-xs font-bold text-muted px-2 uppercase tracking-wider">Horizon:</span>
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedHorizon === h
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-navy hover:bg-white/60"
              }`}
            >
              {h}
            </button>
          ))}
          <span className="text-[11px] font-bold text-brand ml-2 px-2.5 py-1 bg-brand/10 rounded-lg">
            ● {selectedHorizon} FORECAST
          </span>
        </div>
      </div>

      {/* Main Map Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hazard Layers & Controls */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-border">
              <Layers className="w-4 h-4 text-brand" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Hazard Layers</h4>
            </div>

            <div className="space-y-2.5">
              {[
                { key: "thunderstorm", label: "Thunderstorm", color: "bg-chart-a" },
                { key: "cloudburst", label: "Cloudburst", color: "bg-chart-b" },
                { key: "flash_flood", label: "Flash Flood", color: "bg-chart-c" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveLayer(item.key as LayerType)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                    activeLayer === item.key
                      ? "bg-brand/5 border-brand text-brand shadow-[0_2px_8px_rgba(40,87,214,0.12)] translate-x-1"
                      : "bg-white border-border text-muted hover:text-navy hover:bg-page"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        activeLayer === item.key ? item.color : "bg-slate-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {activeLayer === item.key && (
                    <span className="text-[10px] font-mono bg-brand text-white px-2 py-0.5 rounded-full shadow-xs">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>

            {/* Observation Feed */}
            <div className="mt-5 pt-4 border-t border-border" suppressHydrationWarning>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5" suppressHydrationWarning>
                Observation Feed
              </h4>
              <button
                onClick={() => setShowSatellite(!showSatellite)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                  showSatellite
                    ? "bg-brand/5 border-brand text-brand shadow-[0_2px_8px_rgba(40,87,214,0.12)] translate-x-1"
                    : "bg-white border-border text-muted hover:text-navy hover:bg-page"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                      showSatellite ? "bg-brand" : "bg-slate-300"
                    }`}
                  />
                  <span>Cloud Overlay</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                    showSatellite
                      ? "bg-brand text-white shadow-xs"
                      : "bg-[#E8EEF5] text-[#64748B]"
                  }`}
                >
                  {showSatellite ? "ACTIVE" : "OFF"}
                </span>
              </button>
              <button
                onClick={() => setShowRadar(!showRadar)}
                className={`w-full mt-2 flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                  showRadar
                    ? "bg-brand/5 border-brand text-brand shadow-[0_2px_8px_rgba(40,87,214,0.12)] translate-x-1"
                    : "bg-white border-border text-muted hover:text-navy hover:bg-page"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${showRadar ? "bg-brand" : "bg-slate-300"}`} />
                  <span>Radar</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full transition-colors ${showRadar ? "bg-brand text-white shadow-xs" : "bg-[#E8EEF5] text-[#64748B]"}`}>
                  {showRadar ? "ACTIVE" : "OFF"}
                </span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-border text-[11px] text-muted space-y-2">
              <div className="flex justify-between">
                <span>Model Horizon</span>
                <span className="font-mono text-navy font-bold">{selectedHorizon}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Ingestion</span>
                <span className="font-mono text-success font-bold flex items-center gap-1">
                  ● Open-Meteo ({dataMode})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Grid Resolution</span>
                <span className="font-mono text-navy font-bold">{gridSize}×{gridSize} (0.25°)</span>
              </div>
            </div>
          </div>

          {/* Probability Scale Card */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border card-hover-effect">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">Probability Scale</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <span className="w-3 h-3 rounded bg-[#B12433] mr-2 shadow-xs" /> &gt; 80%
                </span>
                <SeverityBadge level="critical" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <span className="w-3 h-3 rounded bg-[#C23948] mr-2 shadow-xs" /> 60% – 80%
                </span>
                <SeverityBadge level="high" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <span className="w-3 h-3 rounded bg-[#8A6A1E] mr-2 shadow-xs" /> 40% – 60%
                </span>
                <SeverityBadge level="moderate" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <span className="w-3 h-3 rounded bg-[#3568C4] mr-2 shadow-xs" /> 20% – 40%
                </span>
                <SeverityBadge level="low" />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Interactive OpenStreetMap (OSM) India Canvas */}
        <div className="lg:col-span-6 bg-card rounded-2xl p-5 shadow-card border border-border flex flex-col justify-between h-[640px] card-hover-effect">
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border flex flex-col justify-between shadow-inner">
            <OSMIndiaMapContainer
              compact={false}
              activeHazard={activeLayer}
              forecastHour={Number(selectedHorizon.replace("+", "").replace("H", ""))}
              selectedLocation={selectedNode ? { lat: selectedNode.lat, lon: selectedNode.lon } : { lat: location.lat, lon: location.lon }}
              showSatellite={showSatellite}
              onToggleSatellite={setShowSatellite}
              showRadar={showRadar}
              onToggleRadar={setShowRadar}
              onSelectHotspot={(hotspot) => {
                fetchCellData(hotspot.lat, hotspot.lon, selectedHorizon, activeLayer);
              }}
            />

          </div>
        </div>

        {/* Right Column: Selected Location Detail Card & XAI Explanations */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-5 card-hover-effect">
            <div>
              <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Inspection Panel</span>
              <h4 className="text-base font-bold text-navy mt-0.5">Selected Grid Cell</h4>
            </div>

            {loadingPanel ? (
              <div className="text-xs text-muted font-mono animate-pulse py-6 text-center">Loading cell data...</div>
            ) : selectedNode ? (
              <>
                <div className="flex items-center space-x-2 text-xs font-mono text-muted bg-page px-3 py-1.5 rounded-xl border border-border">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span className="truncate">{selectedNode.coords}</span>
                </div>

                {/* Risk & Probabilities */}
                <div className="p-4 rounded-xl bg-[#F7FBFE] border border-border space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-semibold text-muted">Overall Threat</span>
                    <SeverityBadge level={selectedNode.risk} />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-medium">Cloudburst Prob</span>
                    <span className="font-mono font-extrabold text-navy">{selectedNode.cloudburst}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-medium">Thunderstorm Prob</span>
                    <span className="font-mono font-extrabold text-navy">{selectedNode.thunderstorm}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-medium">Flash Flood Risk</span>
                    <span className="font-mono font-extrabold text-navy">{selectedNode.flashFlood}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-medium">Rainfall (QPE)</span>
                    <span className="font-mono font-bold text-brand">{selectedNode.qpe}</span>
                  </div>
                </div>

                {/* XAI Attribution Summary */}
                <div className="bg-page/80 p-3.5 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Key Risk Drivers
                    </span>
                    <span className="text-[10px] font-mono text-muted">XAI Engine</span>
                  </div>
                  {xaiData && Array.isArray(xaiData.feature_attributions) && xaiData.feature_attributions.length > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      {xaiData.feature_attributions.slice(0, 3).map((f) => (
                        <div key={f.feature_name} className="flex justify-between items-center">
                          <span className="text-slate-600 text-[11px]">{f.display_name}</span>
                          <span className="font-mono font-bold text-navy text-[11px]">{f.value} {f.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted text-center py-3 italic bg-slate-50/50 rounded-lg border border-slate-100">
                      Risk driver details currently unavailable for this cell.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState title="No Grid Cell Selected" subtitle="Click any marker or area in the 7×7 grid to inspect detailed telemetry." className="py-6" />
            )}

            {/* Quick Action Navigation Links */}
            <div className="space-y-2.5 pt-2 relative z-10">
              <Link
                href={selectedNode ? `/meteorology?lat=${selectedNode.lat}&lon=${selectedNode.lon}` : "/meteorology"}
                className="w-full bg-brand hover:bg-brand/90 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-all shadow-[0_4px_12px_rgba(40,87,214,0.25)] cursor-pointer select-none active:scale-[0.98]"
              >
                <span>Atmospheric Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={selectedNode ? `/flash-flood?lat=${selectedNode.lat}&lon=${selectedNode.lon}` : "/flash-flood"}
                className="w-full bg-white hover:bg-page border border-border text-brand font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none active:scale-[0.98]"
              >
                <span>Assess Flood Drainage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/alerts"
                className="w-full bg-white hover:bg-page border border-border text-navy font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none active:scale-[0.98]"
              >
                <span>View Operational Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NowcastMapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted font-mono">Loading Nowcast Map...</div>}>
      <NowcastMapContent />
    </Suspense>
  );
}
