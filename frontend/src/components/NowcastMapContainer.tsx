"use client";

import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const NowcastMap = dynamic(() => import("./NowcastMap"), { ssr: false });

interface CellData {
  lat: number;
  lon: number;
  thunderstorm_prob: number;
  thunderstorm_risk: string;
  cloudburst_prob: number;
  cloudburst_risk: string;
  flash_flood_risk: number;
  flash_flood_risk_level: string;
}

interface NowcastMapContainerProps {
  forecastHour: number;
  activeLayer: "thunderstorm" | "cloudburst" | "flash_flood";
  onCellSelect: (cell: CellData) => void;
}

export default function NowcastMapContainer(props: NowcastMapContainerProps) {
  return (
    <div className="w-full h-full relative z-0">
      <NowcastMap {...props} />
    </div>
  );
}
