"use client";

import { useState, useCallback, useRef } from "react";

import type { FileType, UploadResult } from "@/lib/storage/local";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn extends UploadState {
  upload: (file: File, type: FileType) => Promise<UploadResult | null>;
  reset: () => void;
  abort: () => void;
}

/**
 * Hook for handling file uploads with progress tracking.
 *
 * Args:
 *     options: Optional callbacks for success and error.
 *
 * Returns:
 *     Upload state and control functions.
 */
export function useFileUpload(options?: UseFileUploadOptions): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    reset();
  }, [reset]);

  const upload = useCallback(
    async (file: File, type: FileType): Promise<UploadResult | null> => {
      abortControllerRef.current = new AbortController();

      setState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        const result = data as UploadResult;

        setState({
          isUploading: false,
          progress: 100,
          error: null,
          result,
        });

        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }

        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setState({
          isUploading: false,
          progress: 0,
          error: errorMessage,
          result: null,
        });

        options?.onError?.(errorMessage);
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  return {
    ...state,
    upload,
    reset,
    abort,
  };
}
