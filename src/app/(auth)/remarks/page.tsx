"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Bookmark, MapPinOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RemarkList } from "@/components/remarks/remark-list";
import { trpc } from "@/lib/trpc/client";
import { useGeolocation } from "@/hooks/use-geolocation";

function getGeolocationErrorMessage(error: GeolocationPositionError | null) {
  if (!error) return null;

  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        title: "Location Permission Denied",
        description: "Please enable location access in your browser settings to see remarks near you.",
        icon: MapPinOff,
        action: null,
      };
    case error.POSITION_UNAVAILABLE:
      return {
        title: "Location Unavailable",
        description: "Your device couldn't determine your location. Make sure GPS is enabled and try again.",
        icon: AlertCircle,
        action: "retry",
      };
    case error.TIMEOUT:
      return {
        title: "Location Request Timed Out",
        description: "Getting your location took too long. Please check your connection and try again.",
        icon: RefreshCw,
        action: "retry",
      };
    default:
      return {
        title: "Location Error",
        description: error.message || "An unknown error occurred while getting your location.",
        icon: AlertCircle,
        action: "retry",
      };
  }
}

export default function RemarksPage() {
  const { latitude, longitude, error: geoError, loading, requestPosition } = useGeolocation({ watch: true });
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");

  const hasLocation = latitude !== null && longitude !== null;

  const nearbyQuery = trpc.remark.nearby.useQuery(
    {
      longitude: longitude?.toString() ?? "0",
      latitude: latitude?.toString() ?? "0",
      radiusKm: 50,
      limit: 20,
    },
    { enabled: hasLocation }
  );

  const savedQuery = trpc.remark.getSaved.useQuery({ limit: 20 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Remarks</h1>
          <p className="text-muted-foreground">
            Discover audio tours near you
          </p>
        </div>
        <Link href="/remarks/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Remark
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="nearby" className="gap-2">
            <MapPin className="h-4 w-4" />
            Nearby
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby">
          {geoError ? (
            (() => {
              const errorInfo = getGeolocationErrorMessage(geoError);
              const IconComponent = errorInfo?.icon ?? MapPin;
              return (
                <div className="rounded-xl bg-muted/50 border p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <IconComponent className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-lg">{errorInfo?.title ?? "Location Error"}</p>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    {errorInfo?.description ?? "Enable location access to see remarks near you."}
                  </p>
                  {errorInfo?.action === "retry" && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={requestPosition}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              );
            })()
          ) : !hasLocation || loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Getting your location...</p>
              </div>
            </div>
          ) : (
            <RemarkList
              remarks={nearbyQuery.data ?? []}
              isLoading={nearbyQuery.isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="saved">
          <RemarkList
            remarks={savedQuery.data ?? []}
            isLoading={savedQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
