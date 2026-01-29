import path from 'path';
import fs from 'fs/promises';

/**
 * Resolve a path and ensure it stays within the allowed base directory.
 * Prevents path traversal attacks.
 */
export function safePath(base, ...segments) {
  const resolved = path.resolve(base, ...segments);
  const normalizedBase = path.resolve(base);

  if (!resolved.startsWith(normalizedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Delete a file if it exists. Silently ignores ENOENT.
 */
export async function removeFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
