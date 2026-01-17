"use client";

import { useRef, useCallback, useState } from "react";
import Map, { NavigationControl, GeolocateControl, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRemarkStore, type RemarkStop } from "@/stores/remark-store";
import { StopMarker } from "./stop-marker";
import { StopRouteLayer } from "./stop-route-layer";
import { DEFAULT_MAP_CENTER } from "@/lib/constants/map";
import "maplibre-gl/dist/maplibre-gl.css";

export function StepMapStops() {
  const mapRef = useRef<MapRef>(null);
  const { stops, addStop, updateStop, removeStop, activeStopId, setActiveStopId, formData, setFormData } = useRemarkStore();
  const [deleteConfirmStop, setDeleteConfirmStop] = useState<RemarkStop | null>(null);

  const [viewState, setViewState] = useState({
    longitude: formData.centerLongitude ? parseFloat(formData.centerLongitude) : DEFAULT_MAP_CENTER.longitude,
    latitude: formData.centerLatitude ? parseFloat(formData.centerLatitude) : DEFAULT_MAP_CENTER.latitude,
    zoom: 13,
  });

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { lng, lat } = e.lngLat;

      const newStop: RemarkStop = {
        id: crypto.randomUUID(),
        longitude: lng.toString(),
        latitude: lat.toString(),
        title: `Stop ${stops.length + 1}`,
        description: "",
      };

      addStop(newStop);
      setActiveStopId(newStop.id);

      if (stops.length === 0) {
        setFormData({
          centerLongitude: lng.toString(),
          centerLatitude: lat.toString(),
        });
      }
    },
    [stops.length, addStop, setActiveStopId, setFormData]
  );

  const handleStopDragEnd = useCallback(
    (stopId: string, e: { lngLat: { lng: number; lat: number } }) => {
      updateStop(stopId, {
        longitude: e.lngLat.lng.toString(),
        latitude: e.lngLat.lat.toString(),
      });
    },
    [updateStop]
  );

  const handleDeleteStop = (stop: RemarkStop) => {
    setDeleteConfirmStop(stop);
  };

  const confirmDeleteStop = () => {
    if (deleteConfirmStop) {
      removeStop(deleteConfirmStop.id);
      setDeleteConfirmStop(null);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          onClick={handleMapClick}
          mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
          cursor="crosshair"
        >
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" trackUserLocation />
          <StopRouteLayer stops={stops} />
          {stops.map((stop, index) => (
            <StopMarker
              key={stop.id}
              longitude={parseFloat(stop.longitude)}
              latitude={parseFloat(stop.latitude)}
              sequenceNumber={index + 1}
              isActive={activeStopId === stop.id}
              onClick={() => setActiveStopId(stop.id)}
              draggable
              onDragEnd={(e) => handleStopDragEnd(stop.id, e)}
            />
          ))}
        </Map>

        <div className="absolute left-4 top-4 rounded-lg bg-background/90 p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-medium">Click on the map to add stops</p>
          <p className="text-xs text-muted-foreground">
            Drag markers to reposition them
          </p>
        </div>
      </div>

      <div className="h-64 w-full overflow-y-auto border-t p-4 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
        <h3 className="mb-3 font-semibold">Stops ({stops.length})</h3>

        {stops.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stops added yet. Click on the map to add your first stop.
          </p>
        ) : (
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <Card
                key={stop.id}
                className={`cursor-pointer transition-all ${activeStopId === stop.id ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() => {
                  setActiveStopId(stop.id);
                  mapRef.current?.flyTo({
                    center: [parseFloat(stop.longitude), parseFloat(stop.latitude)],
                    zoom: 16,
                    duration: 500,
                  });
                }}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{stop.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(stop.latitude).toFixed(4)}, {parseFloat(stop.longitude).toFixed(4)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStop(stop);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteConfirmStop}
        onOpenChange={(open: boolean) => !open && setDeleteConfirmStop(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this stop?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirmStop?.title}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
