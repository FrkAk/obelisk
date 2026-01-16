"use client";

import Link from "next/link";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MyRemarksPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: remarks, isLoading } = trpc.remark.myRemarks.useQuery({ limit: 50 });

  const deleteMutation = trpc.remark.delete.useMutation({
    onSuccess: () => {
      utils.remark.myRemarks.invalidate();
      toast({ title: "Remark deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete remark", variant: "destructive" });
    },
  });

  const updateMutation = trpc.remark.update.useMutation({
    onSuccess: () => {
      utils.remark.myRemarks.invalidate();
      toast({ title: "Remark updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update remark", variant: "destructive" });
    },
  });

  const togglePublish = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    updateMutation.mutate({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Remarks</h1>
          <p className="text-muted-foreground">
            Manage your created remarks
          </p>
        </div>
        <Link href="/remarks/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      {remarks?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No remarks yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first audio tour to get started.
          </p>
          <Link href="/remarks/create" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Remark
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {remarks?.map((remark) => (
            <RemarkCard
              key={remark.id}
              remark={remark}
              onTogglePublish={() => togglePublish(remark.id, remark.status)}
              onDelete={() => deleteMutation.mutate({ id: remark.id })}
              isDeleting={deleteMutation.isPending}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RemarkCardProps {
  remark: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    status: string;
    categories?: string[] | null;
    createdAt: Date;
  };
  onTogglePublish: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isUpdating: boolean;
}

function RemarkCard({ remark, onTogglePublish, onDelete, isDeleting, isUpdating }: RemarkCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1">{remark.title}</CardTitle>
          <Badge variant={remark.status === "published" ? "default" : "secondary"}>
            {remark.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {remark.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {remark.description}
          </p>
        )}
        {remark.categories && remark.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {remark.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Link href={`/remarks/${remark.slug}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePublish}
            disabled={isUpdating}
          >
            {remark.status === "published" ? (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3 w-3" />
                Publish
              </>
            )}
          </Button>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Remark</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{remark.title}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete();
                  setDeleteDialogOpen(false);
                }}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
