import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";

/**
 * Directory where uploads are stored.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Allowed MIME types for uploads.
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"],
};

/**
 * Maximum file sizes in bytes.
 */
const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
};

export type FileType = "image" | "audio";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Ensures the upload directory exists.
 *
 * Returns:
 *     The upload directory path.
 */
async function ensureUploadDir(): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

/**
 * Validates file type and size.
 *
 * Args:
 *     mimeType: The MIME type of the file.
 *     size: The size of the file in bytes.
 *     fileType: The expected file type category.
 *
 * Raises:
 *     StorageError: When validation fails.
 */
function validateFile(mimeType: string, size: number, fileType: FileType): void {
  const allowedTypes = ALLOWED_MIME_TYPES[fileType];
  if (!allowedTypes.includes(mimeType)) {
    throw new StorageError(
      `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
      "INVALID_FILE_TYPE"
    );
  }

  const maxSize = MAX_FILE_SIZES[fileType];
  if (size > maxSize) {
    throw new StorageError(
      `File too large. Maximum: ${maxSize / 1024 / 1024}MB`,
      "FILE_TOO_LARGE"
    );
  }
}

/**
 * Gets the file extension from MIME type.
 *
 * Args:
 *     mimeType: The MIME type.
 *
 * Returns:
 *     The file extension.
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".webm",
  };
  return extensions[mimeType] || "";
}

/**
 * Saves a file to local storage.
 *
 * Args:
 *     buffer: The file data as a Buffer.
 *     mimeType: The MIME type of the file.
 *     fileType: The file type category (image or audio).
 *
 * Returns:
 *     The upload result with URL and metadata.
 *
 * Raises:
 *     StorageError: When upload fails.
 */
export async function saveFile(
  buffer: Buffer,
  mimeType: string,
  fileType: FileType
): Promise<UploadResult> {
  validateFile(mimeType, buffer.length, fileType);

  await ensureUploadDir();

  const extension = getExtensionFromMimeType(mimeType);
  const filename = `${fileType}-${randomUUID()}${extension}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
    size: buffer.length,
    mimeType,
  };
}

/**
 * Deletes a file from storage.
 *
 * Args:
 *     url: The URL of the file to delete.
 *
 * Returns:
 *     True if deleted, false if file didn't exist.
 */
export async function deleteFile(url: string): Promise<boolean> {
  const filename = url.replace("/uploads/", "");
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    await stat(filepath);
    await unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists.
 *
 * Args:
 *     url: The URL of the file.
 *
 * Returns:
 *     True if the file exists.
 */
export async function fileExists(url: string): Promise<boolean> {
  const filename = url.replace("/uploads/", "");
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    await stat(filepath);
    return true;
  } catch {
    return false;
  }
}
