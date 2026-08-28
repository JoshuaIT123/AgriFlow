import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { DomainError } from "./errors";

/**
 * LOCAL FILE STORAGE for product photos (hackathon MVP).
 *
 * Files live in <repo>/uploads/products/<productId>.<ext>. No external
 * storage providers - no S3, no Cloudinary. The URL returned to clients is
 * served by GET /api/products/:id/image which reads the file from disk.
 */

const PRODUCT_IMAGES_DIR = join(process.cwd(), "uploads", "products");

/** Max upload size per image. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Allowed image content types (kept deliberately small for the MVP). */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const TYPE_TO_EXT: Record<ImageType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const EXT_TO_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Product ids are random UUID strings; guard before using one as a filename. */
const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

/** Public URL under which a product photo is served. */
export function productImageUrl(productId: string): string {
  return `/api/products/${productId}/image`;
}

async function ensureImagesDir(): Promise<void> {
  await mkdir(PRODUCT_IMAGES_DIR, { recursive: true });
}

async function findProductImage(
  productId: string,
): Promise<{ path: string; ext: string } | null> {
  if (!SAFE_ID.test(productId)) return null;
  let entries: string[];
  try {
    entries = await readdir(PRODUCT_IMAGES_DIR);
  } catch {
    return null; // uploads dir does not exist yet
  }
  const match = entries.find((f) => f.startsWith(`${productId}.`));
  if (!match) return null;
  return { path: join(PRODUCT_IMAGES_DIR, match), ext: extname(match).toLowerCase() };
}

/**
 * Writes a product photo to local disk (replacing any previous one) and
 * returns the public URL to serve it. Throws DomainError on invalid input.
 */
export async function saveProductImage(
  productId: string,
  file: File,
): Promise<string> {
  if (!SAFE_ID.test(productId)) {
    throw new DomainError(400, "Invalid product id");
  }
  const ext = TYPE_TO_EXT[file.type as ImageType];
  if (!ext) {
    throw new DomainError(
      400,
      `Unsupported image type "${file.type}". Allowed: JPG, PNG, WebP, GIF`,
    );
  }
  if (file.size <= 0) {
    throw new DomainError(400, "Image file is empty");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new DomainError(400, "Image too large (max 5 MB)");
  }

  await ensureImagesDir();
  const existing = await findProductImage(productId);
  if (existing) await unlink(existing.path).catch(() => {});

  await writeFile(
    join(PRODUCT_IMAGES_DIR, `${productId}${ext}`),
    Buffer.from(await file.arrayBuffer()),
  );

  return productImageUrl(productId);
}

/** Removes a product photo (if any) from local disk. */
export async function deleteProductImage(productId: string): Promise<void> {
  const found = await findProductImage(productId);
  if (found) await unlink(found.path).catch(() => {});
}

/** Reads a product photo from disk; returns null when none exists. */
export async function readProductImage(
  productId: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  const found = await findProductImage(productId);
  if (!found) return null;
  const contentType = EXT_TO_TYPE[found.ext] ?? "application/octet-stream";
  const data = await readFile(found.path);
  return { data, contentType };
}