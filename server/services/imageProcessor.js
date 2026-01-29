import sharp from 'sharp';
import path from 'path';
import { config } from '../config.js';
import { safePath, ensureDir, removeFile } from '../utils/fileUtils.js';

/**
 * Process an uploaded image buffer and generate all size variants.
 * Returns the file paths and dimensions.
 */
export async function processUploadedImage(buffer, collectionSlug, imageId) {
  const outputDir = safePath(config.images.outputDir, collectionSlug);
  await ensureDir(outputDir);

  // Get original dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Calculate aspect ratio
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const aspectRatio = `${width / divisor}:${height / divisor}`;

  // Generate all sizes
  const files = {};

  for (const [sizeName, sizeConfig] of Object.entries(config.images.sizes)) {
    const filename = `${imageId}-${sizeName}.jpg`;
    const filepath = path.join(outputDir, filename);

    await sharp(buffer)
      .rotate()                       // Auto-rotate based on EXIF
      .resize({
        width: sizeConfig.width,
        height: undefined,            // Maintain aspect ratio
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: sizeConfig.quality,
        progressive: true,
        mozjpeg: true,
      })
      .toFile(filepath);

    files[sizeName] = `/assets/images/collections/${collectionSlug}/${filename}`;
  }

  return {
    files,
    dimensions: { width, height, aspectRatio },
  };
}

/**
 * Delete all generated files for a given image.
 */
export async function deleteImageFiles(collectionSlug, imageId) {
  const outputDir = safePath(config.images.outputDir, collectionSlug);

  for (const sizeName of Object.keys(config.images.sizes)) {
    const filepath = path.join(outputDir, `${imageId}-${sizeName}.jpg`);
    await removeFile(filepath);
  }
}
