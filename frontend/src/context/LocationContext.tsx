"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AtmosphericSnapshot, getAtmosphericSnapshot } from "@/lib/api";

export interface GeoLocation {
  name: string;
  state: string;
  lat: number;
  lon: number;
  category?: "Himalayan Basin" | "Western Ghats" | "Urban Core" | "Coastal / Plains" | "Custom";
}

export const POPULAR_LOCATIONS: GeoLocation[] = [
  {
    name: "Dehradun / Doon Valley",
    state: "Uttarakhand",
    lat: 30.3165,
    lon: 78.0322,
    category: "Himalayan Basin",
  },
  {
    name: "Kedarnath / Mandakini Basin",
    state: "Uttarakhand",
    lat: 30.7346,
    lon: 79.0669,
    category: "Himalayan Basin",
  },
  {
    name: "Chamoli & Joshimath",
    state: "Uttarakhand",
    lat: 30.5568,
    lon: 79.5645,
    category: "Himalayan Basin",
  },
  {
    name: "Shimla / Satluj Basin",
    state: "Himachal Pradesh",
    lat: 31.1048,
    lon: 77.1734,
    category: "Himalayan Basin",
  },
  {
    name: "Delhi NCR Metropolitan",
    state: "Delhi",
    lat: 28.6139,
    lon: 77.2090,
    category: "Urban Core",
  },
  {
    name: "Mumbai Coastal Sector",
    state: "Maharashtra",
    lat: 19.0760,
    lon: 72.8777,
    category: "Coastal / Plains",
  },
  {
    name: "Wayanad / Western Ghats Catchment",
    state: "Kerala",
    lat: 11.6854,
    lon: 76.1320,
    category: "Western Ghats",
  },
  {
    name: "Guwahati / Brahmaputra Basin",
    state: "Assam",
    lat: 26.1445,
    lon: 91.7362,
    category: "Coastal / Plains",
  },
  {
    name: "Cherrapunji / Mawsynram Ridge",
    state: "Meghalaya",
    lat: 25.2702,
    lon: 91.7323,
    category: "Himalayan Basin",
  },
];

interface LocationContextType {
  location: GeoLocation;
  setLocation: (loc: GeoLocation | { lat: number; lon: number; name?: string; state?: string }) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  dataMode: "LIVE" | "DEMO";
  setDataMode: (mode: "LIVE" | "DEMO") => void;
  provider: string;
  snapshot: AtmosphericSnapshot | null;
  refreshSnapshot: () => Promise<void>;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<GeoLocation>(POPULAR_LOCATIONS[0]);
  const [gridSize, setGridSize] = useState<number>(7);
  const [dataMode, setDataMode] = useState<"LIVE" | "DEMO">("LIVE");
  const [provider, setProvider] = useState<string>("Open-Meteo LIVE (7×7 Grid)");
  const [snapshot, setSnapshot] = useState<AtmosphericSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshSnapshot = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAtmosphericSnapshot(location.lat, location.lon);
      setSnapshot(data);
      if (data.source?.toLowerCase().includes("open-meteo") || data.source?.toLowerCase().includes("openmeteo")) {
        setDataMode("LIVE");
        setProvider(`Open-Meteo LIVE (${gridSize}×${gridSize} Grid)`);
      } else {
        setProvider(`DEMO Simulation (${gridSize}×${gridSize})`);
      }
    } catch (e) {
      console.warn("Failed fetching live atmospheric snapshot", e);
    } finally {
      setIsLoading(false);
    }
  }, [location.lat, location.lon, gridSize]);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  const setLocation = (newLoc: GeoLocation | { lat: number; lon: number; name?: string; state?: string }) => {
    const formatted: GeoLocation = {
      name: newLoc.name || `${newLoc.lat.toFixed(2)}°N, ${newLoc.lon.toFixed(2)}°E`,
      state: newLoc.state || "Custom Coordinates",
      lat: Number(Number(newLoc.lat).toFixed(4)),
      lon: Number(Number(newLoc.lon).toFixed(4)),
      category: "Custom",
    };
    setLocationState(formatted);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        gridSize,
        setGridSize,
        dataMode,
        setDataMode,
        provider,
        snapshot,
        refreshSnapshot,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
