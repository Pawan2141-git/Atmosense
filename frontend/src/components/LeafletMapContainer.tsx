"use client";

import dynamic from "next/dynamic";
import type { MapMetric } from "./LeafletMap";
import type { GridCell, OpenMeteoGridData } from "@/lib/api";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-[#EAF1FA] flex flex-col items-center justify-center rounded-2xl border border-border animate-pulse">
      <div className="w-10 h-10 rounded-full border-3 border-brand border-t-transparent animate-spin mb-3"></div>
      <div className="text-xs font-mono font-bold text-muted">Initializing Leaflet High-Res Radar...</div>
    </div>
  ),
});

interface LeafletMapContainerProps {
  gridData: OpenMeteoGridData | null;
  center: [number, number];
  zoom?: number;
  metric?: MapMetric;
  selectedCell?: GridCell | null;
  onSelectCell?: (cell: GridCell) => void;
  onSelectCoords?: (lat: number, lon: number) => void;
  className?: string;
}

export default function LeafletMapContainer(props: LeafletMapContainerProps) {
  return <LeafletMap {...props} />;
}
