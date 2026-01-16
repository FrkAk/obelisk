import { NextRequest, NextResponse } from "next/server";

import { validateRequest } from "@/lib/auth/session";
import { saveFile, StorageError, type FileType } from "@/lib/storage/local";

/**
 * Handles file upload requests.
 *
 * Args:
 *     request: The incoming request with multipart form data.
 *
 * Returns:
 *     JSON response with upload result or error.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as FileType | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!fileType || !["image", "audio"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'image' or 'audio'" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveFile(buffer, file.type, fileType);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
