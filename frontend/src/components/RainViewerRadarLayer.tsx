"use client";

import { useEffect, useRef, useState } from "react";
import { TileLayer } from "react-leaflet";

interface RainViewerFrame {
  path: string;
  time: number;
}

interface RainViewerMetadata {
  host?: string;
  radar?: {
    past?: RainViewerFrame[];
  };
}

interface RainViewerRadarLayerProps {
  onUnavailable?: () => void;
}

const RAINVIEWER_METADATA_URL = "https://api.rainviewer.com/public/weather-maps.json";
const METADATA_CACHE_TTL = 5 * 60 * 1000;

let metadataCache: { metadata: RainViewerMetadata; expiresAt: number } | null = null;
let metadataRequest: Promise<RainViewerMetadata> | null = null;

async function getRainViewerMetadata(): Promise<RainViewerMetadata> {
  if (metadataCache && metadataCache.expiresAt > Date.now()) {
    return metadataCache.metadata;
  }

  if (!metadataRequest) {
    metadataRequest = fetch(RAINVIEWER_METADATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`RainViewer metadata returned ${response.status}`);
        return response.json() as Promise<RainViewerMetadata>;
      })
      .then((metadata) => {
        metadataCache = { metadata, expiresAt: Date.now() + METADATA_CACHE_TTL };
        return metadata;
      })
      .finally(() => {
        metadataRequest = null;
      });
  }

  return metadataRequest;
}

export default function RainViewerRadarLayer({ onUnavailable }: RainViewerRadarLayerProps) {
  const [tileUrlPattern, setTileUrlPattern] = useState<string | null>(null);
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    let cancelled = false;

    getRainViewerMetadata()
      .then((metadata) => {
        const host = metadata.host || "https://tilecache.rainviewer.com";
        const frames = metadata.radar?.past;
        const latestFrame = Array.isArray(frames) && frames.length > 0 ? frames[frames.length - 1] : null;
        if (!latestFrame?.path) throw new Error("RainViewer returned no radar frame");

        // Format: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
        const pattern = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        if (!cancelled) {
          setTileUrlPattern(pattern);
        }
      })
      .catch((error) => {
        console.warn("RainViewer radar unavailable", error);
        if (!cancelled) {
          onUnavailableRef.current?.();
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!tileUrlPattern) return null;

  return (
    <TileLayer
      key={tileUrlPattern}
      url={tileUrlPattern}
      attribution={'<a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">Weather data by RainViewer</a>'}
      opacity={0.85}
      maxNativeZoom={7}
      maxZoom={18}
      zIndex={350}
    />
  );
}
