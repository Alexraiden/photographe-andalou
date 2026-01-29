import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { config } from '../config.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`File extension ${ext} not allowed`), false);
  }

  if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`MIME type ${file.mimetype} not allowed`), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
    fields: 20,
    fieldSize: 10 * 1024,
  },
});

export async function validateFileContent(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileType = await fileTypeFromBuffer(req.file.buffer);

    if (!fileType) {
      return res.status(400).json({ error: 'Unable to determine file type' });
    }

    if (!config.upload.allowedMimeTypes.includes(fileType.mime)) {
      return res.status(400).json({
        error: `File content type ${fileType.mime} is not allowed`,
      });
    }

    if (fileType.mime !== req.file.mimetype) {
      console.warn(
        `[Security] MIME mismatch: declared=${req.file.mimetype}, actual=${fileType.mime}`
      );
    }

    req.file.verifiedMime = fileType.mime;
    req.file.verifiedExt = fileType.ext;

    next();
  } catch (err) {
    return res.status(400).json({ error: 'File validation failed' });
  }
}
