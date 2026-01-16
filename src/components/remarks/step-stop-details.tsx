"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload, X, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRemarkStore } from "@/stores/remark-store";
import { useFileUpload } from "@/hooks/use-file-upload";

export function StepStopDetails() {
  const { stops, updateStop, activeStopId, setActiveStopId } = useRemarkStore();

  const activeStop = stops.find((s) => s.id === activeStopId) || stops[0];

  if (stops.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">
          No stops added. Go back to add stops on the map.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 text-xl font-semibold">Stop Details</h2>

      <Tabs
        value={activeStop?.id}
        onValueChange={(value) => setActiveStopId(value)}
      >
        <TabsList className="mb-6 flex-wrap">
          {stops.map((stop, index) => (
            <TabsTrigger key={stop.id} value={stop.id}>
              Stop {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {stops.map((stop, index) => (
          <TabsContent key={stop.id} value={stop.id}>
            <StopDetailForm
              stop={stop}
              index={index}
              onUpdate={(data) => updateStop(stop.id, data)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface StopDetailFormProps {
  stop: {
    id: string;
    title: string;
    description?: string;
    audioUrl?: string;
    images?: string[];
  };
  index: number;
  onUpdate: (data: Partial<typeof stop>) => void;
}

function StopDetailForm({ stop, index, onUpdate }: StopDetailFormProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const audioUpload = useFileUpload({
    onSuccess: (result) => {
      onUpdate({ audioUrl: result.url });
    },
  });

  const imageUpload = useFileUpload({
    onSuccess: (result) => {
      const currentImages = stop.images || [];
      onUpdate({ images: [...currentImages, result.url] });
    },
  });

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await audioUpload.upload(file, "audio");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await imageUpload.upload(file, "image");
    }
  };

  const removeImage = (imageUrl: string) => {
    const currentImages = stop.images || [];
    onUpdate({ images: currentImages.filter((img) => img !== imageUrl) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </div>
          Stop {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor={`title-${stop.id}`}>Title *</Label>
          <Input
            id={`title-${stop.id}`}
            value={stop.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Stop title"
            maxLength={128}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor={`description-${stop.id}`}>Description</Label>
          <Textarea
            id={`description-${stop.id}`}
            value={stop.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe this stop..."
            maxLength={2048}
            rows={4}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Audio Narration</Label>
          <div className="mt-2">
            {stop.audioUrl ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Music className="h-5 w-5 text-muted-foreground" />
                <audio src={stop.audioUrl} controls className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate({ audioUrl: undefined })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={audioUpload.isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {audioUpload.isUploading ? "Uploading..." : "Upload audio file"}
                </span>
              </button>
            )}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioChange}
            />
          </div>
        </div>

        <div>
          <Label>Images</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(stop.images || []).map((image, imgIndex) => (
              <div
                key={imgIndex}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={image}
                  alt={`Stop ${index + 1} image ${imgIndex + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeImage(image)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {(stop.images?.length || 0) < 5 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUpload.isUploading}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              >
                <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {imageUpload.isUploading ? "..." : "Add"}
                </span>
              </button>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
