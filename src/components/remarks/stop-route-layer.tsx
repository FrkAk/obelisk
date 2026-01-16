"use client";

import { Source, Layer } from "react-map-gl/maplibre";

interface Stop {
  longitude: string;
  latitude: string;
}

interface StopRouteLayerProps {
  stops: Stop[];
}

export function StopRouteLayer({ stops }: StopRouteLayerProps) {
  if (stops.length < 2) {
    return null;
  }

  const coordinates = stops.map((stop) => [
    parseFloat(stop.longitude),
    parseFloat(stop.latitude),
  ]);

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };

  return (
    <Source id="route" type="geojson" data={geojson}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#4f46e5",
          "line-width": 3,
          "line-opacity": 0.7,
          "line-dasharray": [2, 1],
        }}
      />
    </Source>
  );
}
