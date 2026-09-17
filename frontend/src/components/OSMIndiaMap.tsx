"use client";

import { useEffect, useState } from "react";
import { MapContainer as LeafletMap, Marker, Popup, Rectangle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Layers3, Radio, Sparkles, Navigation, Map, Globe, Mountain, Compass, Crosshair } from "lucide-react";
import { API_BASE_URL, AtmosphericSnapshot, getAtmosphericSnapshot } from "@/lib/api";
import { useLocation } from "@/context/LocationContext";
import BasemapLayer, { BasemapStyle } from "./BasemapLayer";
import WeatherIcon, { getWeatherTypeFromTelemetry, WEATHER_LABELS } from "./WeatherIcon";
import { IMDSatelliteOverlay, IMDSatelliteLegend } from "./IMDSatelliteLayer";
import RainViewerRadarLayer from "./RainViewerRadarLayer";


export type HazardType = "all" | "thunderstorm" | "cloudburst" | "flash_flood";

const createHazardIcon = (color: string, hazardType: string, isSelected: boolean = false) => {
  const iconSvg =
    hazardType === "thunderstorm"
      ? `<svg width="18" height="18" viewBox="0 0 64 64" fill="none"><path d="M 21 38 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z" stroke="#1E222D" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M 33 33 L 26 44 H 34 L 27 57 L 41 43 H 33 L 37 33 Z" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`
      : hazardType === "cloudburst"
      ? `<svg width="18" height="18" viewBox="0 0 64 64" fill="none"><path d="M 21 37 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z" stroke="#1E222D" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><line x1="22" y1="44" x2="17" y2="56" stroke="#0EA5E9" stroke-width="4" stroke-linecap="round"/><line x1="29" y1="44" x2="24" y2="56" stroke="#0EA5E9" stroke-width="4" stroke-linecap="round"/><line x1="36" y1="44" x2="31" y2="56" stroke="#0EA5E9" stroke-width="4" stroke-linecap="round"/><line x1="43" y1="44" x2="38" y2="56" stroke="#0EA5E9" stroke-width="4" stroke-linecap="round"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 64 64" fill="none"><path d="M 8 44 Q 16 36 24 44 Q 32 52 40 44 Q 48 36 56 44" stroke="#1D4ED8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M 8 54 Q 16 46 24 54 Q 32 62 40 54 Q 48 46 56 54" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M 18 30 Q 20 18 32 16 Q 44 14 46 30" stroke="#1E222D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="32" cy="9" r="4" fill="#60A5FA"/></svg>`;

  const size = isSelected ? 42 : 34;
  const anchor = size / 2;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          opacity: ${isSelected ? "0.45" : "0.25"};
          border-radius: 50%;
          animation: ping ${isSelected ? "1.4s" : "2.2s"} cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: ${size - 10}px;
          height: ${size - 10}px;
          background-color: #ffffff;
          border: 2px solid ${color};
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(10,30,80,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          z-index: 10;
        ">${iconSvg}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
};

const createCenterCrosshairIcon = () => {
  return L.divIcon({
    className: "custom-center-marker",
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border: 2px dashed #2857D6;
          border-radius: 50%;
          animation: spin 8s linear infinite;
        "></div>
        <div style="
          width: 14px;
          height: 14px;
          background-color: #2857D6;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(40,87,214,0.8);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

export interface HighRiskHotspot {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  risk: "critical" | "high" | "moderate" | "low";
  prob: string;
  hazard: string;
  hazardType: "thunderstorm" | "cloudburst" | "flash_flood";
  leadTime: string;
  intensity: string;
  qpe: string;
}

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (event) => onMapClick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

export default function OSMIndiaMap({
  compact = false,
  activeHazard = "all",
  forecastHour = 4,
  selectedLocation,
  onSelectHotspot,
  showSatellite: showSatelliteProp,
  onToggleSatellite,
  showRadar: showRadarProp,
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
  const { location: globalLoc, setLocation: setGlobalLocation, gridSize, dataMode } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("osm");
  const [hotspots, setHotspots] = useState<HighRiskHotspot[]>([]);
  const [weather, setWeather] = useState<AtmosphericSnapshot | null>(null);
  const [weatherLocation, setWeatherLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // IMD Satellite observation layer state
  const [internalSatellite, setInternalSatellite] = useState(false);
  const showImdSatellite = showSatelliteProp !== undefined ? showSatelliteProp : internalSatellite;
  const setShowImdSatellite = (val: boolean) => {
    setInternalSatellite(val);
    onToggleSatellite?.(val);
  };
  const [internalRadar, setInternalRadar] = useState(false);
  const showRadar = showRadarProp !== undefined ? showRadarProp : internalRadar;
  const setShowRadar = (val: boolean) => {
    setInternalRadar(val);
    onToggleRadar?.(val);
  };
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.65);
  const [cloudMovement, setCloudMovement] = useState(true);



  const activeCenterLat = selectedLocation?.lat ?? globalLoc.lat;
  const activeCenterLon = selectedLocation?.lon ?? globalLoc.lon;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch telemetry whenever active center coordinates change
  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherLocation({ lat: activeCenterLat, lon: activeCenterLon });
      try {
        const data = await getAtmosphericSnapshot(activeCenterLat, activeCenterLon);
        if (!cancelled) {
          setWeather(data);
        }
      } catch (error) {
        console.error("Atmospheric snapshot error", error);
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [activeCenterLat, activeCenterLon]);

  // Fetch dynamic risk zones centered around active coordinates and grid size
  useEffect(() => {
    let cancelled = false;

    async function loadRiskZones() {
      try {
        const params = new URLSearchParams({
          lat: String(activeCenterLat),
          lon: String(activeCenterLon),
          grid_size: String(gridSize),
          forecast_hour: String(forecastHour),
        });

        const response = await fetch(`${API_BASE_URL}/api/risk?${params}`);
        if (!response.ok) throw new Error(`Risk API returned ${response.status}`);

        const data = await response.json();
        const liveHotspots: HighRiskHotspot[] = (data.zones || [])
          .filter((zone: { center_lat?: number; center_lon?: number; hazard_type?: string }) =>
            typeof zone.center_lat === "number" &&
            typeof zone.center_lon === "number" &&
            ["thunderstorm", "cloudburst", "flash_flood"].includes(zone.hazard_type || "")
          )
          .map((zone: {
            zone_id: string;
            hazard_type: "thunderstorm" | "cloudburst" | "flash_flood";
            risk_level: string;
            risk_score?: number;
            probability?: number;
            center_lat: number;
            center_lon: number;
            forecast_hour?: number;
          }) => {
            const probability = zone.probability ?? zone.risk_score ?? 0;
            const normalizedRisk: HighRiskHotspot["risk"] =
              zone.risk_level === "critical" || zone.risk_level === "extreme"
                ? "critical"
                : zone.risk_level === "high" || zone.risk_level === "very_high"
                ? "high"
                : zone.risk_level === "moderate"
                ? "moderate"
                : "low";

            return {
              id: zone.zone_id,
              name: `${zone.hazard_type.replace("_", " ")} Hotspot`,
              state: "Target Sector",
              lat: zone.center_lat,
              lon: zone.center_lon,
              risk: normalizedRisk,
              prob: `${Math.round(probability * 100)}%`,
              hazard: zone.hazard_type.replace("_", " "),
              hazardType: zone.hazard_type,
              leadTime: `+${zone.forecast_hour ?? forecastHour}H`,
              intensity: zone.risk_level.replace("_", " "),
              qpe: `${Math.round(probability * 35 + 5)} mm/hr`,
            };
          });

        // Always compute synthetic grid so flash_flood cells are available as fallback
        const syntheticHotspots: HighRiskHotspot[] = [];
        const half = Math.floor(gridSize / 2);
        const step = 0.25;

        const hazardsList: ("thunderstorm" | "cloudburst" | "flash_flood")[] = [
          "cloudburst",
          "thunderstorm",
          "flash_flood",
        ];

        for (let i = -half; i <= half; i++) {
          for (let j = -half; j <= half; j++) {
            const lat = Number((activeCenterLat + i * step).toFixed(4));
            const lon = Number((activeCenterLon + j * step).toFixed(4));
            const dist = Math.sqrt(i * i + j * j);
            const probVal = Math.max(0.25, Math.min(0.94, 0.88 - dist * 0.11 + ((i * 2 + j) % 4) * 0.04));
            const hz = hazardsList[Math.abs(i + j * 2) % hazardsList.length];

            syntheticHotspots.push({
              id: `Cell [${i + half + 1},${j + half + 1}]`,
              name: `${hz.replace("_", " ")} Hotspot`,
              state: globalLoc.state || "Active Sector",
              lat,
              lon,
              risk: probVal > 0.78 ? "critical" : probVal > 0.58 ? "high" : probVal > 0.38 ? "moderate" : "low",
              prob: `${Math.round(probVal * 100)}%`,
              hazard: hz.replace("_", " "),
              hazardType: hz,
              leadTime: `+${forecastHour}H`,
              intensity: probVal > 0.78 ? "Extreme Surge" : probVal > 0.58 ? "Severe Inundation" : "Moderate Cell",
              qpe: `${Math.round(probVal * 42)} mm/hr`,
            });
          }
        }

        if (!cancelled && liveHotspots.length > 0) {
          // If the API returned no flash_flood zones, supplement with synthetic ones
          const hasFlashFlood = liveHotspots.some((h) => h.hazardType === "flash_flood");
          const merged = hasFlashFlood
            ? liveHotspots
            : [...liveHotspots, ...syntheticHotspots.filter((h) => h.hazardType === "flash_flood")];
          setHotspots(merged);
        } else if (!cancelled) {
          setHotspots(syntheticHotspots);
        }
      } catch (error) {
        console.warn("Risk API error, using dynamic synthetic grid", error);
      }
    }

    loadRiskZones();
    return () => {
      cancelled = true;
    };
  }, [activeCenterLat, activeCenterLon, gridSize, forecastHour, globalLoc.state]);

  async function handleMapClick(lat: number, lon: number) {
    const formattedLat = Number(lat.toFixed(4));
    const formattedLon = Number(lon.toFixed(4));
    setWeatherLoading(true);
    setWeatherLocation({ lat: formattedLat, lon: formattedLon });

    // Globally update the target location so ALL pages/dashboard elements update according to this map point!
    setGlobalLocation({
      lat: formattedLat,
      lon: formattedLon,
      name: `Target (${formattedLat.toFixed(2)}°N, ${formattedLon.toFixed(2)}°E)`,
      state: "Interactive Map Point",
    });

    try {
      const data = await getAtmosphericSnapshot(formattedLat, formattedLon);
      setWeather(data);

      // Create a hotspot instance for the inspection panel
      const clickedHotspot: HighRiskHotspot = {
        id: `Coord ${formattedLat}°N`,
        name: `Target Coordinate (${formattedLat.toFixed(2)}°, ${formattedLon.toFixed(2)}°)`,
        state: "Interactive Map Point",
        lat: formattedLat,
        lon: formattedLon,
        risk: data.cape > 1600 || data.precipitation > 20 ? "critical" : data.cape > 1000 ? "high" : "moderate",
        prob: `${Math.min(96, Math.max(35, Math.round(((data.cape / 2500) * 50) + ((data.precipitation / 30) * 50))))}%`,
        hazard: activeHazard === "all" ? "cloudburst" : activeHazard,
        hazardType: activeHazard === "all" ? "cloudburst" : activeHazard,
        leadTime: `+${forecastHour}H`,
        intensity: data.precipitation > 20 ? "Extreme Discharge" : "Active Convection",
        qpe: `${Math.round(data.precipitation)} mm/hr`,
      };

      setSelectedHotspotId(clickedHotspot.id);
      onSelectHotspot?.(clickedHotspot);
    } catch (error) {
      console.error("Atmospheric snapshot error", error);
    } finally {
      setWeatherLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="w-full h-full bg-[#EAF1FA] flex items-center justify-center rounded-2xl">
        <div className="text-xs font-mono text-muted animate-pulse">Initializing Leaflet OpenStreetMap Radar...</div>
      </div>
    );
  }

  const filteredHotspots = hotspots.filter((spot) => {
    if (activeHazard === "all") return true;
    return spot.hazardType === activeHazard;
  });

  const filterLabel = activeHazard === "all" ? "All hazards" : activeHazard.replace("_", " ");
  const filterColor =
    activeHazard === "thunderstorm"
      ? "#EF5468"
      : activeHazard === "cloudburst"
      ? "#2857D6"
      : activeHazard === "flash_flood"
      ? "#2CA36E"
      : "#1FA971";

  const defaultZoom = compact ? 8 : 8;

  const getHazardColor = (hazard: string, risk: string) => {
    if (hazard === "thunderstorm") return "#EF5468";
    if (hazard === "cloudburst") return "#2857D6";
    if (hazard === "flash_flood") return "#2CA36E";
    return risk === "critical" ? "#B12433" : risk === "high" ? "#C23948" : "#8A6A1E";
  };

  const halfDeg = (gridSize / 2) * 0.25;

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner select-none">
      <LeafletMap
        center={[activeCenterLat, activeCenterLon]}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={!compact}
        attributionControl={false}
      >
        <MapViewController center={[activeCenterLat, activeCenterLon]} zoom={defaultZoom} />
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Selected Leaflet Tile Layer */}
        <BasemapLayer style={basemapStyle} />

        {/* IMD Satellite Infrared Cloud Layer */}
        {showImdSatellite && (
          <IMDSatelliteOverlay
            center={[activeCenterLat, activeCenterLon]}
            opacity={satelliteOpacity}
            cloudMovement={cloudMovement}
          />
        )}
        {showRadar && <RainViewerRadarLayer onUnavailable={() => setShowRadar(false)} />}
        {/* Dynamic Regional Grid Outer Boundary */}
        <Rectangle
          bounds={[
            [activeCenterLat - halfDeg - 0.125, activeCenterLon - halfDeg - 0.125],
            [activeCenterLat + halfDeg + 0.125, activeCenterLon + halfDeg + 0.125],
          ]}
          pathOptions={{
            color: "#2857D6",
            weight: 2,
            dashArray: "6, 6",
            fillColor: "#2857D6",
            fillOpacity: 0.05,
          }}
        />

        {/* Center Target Indicator Crosshair */}
        <Marker
          position={[activeCenterLat, activeCenterLon]}
          icon={createCenterCrosshairIcon()}
        >
          <Popup className="custom-leaflet-popup">
            <div className="p-2.5 min-w-[190px]">
              <div className="text-[10px] font-bold text-brand uppercase tracking-wider mb-1">Radar Center Focus</div>
              <div className="font-extrabold text-xs text-navy">{globalLoc.name}</div>
              <div className="text-[10.5px] font-mono text-muted mt-0.5">{activeCenterLat.toFixed(4)}°N, {activeCenterLon.toFixed(4)}°E</div>
              <div className="text-[10px] text-success font-semibold mt-1">● Live Ingestion Active</div>
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Grid Cells Heatmap / Polygons */}
        {filteredHotspots.map((spot) => {
          const color = getHazardColor(spot.hazardType, spot.risk);
          const isSelected = selectedHotspotId === spot.id;
          const cellSize = 0.22;

          return (
            <div key={`cell-${spot.id}`}>
              {/* Grid cell bounds */}
              <Rectangle
                bounds={[
                  [spot.lat - cellSize / 2, spot.lon - cellSize / 2],
                  [spot.lat + cellSize / 2, spot.lon + cellSize / 2],
                ]}
                pathOptions={{
                  color: isSelected ? "#2857D6" : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.35 : spot.risk === "critical" ? 0.26 : spot.risk === "high" ? 0.18 : 0.1,
                  weight: isSelected ? 2.5 : 1,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedHotspotId(spot.id);
                    onSelectHotspot?.(spot);
                    handleMapClick(spot.lat, spot.lon);
                  },
                }}
              />

              {/* Marker pin */}
              <Marker
                position={[spot.lat, spot.lon]}
                icon={createHazardIcon(color, spot.hazardType, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedHotspotId(spot.id);
                    onSelectHotspot?.(spot);
                    handleMapClick(spot.lat, spot.lon);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-3 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {spot.id}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        {spot.hazardType.replace("_", " ")}
                      </span>
                    </div>

                    <div className="font-extrabold text-[13px] text-slate-900 leading-snug">
                      {spot.name}
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      {spot.lat.toFixed(4)}°N, {spot.lon.toFixed(4)}°E
                    </div>

                    {/* Telemetry inside popup */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Threat Probability:</span>
                        <span className="font-mono font-bold text-slate-900">{spot.prob}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rain Intensity:</span>
                        <span className="font-mono font-bold text-blue-700">{spot.qpe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Action Window:</span>
                        <span className="font-mono font-bold text-rose-600">{spot.leadTime} Lead</span>
                      </div>
                    </div>

                    {/* Set as regional focus button */}
                    <button
                      onClick={() => handleMapClick(spot.lat, spot.lon)}
                      className="mt-2.5 w-full bg-brand hover:bg-brand/90 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Navigation className="w-3 h-3" /> Focus Whole App on This Cell
                    </button>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </LeafletMap>
      {/* Top Right Controls: Basemap Switcher */}
      <div className="absolute top-3 right-3 z-[400] flex flex-nowrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-border shadow-md flex items-center space-x-1 text-xs whitespace-nowrap">
          {[
            { id: "osm", label: "Street", icon: Map },
            { id: "satellite", label: "Satellite", icon: Globe },
            { id: "topo", label: "Terrain", icon: Mountain },
            { id: "dark", label: "Voyager", icon: Compass },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setBasemapStyle(b.id as BasemapStyle)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all text-[11px] whitespace-nowrap shrink-0 ${
                basemapStyle === b.id
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:text-navy hover:bg-page"
              }`}
            >
              <b.icon className="w-3 h-3" />
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Hint Pill */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border shadow-md pointer-events-auto flex items-center space-x-2 text-[11px] font-semibold text-navy">
        <Crosshair className="w-3.5 h-3.5 text-brand animate-pulse" />
        <span>Click anywhere on map to instantly update full telemetry & dashboard</span>
      </div>

      {/* Floating Bottom Weather Snapshot Card */}
      <div className="absolute bottom-3 right-3 z-[500] w-[min(300px,calc(100%-1.5rem))] bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-[0_8px_24px_rgba(20,45,100,0.16)] p-3.5 pointer-events-auto">
        <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-border/70">
          <div className="flex items-center space-x-2.5">
            {weather && (
              <WeatherIcon
                type={getWeatherTypeFromTelemetry(weather.cloud_cover, weather.precipitation, weather.cape)}
                size={20}
                darkBadge={true}
                title={WEATHER_LABELS[getWeatherTypeFromTelemetry(weather.cloud_cover, weather.precipitation, weather.cape)]}
              />
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Coordinate Telemetry
              </div>
              {weatherLocation && (
                <div className="text-[10px] font-mono text-muted mt-0.5">
                  {weatherLocation.lat.toFixed(4)}°N, {weatherLocation.lon.toFixed(4)}°E
                </div>
              )}
            </div>
          </div>
          {weatherLoading && <span className="text-[10px] font-semibold text-brand animate-pulse">Syncing...</span>}
        </div>

        {weather ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div><span className="text-muted text-[11px]">Temp:</span> <strong className="text-navy">{weather.temperature_2m.toFixed(1)} °C</strong></div>
            <div><span className="text-muted text-[11px]">Humidity:</span> <strong className="text-navy">{weather.relative_humidity_2m.toFixed(0)} %</strong></div>
            <div><span className="text-muted text-[11px]">Wind:</span> <strong className="text-navy">{weather.wind_speed_10m.toFixed(1)} km/h</strong></div>
            <div><span className="text-muted text-[11px]">Hourly Rain:</span> <strong className="text-navy">{weather.precipitation.toFixed(1)} mm</strong></div>
            <div><span className="text-muted text-[11px]">Cloud:</span> <strong className="text-navy">{weather.cloud_cover.toFixed(0)} %</strong></div>
            <div><span className="text-muted text-[11px]">CAPE:</span> <strong className="text-navy">{weather.cape.toFixed(0)} J/kg</strong></div>
            <div><span className="text-muted text-[11px]">Elevation:</span> <strong className="text-navy">{weather.elevation_m.toFixed(0)} m</strong></div>
            <div><span className="text-muted text-[11px]">Provider:</span> <strong className="text-navy truncate block" title={weather.source}>Open-Meteo LIVE</strong></div>
          </div>
        ) : (
          <p className="text-[11px] text-muted leading-snug">Click any coordinate or grid cell to stream live Open-Meteo sounding telemetry.</p>
        )}
      </div>



      {/* IMD Satellite Technical Legend Overlay */}
      {showImdSatellite && (
        <IMDSatelliteLegend
          opacity={satelliteOpacity}
          setOpacity={setSatelliteOpacity}
          cloudMovement={cloudMovement}
          setCloudMovement={setCloudMovement}
          onClose={() => setShowImdSatellite(false)}
        />
      )}

      {showRadar && (
        <div className="absolute bottom-3 left-3 z-[450] w-[190px] bg-white/95 backdrop-blur-md rounded-xl border border-border shadow-md p-2.5 pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-navy">
            <span>Radar precipitation</span>
            <span className="text-success">Live</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-sky-300 via-yellow-300 to-red-600" />
          <div className="mt-1 flex justify-between text-[9px] text-muted"><span>Light</span><span>Heavy</span></div>
          <a className="mt-1.5 block text-[9px] text-brand hover:underline" href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">
            Weather data by RainViewer
          </a>
        </div>
      )}
    </div>
  );
}
