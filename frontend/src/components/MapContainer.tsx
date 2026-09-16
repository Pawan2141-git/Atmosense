"use client";

import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapContainer({ forecastHour }: { forecastHour: number }) {
  return (
    <div className="w-full h-full relative z-0">
      <Map forecastHour={forecastHour} />
    </div>
  );
}
