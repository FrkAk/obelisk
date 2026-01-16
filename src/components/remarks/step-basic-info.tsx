"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRemarkStore } from "@/stores/remark-store";
import { useFileUpload } from "@/hooks/use-file-upload";

const CATEGORIES = [
  "History",
  "Art",
  "Architecture",
  "Nature",
  "Food",
  "Culture",
  "Music",
  "Shopping",
  "Nightlife",
  "Sports",
];

export function StepBasicInfo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formData, setFormData } = useRemarkStore();
  const { upload, isUploading } = useFileUpload({
    onSuccess: (result) => {
      setFormData({ coverImageUrl: result.url });
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file, "image");
    }
  };

  const toggleCategory = (category: string) => {
    const current = formData.categories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setFormData({ categories: updated });
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>

      <div className="space-y-6">
        <div>
          <Label htmlFor="cover-image">Cover Image</Label>
          <div className="mt-2">
            {formData.coverImageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={formData.coverImageUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => setFormData({ coverImageUrl: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isUploading ? "Uploading..." : "Click to upload cover image"}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ title: e.target.value })}
            placeholder="Enter a title for your remark"
            maxLength={128}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ description: e.target.value })}
            placeholder="Describe your remark..."
            maxLength={2048}
            rows={4}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Categories</Label>
          <p className="text-sm text-muted-foreground">Select up to 3 categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const isSelected = formData.categories.includes(category);
              const isDisabled = !isSelected && formData.categories.length >= 3;

              return (
                <Badge
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => !isDisabled && toggleCategory(category)}
                >
                  {category}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
