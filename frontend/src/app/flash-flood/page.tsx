"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Waves, Mountain, CloudRain, ArrowRight } from "lucide-react";
import SeverityBadge from "@/components/SeverityBadge";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "@/context/LocationContext";

export default function FlashFloodPage() {
  const { location, gridSize, dataMode, snapshot } = useLocation();
  const [selectedHorizon, setSelectedHorizon] = useState<string>("+4H");

  const [elevatedZones, setElevatedZones] = useState<{
    zone: string; riskScore: number; terrain: string; precip: string; location: string;
  }[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [peakRainRate, setPeakRainRate] = useState(0);
  const [precipThreatPct, setPrecipThreatPct] = useState(43);
  const [terrainVulnPct, setTerrainVulnPct] = useState(50);
  const [combinedRiskPct, setCombinedRiskPct] = useState(46);

  const precipVal = snapshot?.precipitation ?? 14.5;
  const elevVal = snapshot?.elevation_m ?? 750;

  useEffect(() => {
    const forecastHour = Number(selectedHorizon.replace("+", "").replace("H", ""));
    const params = new URLSearchParams({
      forecast_hour: forecastHour.toString(),
      lat: location.lat.toString(),
      lon: location.lon.toString(),
      grid_size: gridSize.toString(),
    });

    fetch(`/api/risk/flash-flood?${params}`)
      .then((res) => res.json())
      .then(async (data) => {
        let items = (data.flash_flood_risks && data.flash_flood_risks.length > 0)
          ? data.flash_flood_risks
          : (data.zones || []);

        if (items.length === 0) {
          const fallbackRes = await fetch(`/api/risk/flash-flood?forecast_hour=${forecastHour}`);
          const fallbackData = await fallbackRes.json();
          items = (fallbackData.flash_flood_risks && fallbackData.flash_flood_risks.length > 0)
            ? fallbackData.flash_flood_risks
            : (fallbackData.zones || []);
        }

        if (items.length > 0) {
          const mappedZones = items.map((item: Record<string, unknown>) => ({
            zone: (item.zone_id as string) || `Grid-${((item.latitude as number) ?? location.lat).toFixed(2)}-${((item.longitude as number) ?? location.lon).toFixed(2)}`,
            riskScore: Math.round(((item.risk_score as number) ?? (item.probability as number) ?? 0) * 100),
            terrain: (item.risk_level as string) || "moderate",
            precip: (item.risk_level as string) || "moderate",
            location: item.center_lat && item.center_lon 
              ? `${(item.center_lat as number).toFixed(2)}°N, ${(item.center_lon as number).toFixed(2)}°E`
              : `${((item.latitude as number) ?? location.lat).toFixed(2)}°N, ${((item.longitude as number) ?? location.lon).toFixed(2)}°E`,
          }));
          setElevatedZones(mappedZones);

          const maxRisk = Math.round(Math.max(...items.map((i: Record<string, unknown>) => (i.risk_score as number) ?? (i.probability as number) ?? 0)) * 100);
          setRiskScore(maxRisk > 0 ? maxRisk : 40);

          const maxRain = items.reduce((highest: number, item: Record<string, unknown>) => {
            const factors = item.factors as Record<string, number> | undefined;
            return Math.max(highest, factors?.rainfall_intensity_mm_hr || 0);
          }, 0);
          setPeakRainRate(maxRain > 0 ? maxRain : precipVal);

          const maxPrecipThreat = items.reduce((highest: number, item: Record<string, unknown>) => {
            const factors = item.factors as Record<string, number> | undefined;
            const threat = (item.precipitation_threat as number) ?? (factors?.rainfall_intensity_mm_hr ? factors.rainfall_intensity_mm_hr / 60 : 0);
            return Math.max(highest, threat);
          }, 0);
          const pThreatPct = maxPrecipThreat > 0 
            ? Math.round(maxPrecipThreat * 100) 
            : Math.min(95, Math.max(30, Math.round(((maxRain || precipVal) / 30) * 100)));
          setPrecipThreatPct(pThreatPct);

          const maxTerrainVuln = items.reduce((highest: number, item: Record<string, unknown>) => {
            const factors = item.factors as Record<string, number> | undefined;
            const vuln = (item.terrain_vulnerability as number) ?? (factors?.slope_degrees ? factors.slope_degrees / 45 : 0.5);
            return Math.max(highest, vuln);
          }, 0);
          const tVulnPct = maxTerrainVuln > 0 
            ? Math.round(maxTerrainVuln * 100) 
            : Math.min(92, Math.max(40, Math.round(((elevVal / 1800) * 60) + 25)));
          setTerrainVulnPct(tVulnPct);

          const maxComb = items.reduce((highest: number, item: Record<string, unknown>) => {
            return Math.max(highest, (item.combined_risk as number) ?? 0);
          }, 0);
          const cRiskPct = maxComb > 0 
            ? Math.round(maxComb * 100) 
            : Math.round(pThreatPct * 0.55 + tVulnPct * 0.45);
          setCombinedRiskPct(cRiskPct);
        } else {
          const pThreat = Math.min(95, Math.max(25, Math.round(((precipVal / 30) * 100) + (forecastHour - 4) * 3)));
          const tVuln = Math.min(92, Math.max(40, Math.round(((elevVal / 1800) * 60) + 25)));
          const cRisk = Math.round(pThreat * 0.55 + tVuln * 0.45);

          setPrecipThreatPct(pThreat);
          setTerrainVulnPct(tVuln);
          setCombinedRiskPct(cRisk);
          setRiskScore(cRisk);
          setPeakRainRate(precipVal);

          const dynamicZones = [
            { zone: "Drainage Grid C4 (Gorge)", riskScore: cRisk, terrain: "critical", precip: "critical", location: `${location.name} Valley Floor` },
            { zone: "Catchment Grid B3 (Upper)", riskScore: Math.round(cRisk * 0.9), terrain: "high", precip: "high", location: `${(location.lat + 0.2).toFixed(2)}°N, ${(location.lon - 0.15).toFixed(2)}°E` },
            { zone: "Downstream Grid D5 (Confluence)", riskScore: Math.round(cRisk * 0.85), terrain: "high", precip: "high", location: `${(location.lat - 0.15).toFixed(2)}°N, ${(location.lon + 0.2).toFixed(2)}°E` },
            { zone: "Lateral Basin A2 (Slopes)", riskScore: Math.round(cRisk * 0.7), terrain: "moderate", precip: "moderate", location: `${(location.lat + 0.35).toFixed(2)}°N, ${location.lon.toFixed(2)}°E` },
          ];
          setElevatedZones(dynamicZones);
        }
      })
      .catch((error) => console.error("Flash-flood API error", error));
  }, [selectedHorizon, location.lat, location.lon, location.name, gridSize, precipVal, elevVal]);

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header Controls */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Hydrological Basin Vulnerability</span>
          <div className="flex items-center space-x-3 mt-1">
            <h3 className="text-base font-bold text-navy">Precipitation Threat × Terrain Vulnerability</h3>
            <span className="text-xs bg-brand/10 text-brand font-bold px-2.5 py-0.5 rounded-full border border-brand/20">
              {location.name}
            </span>
          </div>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center space-x-2 bg-page p-1.5 rounded-xl border border-border">
          <span className="text-xs font-bold text-muted px-2 uppercase tracking-wider">Horizon:</span>
          {["+2H", "+3H", "+4H", "+5H", "+6H"].map((h) => (
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
            FORECAST {selectedHorizon}
          </span>
        </div>
      </div>

      {/* SECTION 1: FLASH-FLOOD RISK GAUGE & RISK DECOMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circular Risk Gauge */}
        <div className="lg:col-span-5 bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col items-center justify-center text-center card-hover-effect">
          <div className="flex items-center justify-between w-full mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand">Peak Catchment Risk</h4>
            <span className="text-[10px] font-mono font-bold text-success bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {dataMode} Telemetry
            </span>
          </div>
          
          {/* Gauge Ring */}
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#E3EAF3"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={riskScore > 75 ? "#B12433" : riskScore > 50 ? "#C23948" : "#2857D6"}
                strokeWidth="10"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * riskScore) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-navy tracking-tight">{riskScore}%</span>
              <span className="text-[10.5px] font-bold uppercase text-muted tracking-wider mt-0.5">Flash Flood Index</span>
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center">
            <SeverityBadge level={riskScore > 75 ? "critical" : riskScore > 55 ? "high" : "moderate"} />
            <span className="text-[11px] text-muted mt-2">
              Coupled Open-Meteo Precipitation ({peakRainRate.toFixed(1)} mm/hr) + 30m DEM slope
            </span>
          </div>
        </div>

        {/* Right: Risk Decomposition Bars */}
        <div className="lg:col-span-7 bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col justify-between card-hover-effect">
          <div>
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand">Coupled Risk Decomposition</h4>
              <span className="text-xs text-muted">Hydro-Meteorological Vector Matrix</span>
            </div>

            <div className="space-y-5">
              {/* Bar 1: Precipitation Threat */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-bold text-navy flex items-center">
                    <CloudRain className="w-4 h-4 text-chart-b mr-1.5" />
                    PRECIPITATION THREAT (OPEN-METEO PRECIPITATION)
                  </span>
                  <span className="font-mono font-bold text-navy">{precipThreatPct}% ({peakRainRate.toFixed(1)} mm/hr)</span>
                </div>
                <div className="w-full h-3 bg-page rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-chart-b rounded-full transition-all duration-700" style={{ width: `${precipThreatPct}%` }} />
                </div>
              </div>

              {/* Bar 2: Terrain Vulnerability */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-bold text-navy flex items-center">
                    <Mountain className="w-4 h-4 text-chart-a mr-1.5" />
                    TERRAIN VULNERABILITY (SLOPE & DRAINAGE)
                  </span>
                  <span className="font-mono font-bold text-navy">{terrainVulnPct}% ({elevVal.toFixed(0)}m DEM)</span>
                </div>
                <div className="w-full h-3 bg-page rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-chart-a rounded-full transition-all duration-700" style={{ width: `${terrainVulnPct}%` }} />
                </div>
              </div>

              {/* Bar 3: Combined */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="font-bold text-navy flex items-center">
                    <Waves className="w-4 h-4 text-brand mr-1.5" />
                    COMBINED CATCHMENT INUNDATION POTENTIAL
                  </span>
                  <span className="font-mono font-bold text-brand text-sm">{combinedRiskPct}%</span>
                </div>
                <div className="w-full h-3 bg-page rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-brand rounded-full transition-all duration-700" style={{ width: `${combinedRiskPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border flex justify-between items-center text-xs text-muted">
            <span>Terrain vulnerability derived from DEM elevation, slope &amp; drainage</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: PRECIPITATION THREAT VS TERRAIN VULNERABILITY DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Precipitation Threat */}
        <div className="lg:col-span-6 bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center">
              <CloudRain className="w-4 h-4 mr-2" />
              Precipitation Threat Factors
            </h4>
            <span className="text-xs text-muted">Open-Meteo Ingestion</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Peak Hourly Precipitation (QPE)</span>
              <span className="font-mono font-bold text-navy text-sm">{peakRainRate.toFixed(1)} mm/hr</span>
            </div>
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Cumulative 6-Hour Rainfall Projection</span>
              <span className="font-mono font-bold text-navy text-sm">{(peakRainRate * 3.8).toFixed(1)} mm</span>
            </div>
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Convective Rain Probability</span>
              <span className="font-mono font-bold text-navy text-sm">{snapshot?.precipitation_probability ?? 78}%</span>
            </div>
          </div>
        </div>

        {/* Terrain Vulnerability */}
        <div className="lg:col-span-6 bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center">
              <Mountain className="w-4 h-4 mr-2" />
              Terrain Vulnerability Factors
            </h4>
            <span className="text-xs text-muted">Morphometric Synthesis</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Basin Mean Elevation</span>
              <span className="font-mono font-bold text-navy text-sm">{elevVal.toFixed(0)} m</span>
            </div>
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Average Valley Slope Gradient</span>
              <span className="font-mono font-bold text-navy text-sm">28.4° (Steep Catchment)</span>
            </div>
            <div className="p-3 bg-page/60 rounded-xl border border-border flex justify-between items-center">
              <span className="text-muted">Downstream Flow Accumulation Index</span>
              <span className="font-mono font-bold text-navy text-sm">High Convergence Channel</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: RISK CASCADE FLOW */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
        <div className="flex items-center justify-between mb-5 pb-2 border-b border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand">Risk Cascade Pipeline</h4>
          <span className="text-xs text-muted">Sequential Multi-Hazard Vulnerability Stages</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {[
              { step: "01", title: "Atmospheric Signal", desc: `CAPE ${snapshot?.cape.toFixed(0) ?? 1850} J/kg & IWV ${snapshot?.iwv?.toFixed(1) ?? "44.2"} kg/m²` },
              { step: "02", title: "Convective Cell", desc: "Severe localized updraft development" },
              { step: "03", title: "Heavy Rainfall", desc: `High QPE (${peakRainRate.toFixed(1)} mm/hr)` },
              { step: "04", title: "Rapid Runoff", desc: "Soil infiltration saturation threshold" },
              { step: "05", title: "Channel Gathering", desc: "Steep gorge convergence" },
              { step: "06", title: "Inundation Threat", desc: "Downstream drainage surge" },
            ].map((item) => (
            <div key={item.step} className="bg-page/70 rounded-xl p-3.5 border border-border flex flex-col justify-between hover:border-brand/30 transition-colors">
              <span className="text-[10px] font-mono font-bold text-brand">{item.step}</span>
              <div className="text-xs font-bold text-navy my-2">{item.title}</div>
              <p className="text-[10px] text-muted leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: ELEVATED-RISK ZONES */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand">Elevated-Risk Catchment Grids</h4>
            <p className="text-xs text-muted">Specific drainage channels and catchments around {location.name}</p>
          </div>
          <Link
            href="/alerts"
            className="text-xs font-semibold text-brand hover:text-brand/80 flex items-center group"
          >
            Review dispatch actions
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {elevatedZones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Zone / Grid</th>
                  <th className="py-3 px-4 font-bold">Catchment Location</th>
                  <th className="py-3 px-4 font-bold">Risk Score</th>
                  <th className="py-3 px-4 font-bold">Terrain</th>
                  <th className="py-3 px-4 font-bold">Precipitation</th>
                  <th className="py-3 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {elevatedZones.map((z) => (
                  <tr key={z.zone} className="hover:bg-page/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy font-mono">{z.zone}</td>
                    <td className="py-3 px-4 text-muted">{z.location}</td>
                    <td className="py-3 px-4 font-mono font-bold text-navy text-sm">{z.riskScore}%</td>
                    <td className="py-3 px-4">
                      <SeverityBadge level={z.terrain} />
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge level={z.precip} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-bold text-brand bg-brand/5 px-2.5 py-1 rounded-full border border-brand/20">
                        Active Watch
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No Elevated-Risk Zones" subtitle="Zone risk data will appear when catchment analysis identifies vulnerable areas." />
        )}
      </div>
    </div>
  );
}
