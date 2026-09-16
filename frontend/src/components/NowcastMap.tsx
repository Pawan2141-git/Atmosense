"use client";

import { useEffect, useState } from "react";
import { MapContainer as LeafletMap, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { API_BASE_URL } from "@/lib/api";
import BasemapLayer from "./BasemapLayer";

L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";

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

interface NowcastMapProps {
  forecastHour: number;
  activeLayer: "thunderstorm" | "cloudburst" | "flash_flood";
  onCellSelect: (cell: CellData) => void;
}

export default function NowcastMap({ forecastHour, activeLayer, onCellSelect }: NowcastMapProps) {
  const [cells, setCells] = useState<CellData[]>([]);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/predictions?forecast_hour=${forecastHour}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        if (data.grids && data.grids.length > 0) {
          setCells(data.grids[0].cells);
        }
      } catch (err) {
        console.error("API error, using empty grid", err);
        setCells([]);
      }
    }
    fetchPredictions();
  }, [forecastHour]);

  const getOpacity = (prob: number) => {
    if (prob < 0.2) return 0;
    if (prob < 0.4) return 0.25;
    if (prob < 0.6) return 0.45;
    if (prob < 0.8) return 0.65;
    return 0.85;
  };

  const getColor = (prob: number) => {
    if (prob < 0.2) return "transparent";
    if (activeLayer === "thunderstorm") return "#ea580c"; // darker orange
    if (activeLayer === "cloudburst") return "#2563eb"; // darker blue
    if (activeLayer === "flash_flood") return "#dc2626"; // darker red
    return "#2563eb";
  };

  // Resolution is 0.25 degrees
  const getBounds = (lat: number, lon: number): [[number, number], [number, number]] => {
    const halfRes = 0.125;
    return [
      [lat - halfRes, lon - halfRes],
      [lat + halfRes, lon + halfRes]
    ];
  };

  return (
    <LeafletMap 
      center={[30.3, 78.5]} 
      zoom={8} 
      className="w-full h-full bg-slate-100"
      zoomControl={false}
      attributionControl={false}
    >
      <BasemapLayer
        fallbackUrl="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        fallbackAttribution=""
      />
      {cells.map((cell, idx) => {
        let prob = 0;
        if (activeLayer === "thunderstorm") prob = cell.thunderstorm_prob;
        if (activeLayer === "cloudburst") prob = cell.cloudburst_prob;
        if (activeLayer === "flash_flood") prob = cell.flash_flood_risk;

        if (prob < 0.2) return null;

        return (
          <Rectangle
            key={`${idx}-${forecastHour}`}
            bounds={getBounds(cell.lat, cell.lon)}
            pathOptions={{
              color: getColor(prob),
              fillColor: getColor(prob),
              fillOpacity: getOpacity(prob),
              weight: 1,
              opacity: 0.8
            }}
            eventHandlers={{
              click: () => onCellSelect(cell),
              mouseover: () => onCellSelect(cell)
            }}
          />
        );
      })}
    </LeafletMap>
  );
}
