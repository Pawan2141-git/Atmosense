"use client";

import dynamic from "next/dynamic";
import type { HighRiskHotspot, HazardType } from "./OSMIndiaMap";

const OSMIndiaMap = dynamic(() => import("./OSMIndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#EAF1FA] flex items-center justify-center rounded-2xl animate-pulse">
      <div className="text-xs font-mono text-muted">Initializing OpenStreetMap (OSM) Hazard Radar...</div>
    </div>
  ),
});

export default function OSMIndiaMapContainer({
  compact = false,
  activeHazard = "all",
  forecastHour = 4,
  selectedLocation,
  onSelectHotspot,
  showSatellite,
  onToggleSatellite,
  showRadar,
  onToggleRadar,
}: {
  compact?: boolean;
  activeHazard?: HazardType;
  forecastHour?: number;
  selectedLocation?: { lat: number; lon: number };
  onSelectHotspot?: (hotspot: HighRiskHotspot) => void;
  showSatellite?: boolean;
  onToggleSatellite?: (val: boolean) => void;
  showRadar?: boolean;
  onToggleRadar?: (val: boolean) => void;
}) {
  return (
    <div className="w-full h-full relative z-0">
      <OSMIndiaMap
        compact={compact}
        activeHazard={activeHazard}
        forecastHour={forecastHour}
        selectedLocation={selectedLocation}
        onSelectHotspot={onSelectHotspot}
        showSatellite={showSatellite}
        onToggleSatellite={onToggleSatellite}
        showRadar={showRadar}
        onToggleRadar={onToggleRadar}
      />
    </div>
  );
}
