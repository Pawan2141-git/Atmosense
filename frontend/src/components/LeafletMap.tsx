"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Rectangle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Crosshair } from "lucide-react";
import type { GridCell, OpenMeteoGridData } from "@/lib/api";


export type MapMetric = "risk" | "cape" | "precipitation" | "wind" | "temp";

interface LeafletMapProps {
  gridData: OpenMeteoGridData | null;
  center: [number, number];
  zoom?: number;
  metric?: MapMetric;
  selectedCell?: GridCell | null;
  onSelectCell?: (cell: GridCell) => void;
  onSelectCoords?: (lat: number, lon: number) => void;
  className?: string;
}

// Controller to smoothly update map view when center/zoom changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Global map click detector for arbitrary coordinates
function MapClickObserver({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    },
  });
  return null;
}

// Vector SVG crosshair marker for active target
function createTargetCrosshairIcon() {
  return L.divIcon({
    className: "custom-leaflet-target-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; border: 2px dashed #2857D6; border-radius: 50%; animation: spin 8s linear infinite;"></div>
        <div style="position: absolute; width: 28px; height: 28px; background: rgba(40, 87, 214, 0.2); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; background: #2857D6; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 14px rgba(40, 87, 214, 0.9); z-index: 10;"></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

// Dynamic color computation according to chosen atmospheric metric
function getMetricColor(cell: GridCell, metric: MapMetric): { fill: string; stroke: string; opacity: number } {
  switch (metric) {
    case "cape": {
      const cape = cell.cape ?? 0;
      if (cape > 2200) return { fill: "#9333EA", stroke: "#7E22CE", opacity: 0.55 }; // Extreme (violet)
      if (cape > 1500) return { fill: "#EF4444", stroke: "#DC2626", opacity: 0.45 }; // High (red)
      if (cape > 900) return { fill: "#F59E0B", stroke: "#D97706", opacity: 0.35 }; // Moderate (amber)
      if (cape > 400) return { fill: "#10B981", stroke: "#059669", opacity: 0.25 }; // Low (emerald)
      return { fill: "#3B82F6", stroke: "#2563EB", opacity: 0.15 }; // Weak (blue)
    }
    case "precipitation": {
      const p = cell.precipitation ?? 0;
      if (p > 25) return { fill: "#1E3A8A", stroke: "#172554", opacity: 0.6 }; // Torrential (deep blue)
      if (p > 15) return { fill: "#2563EB", stroke: "#1D4ED8", opacity: 0.5 }; // Heavy
      if (p > 5) return { fill: "#38BDF8", stroke: "#0284C7", opacity: 0.35 }; // Moderate
      if (p > 0.5) return { fill: "#7DD3FC", stroke: "#38BDF8", opacity: 0.25 }; // Light
      return { fill: "#E2E8F0", stroke: "#CBD5E1", opacity: 0.1 }; // Trace/None
    }
    case "wind": {
      const w = cell.wind_speed_10m ?? 0;
      if (w > 30) return { fill: "#DC2626", stroke: "#B91C1C", opacity: 0.5 };
      if (w > 20) return { fill: "#EA580C", stroke: "#C2410C", opacity: 0.4 };
      if (w > 12) return { fill: "#FBBF24", stroke: "#D97706", opacity: 0.3 };
      return { fill: "#34D399", stroke: "#059669", opacity: 0.2 };
    }
    case "temp": {
      const t = cell.temperature_2m ?? 20;
      if (t > 35) return { fill: "#DC2626", stroke: "#991B1B", opacity: 0.5 };
      if (t > 28) return { fill: "#F97316", stroke: "#C2410C", opacity: 0.4 };
      if (t > 20) return { fill: "#FBBF24", stroke: "#B45309", opacity: 0.3 };
      if (t > 10) return { fill: "#60A5FA", stroke: "#2563EB", opacity: 0.25 };
      return { fill: "#38BDF8", stroke: "#0284C7", opacity: 0.35 };
    }
    case "risk":
    default: {
      if (cell.risk_level === "critical") return { fill: "#DC2626", stroke: "#B91C1C", opacity: 0.5 };
      if (cell.risk_level === "high") return { fill: "#F97316", stroke: "#EA580C", opacity: 0.4 };
      if (cell.risk_level === "moderate") return { fill: "#FBBF24", stroke: "#D97706", opacity: 0.3 };
      return { fill: "#3B82F6", stroke: "#2563EB", opacity: 0.18 };
    }
  }
}

export default function LeafletMap({
  gridData,
  center,
  zoom = 9,
  metric = "risk",
  selectedCell,
  onSelectCell,
  onSelectCoords,
  className = "w-full h-full min-h-[500px]",
}: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MapMetric>(metric);
  const [basemap, setBasemap] = useState<"osm" | "dark" | "satellite">("osm");
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveMetric(metric);
  }, [metric]);

  if (!mounted) {
    return (
      <div className={`bg-[#EAF1FA] flex flex-col items-center justify-center rounded-2xl border border-border ${className}`}>
        <div className="w-10 h-10 rounded-full border-3 border-brand border-t-transparent animate-spin mb-3"></div>
        <span className="text-xs font-mono font-bold text-muted">Initializing High-Resolution Leaflet GIS Radar...</span>
      </div>
    );
  }

  const cellSize = 0.23; // Size of 0.25° grid polygon with small visual gutter

  // Tile layers URLs
  const basemapUrls = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  };

  const handleCellClick = (cell: GridCell) => {
    onSelectCell?.(cell);
    onSelectCoords?.(cell.lat, cell.lon);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-inner border border-border select-none ${className}`}>



      {/* Top-Right Controls: Basemap Switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-card border border-border">
          {(
            [
              { id: "osm", label: "Street" },
              { id: "satellite", label: "Satellite" },
              { id: "dark", label: "Dark" },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              onClick={() => setBasemap(b.id)}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                basemap === b.id
                  ? "bg-navy text-white shadow-xs"
                  : "text-muted hover:text-navy"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>



      {/* Main Leaflet Map Engine */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        {onSelectCoords && <MapClickObserver onMapClick={onSelectCoords} />}

        {/* Selected Tile Layer */}
        <TileLayer url={basemapUrls[basemap]} maxZoom={18} />



        {/* Grid Cells Choropleth Polygon Mesh */}
        {gridData?.cells?.map((cell, idx) => {
          const colors = getMetricColor(cell, activeMetric);
          const isSelected =
            selectedCell?.lat === cell.lat && selectedCell?.lon === cell.lon;
          const half = cellSize / 2;

          return (
            <Rectangle
              key={`grid-cell-${cell.lat}-${cell.lon}-${idx}`}
              bounds={[
                [cell.lat - half, cell.lon - half],
                [cell.lat + half, cell.lon + half],
              ]}
              pathOptions={{
                color: isSelected ? "#2857D6" : colors.stroke,
                weight: isSelected ? 2.8 : 1,
                fillColor: colors.fill,
                fillOpacity: isSelected ? 0.65 : colors.opacity,
              }}
              eventHandlers={{
                click: () => handleCellClick(cell),
                mouseover: () => setHoveredCell(cell),
                mouseout: () => setHoveredCell(null),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 min-w-[210px] space-y-2">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-brand uppercase">
                      Grid Node [{cell.lat.toFixed(2)}°, {cell.lon.toFixed(2)}°]
                    </span>
                    <span
                      className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        cell.risk_level === "critical"
                          ? "bg-red-100 text-red-700"
                          : cell.risk_level === "high"
                          ? "bg-orange-100 text-orange-700"
                          : cell.risk_level === "moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {cell.risk_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted block">CAPE Energy</span>
                      <strong className="font-mono text-navy">{cell.cape} J/kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Precipitation</span>
                      <strong className="font-mono text-navy">{cell.precipitation} mm/h</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Wind (10m)</span>
                      <strong className="font-mono text-navy">{cell.wind_speed_10m} km/h</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Rel. Humidity</span>
                      <strong className="font-mono text-navy">{cell.relative_humidity_2m}%</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCellClick(cell)}
                    className="w-full mt-2 bg-brand text-white font-bold text-[11px] py-1.5 rounded-lg hover:bg-brand/90 transition-colors shadow-xs flex items-center justify-center space-x-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Focus Dashboard on Cell</span>
                  </button>
                </div>
              </Popup>
            </Rectangle>
          );
        })}

        {/* Dynamic Center Crosshair Target Marker */}
        <Marker position={center} icon={createTargetCrosshairIcon()}>
          <Popup className="custom-leaflet-popup">
            <div className="p-2.5 min-w-[180px]">
              <div className="text-[10px] font-bold text-brand uppercase tracking-wider">Active Coordinate Focus</div>
              <div className="text-xs font-extrabold text-navy mt-0.5">
                {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
              </div>
              <div className="text-[10px] text-success font-semibold mt-1">● Live Telemetry Synced</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Bottom-Left Live Coordinate HUD & Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-card border border-border flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand animate-ping"></div>
          <div>
            <span className="text-[10px] text-muted font-bold uppercase block">Target Focus</span>
            <span className="text-xs font-mono font-bold text-navy">
              {center[0].toFixed(3)}°N, {center[1].toFixed(3)}°E
            </span>
          </div>
        </div>

        {hoveredCell && (
          <div className="border-l border-border pl-3 flex items-center space-x-3 text-xs">
            <div>
              <span className="text-[10px] text-muted block">Hover Node</span>
              <span className="font-mono font-bold text-brand">
                {hoveredCell.lat.toFixed(2)}°, {hoveredCell.lon.toFixed(2)}°
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">CAPE</span>
              <span className="font-mono font-bold text-navy">{hoveredCell.cape} J/kg</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Rain</span>
              <span className="font-mono font-bold text-navy">{hoveredCell.precipitation} mm</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Right Metric Gradient Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-card border border-border flex items-center space-x-2 text-[10px] font-bold text-muted">
        <span>Low</span>
        <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-500 shadow-inner"></div>
        <span className="text-red-600">Critical</span>
      </div>
    </div>
  );
}
