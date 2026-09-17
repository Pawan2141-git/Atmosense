"use client";

import { TileLayer } from "react-leaflet";

export type BasemapStyle = "osm" | "satellite" | "topo" | "dark";

export interface BasemapLayerProps {
  style?: BasemapStyle;
  fallbackUrl?: string;
  fallbackAttribution?: string;
}

const BASEMAP_TILES: Record<BasemapStyle, { url: string; attribution: string; maxZoom: number }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
};

export default function BasemapLayer({
  style = "osm",
  fallbackUrl,
  fallbackAttribution,
}: BasemapLayerProps) {
  const current = BASEMAP_TILES[style] || BASEMAP_TILES.osm;
  const url = fallbackUrl || current.url;
  const attribution = fallbackAttribution || current.attribution;

  return (
    <TileLayer
      key={style + (fallbackUrl || "")}
      url={url}
      attribution={attribution}
      maxZoom={current.maxZoom}
    />
  );
}