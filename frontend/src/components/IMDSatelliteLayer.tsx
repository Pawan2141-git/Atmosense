"use client";

import React, { useMemo } from "react";
import { ImageOverlay } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { Radio, Eye, EyeOff, Wind, Flame, Layers, Clock } from "lucide-react";

interface IMDSatelliteLayerProps {
  center: [number, number];
  opacity?: number;
  cloudMovement?: boolean;
}

/**
 * Renders the prototype IMD Satellite (INSAT-3DR TIR-1) infrared cloud overlay on the Leaflet map.
 * Geographically aligned around the active regional center.
 */
export function IMDSatelliteOverlay({
  center,
  opacity = 0.65,
  cloudMovement = true,
}: IMDSatelliteLayerProps) {
  const [lat, lon] = center;

  // Geographic bounds covering the regional sub-basin (~5.6° lat × 7.2° lon)
  const bounds: LatLngBoundsExpression = [
    [lat - 2.8, lon - 3.6],
    [lat + 2.8, lon + 3.6],
  ];

  // Build the SVG as a data URI so we can use ImageOverlay instead of SVGOverlay.
  // SVGOverlay calls getPosition() internally during zoomend which crashes with
  // "Cannot read properties of undefined (reading '_leaflet_pos')" when the
  // map pane isn't fully mounted yet. ImageOverlay is immune to this race.
  const svgDataUri = useMemo(() => {
    const animCSS = cloudMovement
      ? `@keyframes satCloudDrift {
           0%   { transform: translate(0px,  0px); }
           50%  { transform: translate(12px,-8px); }
           100% { transform: translate(0px,  0px); }
         }
         .sat-animated-cloud {
           animation: satCloudDrift 14s ease-in-out infinite;
           transform-origin: 50% 50%;
         }`
      : "";

    const svg = `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <defs>
    <style>${animCSS}</style>
    <filter id="irDeepBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
    <filter id="irCoreBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="irFeather" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <radialGradient id="irSevereCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="15%"  stop-color="#FB7185" stop-opacity="0.92"/>
      <stop offset="30%"  stop-color="#E11D48" stop-opacity="0.88"/>
      <stop offset="50%"  stop-color="#9333EA" stop-opacity="0.80"/>
      <stop offset="70%"  stop-color="#06B6D4" stop-opacity="0.65"/>
      <stop offset="85%"  stop-color="#38BDF8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="irSecondaryCell" cx="45%" cy="45%" r="50%">
      <stop offset="0%"   stop-color="#F43F5E" stop-opacity="0.88"/>
      <stop offset="35%"  stop-color="#7C3AED" stop-opacity="0.75"/>
      <stop offset="65%"  stop-color="#0284C7" stop-opacity="0.55"/>
      <stop offset="90%"  stop-color="#0EA5E9" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#0EA5E9" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="irCirrusShield" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#E0F2FE" stop-opacity="0.55"/>
      <stop offset="40%"  stop-color="#BAE6FD" stop-opacity="0.40"/>
      <stop offset="75%"  stop-color="#7DD3FC" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#7DD3FC" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="irFeederBand" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#06B6D4" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#38BDF8" stop-opacity="0.45"/>
      <stop offset="70%"  stop-color="#818CF8" stop-opacity="0.60"/>
      <stop offset="100%" stop-color="#C084FC" stop-opacity="0.20"/>
    </linearGradient>
  </defs>
  <g class="${cloudMovement ? "sat-animated-cloud" : ""}">
    <path d="M 180 320 C 220 200, 380 140, 520 180 C 660 220, 820 160, 880 280 C 940 400, 840 520, 720 540 C 600 560, 480 620, 340 580 C 200 540, 140 440, 180 320 Z"
      fill="url(#irCirrusShield)" filter="url(#irDeepBlur)"/>
    <path d="M 120 580 C 220 520, 320 460, 420 380 C 500 320, 620 280, 760 220 C 820 190, 890 210, 920 170 C 890 150, 780 180, 680 220 C 560 270, 460 330, 360 410 C 260 490, 180 540, 120 580 Z"
      fill="url(#irFeederBand)" filter="url(#irFeather)"/>
    <ellipse cx="510" cy="340" rx="190" ry="140" fill="url(#irSevereCore)" filter="url(#irCoreBlur)" transform="rotate(-15 510 340)"/>
    <ellipse cx="505" cy="335" rx="75" ry="55" fill="#FFFFFF" opacity="0.9" filter="url(#irFeather)"/>
    <ellipse cx="515" cy="330" rx="40" ry="30" fill="#FEE2E2" opacity="0.95" filter="url(#irFeather)"/>
    <ellipse cx="660" cy="410" rx="130" ry="95" fill="url(#irSecondaryCell)" filter="url(#irCoreBlur)" transform="rotate(20 660 410)"/>
    <circle cx="665" cy="405" r="38" fill="#FEE2E2" opacity="0.85" filter="url(#irFeather)"/>
    <ellipse cx="320" cy="430" rx="110" ry="75" fill="url(#irSecondaryCell)" filter="url(#irCoreBlur)" transform="rotate(-30 320 430)"/>
    <g opacity="0.12" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="4 6">
      <line x1="100" y1="200" x2="900" y2="200"/>
      <line x1="100" y1="350" x2="900" y2="350"/>
      <line x1="100" y1="500" x2="900" y2="500"/>
      <line x1="300" y1="100" x2="300" y2="600"/>
      <line x1="500" y1="100" x2="500" y2="600"/>
      <line x1="700" y1="100" x2="700" y2="600"/>
    </g>
  </g>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [cloudMovement]);

  return (
    <ImageOverlay
      url={svgDataUri}
      bounds={bounds}
      opacity={opacity}
      zIndex={400}
    />
  );
}

/**
 * Compact, dark technical legend overlay for the IMD Satellite prototype.
 */
export function IMDSatelliteLegend({
  onClose,
  opacity,
  setOpacity,
  cloudMovement,
  setCloudMovement,
}: {
  onClose?: () => void;
  opacity: number;
  setOpacity: (val: number) => void;
  cloudMovement: boolean;
  setCloudMovement: (val: boolean) => void;
}) {
  return (
    <div className="absolute top-14 left-3 z-[450] w-[280px] sm:w-[310px] bg-[#0B132B]/95 backdrop-blur-md rounded-2xl border border-cyan-500/40 shadow-[0_12px_36px_rgba(3,7,18,0.45)] p-3.5 text-white pointer-events-auto select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-extrabold tracking-wide text-white">Demo Cloud Overlay</span>
              <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
                SYNTHETIC
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80 block">
              Synthetic infrared visualization
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors text-xs font-mono"
            title="Hide Satellite Overlay"
          >
            ✕
          </button>
        )}
      </div>

      {/* Observation Telemetry Summary */}
      <div className="space-y-2 text-[11px]">
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-700/60 space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> Infrared
            </span>
              <span className="text-cyan-300 font-bold">Synthetic infrared pattern</span>
          </div>

          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" /> Cloud Top
            </span>
            <span className="text-rose-400 font-bold">-68.4°C · ~13.8 km</span>
          </div>

          <div className="flex justify-between items-center text-[10.5px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-emerald-400" /> Cloud Movement
            </span>
            <span className="text-emerald-400 font-bold">ENE @ 24 km/h (Loop ON)</span>
          </div>

          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-amber-400" /> Last Updated
            </span>
            <span className="text-slate-200">15-Sep 00:00 UTC (T-15m)</span>
          </div>
        </div>

        {/* Thermal Infrared False-Color Ramp */}
        <div className="pt-1">
          <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-300 mb-1">
            <span className="text-rose-400 font-bold">&lt; -70°C (Overshooting)</span>
            <span className="text-cyan-400">-40°C</span>
            <span className="text-slate-400">&gt; 0°C (Clear)</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700/80 flex shadow-inner">
            <div className="h-full w-[25%] bg-gradient-to-r from-white via-rose-500 to-purple-600" />
            <div className="h-full w-[35%] bg-gradient-to-r from-purple-600 via-cyan-400 to-sky-500" />
            <div className="h-full w-[40%] bg-gradient-to-r from-sky-500/70 via-slate-300/40 to-transparent" />
          </div>
        </div>

        {/* Quick Controls: Opacity & Movement */}
        <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2 text-[10px] font-mono">
          {/* Opacity Control */}
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span>Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-cyan-300">{Math.round(opacity * 100)}%</span>
          </div>

          {/* Movement Toggle */}
          <button
            onClick={() => setCloudMovement(!cloudMovement)}
            className={`px-2 py-0.5 rounded-lg border text-[9.5px] font-bold transition-colors flex items-center gap-1 ${
              cloudMovement
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {cloudMovement ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
            <span>{cloudMovement ? "Loop ON" : "Paused"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact toggle button to turn the IMD Satellite prototype layer ON/OFF.
 */
export function IMDSatelliteToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] shadow-sm ${
        active
          ? "bg-[#0B132B] text-cyan-300 border border-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.4)]"
          : "bg-white/95 text-muted hover:text-navy border border-border hover:border-cyan-400/40"
      }`}
      title="Toggle demo cloud overlay"
    >
      <Radio className={`w-3.5 h-3.5 ${active ? "text-cyan-400 animate-pulse" : "text-muted"}`} />
      <span>Demo Cloud Overlay</span>
      <span
        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
          active
            ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}
      >
        DEMO
      </span>
    </button>
  );
}
