"use client";

import React from "react";

export type WeatherType =
  | "sunny"
  | "mostly-sunny"
  | "partly-cloudy"
  | "cloudy"
  | "light-rain"
  | "heavy-rain"
  | "thunderstorm"
  | "severe-storm";

interface WeatherIconProps {
  type: WeatherType;
  size?: number;
  className?: string;
  darkBadge?: boolean;
  title?: string;
}

export const WEATHER_LABELS: Record<WeatherType, string> = {
  "sunny": "Clear & Sunny",
  "mostly-sunny": "Mostly Sunny",
  "partly-cloudy": "Partly Cloudy",
  "cloudy": "Cloudy / Overcast",
  "light-rain": "Light Rain / Drizzle",
  "heavy-rain": "Heavy Rain / Downpour",
  "thunderstorm": "Thunderstorm / Lightning",
  "severe-storm": "Severe Thunderstorm with Rain",
};

export default function WeatherIcon({
  type,
  size = 36,
  className = "",
  darkBadge = true,
  title,
}: WeatherIconProps) {
  const iconTitle = title || WEATHER_LABELS[type] || type;

  const renderSvg = () => {
    switch (type) {
      // 1. Sunny / Clear Sky (Yellow sun with 8 rays)
      case "sunny":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Center sun */}
            <circle
              cx="32"
              cy="32"
              r="10.5"
              stroke="#F59E0B"
              strokeWidth="3.5"
            />
            {/* 8 Radiating Rays */}
            <line x1="32" y1="8" x2="32" y2="15" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="32" y1="49" x2="32" y2="56" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="8" y1="32" x2="15" y2="32" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="49" y1="32" x2="56" y2="32" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="15" y1="15" x2="20" y2="20" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="44" y1="44" x2="49" y2="49" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="49" y1="15" x2="44" y2="20" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="15" y1="49" x2="20" y2="44" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );

      // 2. Mostly Sunny (Yellow sun behind a small white cloud in front)
      case "mostly-sunny":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Sun in background */}
            <circle
              cx="37"
              cy="25"
              r="9"
              stroke="#F59E0B"
              strokeWidth="3.5"
            />
            <line x1="37" y1="8" x2="37" y2="12.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="51" y1="25" x2="55.5" y2="25" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="47" y1="15" x2="50.5" y2="11.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="47" y1="35" x2="50.5" y2="38.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="27" y1="15" x2="23.5" y2="11.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />

            {/* Small Cloud overlapping in foreground on bottom-left */}
            <path
              d="M 21 44 h 16 c 4 0 7 -3 7 -7 c 0 -3.5 -2.5 -6.3 -6 -6.8 c -0.6 -4.8 -4.6 -8.2 -9.5 -8.2 c -4.2 0 -7.8 2.6 -9.2 6.5 c -0.8 -0.4 -1.8 -0.5 -2.8 -0.5 c -4 0 -7.5 3.2 -7.5 7.5 c 0 4.4 3.6 8.5 8 8.5 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={darkBadge ? "#1E222D" : "#ffffff"}
            />
          </svg>
        );

      // 3. Partly Cloudy (Large cloud in front with yellow sun peeking behind upper-right)
      case "partly-cloudy":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Sun rays peeking from behind top-right of cloud */}
            <path
              d="M 37 19 A 8 8 0 0 1 47 27"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line x1="42" y1="11" x2="42" y2="15" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="50" y1="14" x2="53.5" y2="10.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="53" y1="23" x2="57" y2="23" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="49" y1="31" x2="52.5" y2="34.5" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />

            {/* Main Cloud in front */}
            <path
              d="M 22 44 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={darkBadge ? "#1E222D" : "#ffffff"}
            />
          </svg>
        );

      // 4. Cloudy / Overcast (Single clean white cloud outline)
      case "cloudy":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <path
              d="M 21 44 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        );

      // 5. Light Rain / Drizzle (Cloud with 4 short blue vertical/slanted dashes)
      case "light-rain":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Cloud */}
            <path
              d="M 21 38 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* 4 Light Rain Dashes */}
            <line x1="20" y1="46" x2="18.5" y2="52" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <line x1="27" y1="46" x2="25.5" y2="52" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <line x1="34" y1="46" x2="32.5" y2="52" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <line x1="41" y1="46" x2="39.5" y2="52" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      // 6. Heavy Rain (Cloud with 4 longer blue diagonal rain streaks)
      case "heavy-rain":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Cloud */}
            <path
              d="M 21 37 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* 4 Longer Slanted Rain Streaks */}
            <line x1="22" y1="44" x2="17" y2="56" stroke="#0EA5E9" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="29" y1="44" x2="24" y2="56" stroke="#0EA5E9" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="36" y1="44" x2="31" y2="56" stroke="#0EA5E9" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="43" y1="44" x2="38" y2="56" stroke="#0EA5E9" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        );

      // 7. Thunderstorm (Cloud with sharp yellow zigzag lightning bolt)
      case "thunderstorm":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Cloud */}
            <path
              d="M 21 38 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Yellow Lightning Bolt */}
            <path
              d="M 33 33 L 26 44 H 34 L 27 57 L 41 43 H 33 L 37 33 Z"
              fill="#F59E0B"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        );

      // 8. Severe Storm (Thunderstorm with Rain: Cloud with yellow lightning bolt + blue rain streaks)
      case "severe-storm":
        return (
          <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            {/* Cloud */}
            <path
              d="M 21 38 h 22 c 5.5 0 9.5 -4 9.5 -9.5 c 0 -4.8 -3.4 -8.8 -8 -9.4 c -0.8 -6.5 -6.2 -11.6 -13 -11.6 c -5.5 0 -10.2 3.3 -12.2 8.2 c -1.2 -0.5 -2.5 -0.7 -3.8 -0.7 c -5.5 0 -10 4.5 -10 10 c 0 5.2 4 9.5 9.2 9.9 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Left rain streaks */}
            <line x1="18" y1="45" x2="15" y2="53" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="23" y1="46" x2="20.5" y2="53" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Center Yellow Lightning Bolt */}
            <path
              d="M 34 33 L 28 44 H 35 L 29 57 L 41 43 H 34 L 38 33 Z"
              fill="#F59E0B"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Right rain streaks */}
            <line x1="42" y1="46" x2="39.5" y2="53" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="47" y1="45" x2="44" y2="53" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        );

      default:
        return null;
    }
  };

  if (darkBadge) {
    return (
      <div
        title={iconTitle}
        className={`inline-flex items-center justify-center rounded-2xl bg-[#1E222D] shadow-[0_4px_16px_rgba(15,23,42,0.3)] border border-slate-700/60 p-1.5 transition-transform hover:scale-105 ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        {renderSvg()}
      </div>
    );
  }

  return (
    <span title={iconTitle} className={`inline-flex items-center justify-center ${className}`}>
      {renderSvg()}
    </span>
  );
}

/**
 * Derives the best matching WeatherType from live Open-Meteo telemetry variables.
 */
export function getWeatherTypeFromTelemetry(
  cloudCover: number = 0,
  precipitation: number = 0,
  cape: number = 0
): WeatherType {
  // Convective / Severe Conditions
  if (cape > 1500 && precipitation > 10) {
    return "severe-storm";
  }
  if (cape > 1400 || (cape > 900 && precipitation > 5)) {
    return "thunderstorm";
  }

  // Precipitation Conditions
  if (precipitation > 12) {
    return "heavy-rain";
  }
  if (precipitation > 0.5) {
    return "light-rain";
  }

  // Cloud Cover Conditions
  if (cloudCover > 70) {
    return "cloudy";
  }
  if (cloudCover > 35) {
    return "partly-cloudy";
  }
  if (cloudCover > 10) {
    return "mostly-sunny";
  }

  return "sunny";
}

/**
 * Maps hazard names (e.g. thunderstorm, cloudburst, flash_flood) to the corresponding weather icon.
 */
export function getHazardWeatherType(hazard: string): WeatherType {
  const h = hazard.toLowerCase().replace(/[_\s-]/g, "");
  if (h.includes("thunder") || h.includes("storm") || h.includes("lightning")) {
    return "severe-storm";
  }
  if (h.includes("cloudburst") || h.includes("downpour") || h.includes("heavyrain")) {
    return "heavy-rain";
  }
  if (h.includes("flood") || h.includes("water") || h.includes("inundat")) {
    return "heavy-rain";
  }
  return "cloudy";
}
