"use client";

import { useEffect, useState } from "react";
import { MapContainer as LeafletMap, Rectangle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "@/lib/api";
import BasemapLayer from "./BasemapLayer";

// Fix leaflet icon issue in Next.js
import L from "leaflet";
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";

interface RiskZone {
  zone_id: string;
  hazard_type: string;
  risk_level: string;
  center_lat: number;
  center_lon: number;
  risk_score: number;
}

export default function Map({ forecastHour }: { forecastHour: number }) {
  const [zones, setZones] = useState<RiskZone[]>([]);

  useEffect(() => {
    async function fetchRiskMap() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/risk?forecast_hour=${forecastHour}`);
        if (!res.ok) throw new Error("Failed to fetch risk map");
        const data = await res.json();
        setZones(data.zones || []);
      } catch (error) {
        console.error(error);
        // Fallback demo data
        setZones([
          {
            zone_id: "demo-1",
            hazard_type: "flash_flood",
            risk_level: "critical",
            center_lat: 30.4,
            center_lon: 79.3,
            risk_score: 0.89
          }
        ]);
      }
    }
    fetchRiskMap();
  }, [forecastHour]);

  const getColor = (level: string) => {
    switch (level) {
      case "low": return "#3b82f6"; // blue
      case "moderate": return "#f59e0b"; // yellow
      case "high": return "#f97316"; // orange
      case "very_high": return "#ef4444"; // red
      case "critical": return "#991b1b"; // dark red
      case "extreme": return "#991b1b"; 
      default: return "#3b82f6";
    }
  };

  const getBounds = (lat: number, lon: number): [[number, number], [number, number]] => {
    const halfRes = 0.125; // 0.25 grid resolution
    return [
      [lat - halfRes, lon - halfRes],
      [lat + halfRes, lon + halfRes]
    ];
  };

  return (
    <LeafletMap 
      center={[30.3, 78.5]} 
      zoom={7} 
      className="w-full h-full bg-slate-100"
      zoomControl={false}
    >
      <BasemapLayer style="osm" />
      {zones.map((zone) => (
        <Rectangle
          key={zone.zone_id}
          bounds={getBounds(zone.center_lat, zone.center_lon)}
          pathOptions={{
            color: getColor(zone.risk_level),
            fillColor: getColor(zone.risk_level),
            fillOpacity: 0.5,
            weight: 1
          }}
        >
          <Popup className="text-slate-800">
            <div className="p-1 min-w-[120px]">
              <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">
                {zone.hazard_type.replace('_', ' ')}
              </div>
              <div className="text-sm font-bold" style={{ color: getColor(zone.risk_level) }}>
                {zone.risk_level.toUpperCase()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Risk Score: {(zone.risk_score * 100).toFixed(0)}%
              </div>
            </div>
          </Popup>
        </Rectangle>
      ))}
    </LeafletMap>
  );
}
