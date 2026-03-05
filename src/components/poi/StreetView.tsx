"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";

interface StreetViewProps {
  mapillaryId: string;
  bearing: number;
  isPano?: boolean;
  interactive?: boolean;
  className?: string;
}

/**
 * Renders a Mapillary street-level image viewer.
 *
 * @param mapillaryId - Mapillary image key to display.
 * @param bearing - Camera bearing in degrees to orient the view.
 * @param isPano - Whether the image is a 360 panorama.
 * @param interactive - Enable pointer interaction (pan/zoom). Default false for carousel use.
 * @param className - Optional CSS class for the container.
 */
export default function StreetView({
  mapillaryId,
  bearing,
  isPano,
  interactive = false,
  className,
}: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN;
    if (!token) return;

    let removed = false;

    const viewer = new Viewer({
      accessToken: token,
      container: containerRef.current,
      imageId: mapillaryId,
      component: {
        attribution: false,
        bearing: false,
        cover: false,
        direction: false,
        keyboard: false,
        sequence: false,
        zoom: false,
        pointer: interactive,
      },
    });

    viewerRef.current = viewer;

    viewer.on("image", async () => {
      if (removed) return;
      setLoading(false);
      if (isPano && bearing !== 0) {
        const imageBearing = await viewer.getBearing();
        const delta = (((bearing - imageBearing + 540) % 360) - 180) / 360;
        viewer.setCenter([0.5 + delta, 0.5]);
        viewer.setZoom(0);
      } else {
        viewer.setCenter([0.5, 0.5]);
      }
    });

    return () => {
      removed = true;
      const suppress = (e: PromiseRejectionEvent) => {
        const name = e.reason?.name;
        if (name === "CancelMapillaryError" || name === "MapillaryError") {
          e.preventDefault();
        }
      };
      window.addEventListener("unhandledrejection", suppress);
      viewer.remove();
      viewerRef.current = null;
      Promise.resolve().then(() => window.removeEventListener("unhandledrejection", suppress));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapillaryId, interactive]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className ?? ""}`}>
      {loading && <div className="absolute inset-0 shimmer" />}
      <div ref={containerRef} className="w-full h-full" />
      <div
        className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full glass-floating text-[11px]"
        style={{
          fontFamily: "var(--font-ui)",
          color: "var(--foreground-tertiary)",
        }}
      >
        Street View
      </div>
    </div>
  );
}
