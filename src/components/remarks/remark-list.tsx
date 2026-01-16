"use client";

import { RemarkCard, RemarkCardSkeleton } from "./remark-card";

interface Remark {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  categories?: string[] | null;
  distanceMeters?: number;
  author?: {
    username: string;
    displayName?: string | null;
  };
}

interface RemarkListProps {
  remarks: Remark[];
  isLoading?: boolean;
}

export function RemarkList({ remarks, isLoading }: RemarkListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RemarkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (remarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No remarks found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to create a remark in this area!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {remarks.map((remark) => (
        <RemarkCard key={remark.id} {...remark} />
      ))}
    </div>
  );
}
