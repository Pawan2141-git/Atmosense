import type { FeatureCollection, Feature, Polygon, Point } from "geojson";
import type { GridCell, OpenMeteoGridData } from "./api";

/**
 * Color mappings for risk levels
 */
export const RISK_COLORS = {
  low: {
    stroke: "#10b981", // emerald-500
    fill: "#10b981",
    bgClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badge: "bg-emerald-500",
  },
  moderate: {
    stroke: "#f59e0b", // amber-500
    fill: "#f59e0b",
    bgClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badge: "bg-amber-500",
  },
  high: {
    stroke: "#f97316", // orange-500
    fill: "#f97316",
    bgClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    badge: "bg-orange-500",
  },
  critical: {
    stroke: "#ef4444", // red-500
    fill: "#ef4444",
    bgClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    badge: "bg-red-500",
  },
} as const;

/**
 * Returns the color code for a specific risk level
 */
export function getRiskColor(riskLevel?: string): string {
  if (!riskLevel) return "#64748b";
  const key = riskLevel.toLowerCase() as keyof typeof RISK_COLORS;
  return RISK_COLORS[key]?.fill || "#64748b";
}

/**
 * Converts a grid cell into a GeoJSON Polygon bounding box
 */
export function gridCellToPolygonFeature(
  cell: GridCell,
  cellSizeDeg: number = 0.2
): Feature<Polygon, GridCell> {
  const half = cellSizeDeg / 2;
  const minLat = cell.lat - half;
  const maxLat = cell.lat + half;
  const minLon = cell.lon - half;
  const maxLon = cell.lon + half;

  return {
    type: "Feature",
    properties: { ...cell },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    },
  };
}

/**
 * Converts a grid cell into a GeoJSON Point feature for marker placement
 */
export function gridCellToPointFeature(cell: GridCell): Feature<Point, GridCell> {
  return {
    type: "Feature",
    properties: { ...cell },
    geometry: {
      type: "Point",
      coordinates: [cell.lon, cell.lat],
    },
  };
}

/**
 * Converts OpenMeteoGridData cells into a FeatureCollection of polygons for heatmap/grid rendering
 */
export function convertGridToPolygonGeoJSON(
  gridData: OpenMeteoGridData,
  cellSizeDeg: number = 0.2
): FeatureCollection<Polygon, GridCell> {
  return {
    type: "FeatureCollection",
    features: gridData.cells.map((cell) =>
      gridCellToPolygonFeature(cell, cellSizeDeg)
    ),
  };
}

/**
 * Converts OpenMeteoGridData cells into a FeatureCollection of point markers
 */
export function convertGridToPointGeoJSON(
  gridData: OpenMeteoGridData
): FeatureCollection<Point, GridCell> {
  return {
    type: "FeatureCollection",
    features: gridData.cells.map((cell) => gridCellToPointFeature(cell)),
  };
}

/**
 * Computes bounding box [ [south, west], [north, east] ] from a set of grid cells
 */
export function calculateGridBounds(
  cells: GridCell[],
  paddingDeg: number = 0.1
): [[number, number], [number, number]] {
  if (cells.length === 0) {
    return [
      [20.5937 - 1, 78.9629 - 1],
      [20.5937 + 1, 78.9629 + 1],
    ];
  }

  let minLat = cells[0].lat;
  let maxLat = cells[0].lat;
  let minLon = cells[0].lon;
  let maxLon = cells[0].lon;

  for (const c of cells) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
  }

  return [
    [minLat - paddingDeg, minLon - paddingDeg],
    [maxLat + paddingDeg, maxLon + paddingDeg],
  ];
}
