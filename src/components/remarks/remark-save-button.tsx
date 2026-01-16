"use client";

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface RemarkSaveButtonProps {
  remarkId: string;
  className?: string;
}

export function RemarkSaveButton({ remarkId, className }: RemarkSaveButtonProps) {
  const utils = trpc.useUtils();

  const { data } = trpc.remark.isSaved.useQuery({ remarkId });
  const saveMutation = trpc.remark.save.useMutation({
    onSuccess: () => {
      utils.remark.isSaved.invalidate({ remarkId });
      utils.remark.getSaved.invalidate();
    },
  });

  const isSaved = data?.saved ?? false;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        saveMutation.mutate({ remarkId });
      }}
      disabled={saveMutation.isPending}
    >
      <Bookmark
        className={cn("h-5 w-5", isSaved && "fill-current")}
      />
      <span className="sr-only">{isSaved ? "Unsave" : "Save"}</span>
    </Button>
  );
}
