"use client";

import Image from "next/image";
import { MapPin, Music, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRemarkStore } from "@/stores/remark-store";

export function StepReview() {
  const { formData, stops } = useRemarkStore();

  const stopsWithAudio = stops.filter((s) => s.audioUrl).length;
  const stopsWithImages = stops.filter((s) => s.images && s.images.length > 0).length;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-xl font-semibold">Review Your Remark</h2>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.coverImageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={formData.coverImageUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Title</label>
              <p className="font-medium">{formData.title || "Untitled"}</p>
            </div>

            {formData.description && (
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <p className="text-sm">{formData.description}</p>
              </div>
            )}

            {formData.categories.length > 0 && (
              <div>
                <label className="text-sm text-muted-foreground">Categories</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {formData.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stops Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stops.length}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Stops</p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stopsWithAudio}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">With Audio</p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stopsWithImages}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">With Images</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{stop.title}</p>
                  {stop.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {stop.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {stop.audioUrl && (
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" /> Audio
                      </span>
                    )}
                    {stop.images && stop.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> {stop.images.length} image
                        {stop.images.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            By publishing this remark, you agree that it will be visible to other
            users. You can edit or delete it at any time from your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
