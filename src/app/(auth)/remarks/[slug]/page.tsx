"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { RemarkViewer } from "@/components/remarks/remark-viewer";
import { trpc } from "@/lib/trpc/client";

export default function RemarkViewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: remark, isLoading, error } = trpc.remark.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] p-4">
        <div className="flex h-full gap-4">
          <Skeleton className="flex-1" />
          <div className="hidden w-80 space-y-4 lg:block">
            <Skeleton className="h-48" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !remark) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Remark not found</h1>
          <p className="mt-2 text-muted-foreground">
            This remark may have been deleted or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <RemarkViewer
        id={remark.id}
        title={remark.title}
        description={remark.description}
        coverImageUrl={remark.coverImageUrl}
        categories={remark.categories}
        stops={remark.stops}
      />
    </div>
  );
}
