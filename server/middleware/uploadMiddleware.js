const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

const MAX_RESUME_BYTES = (parseInt(process.env.MAX_RESUME_SIZE_MB, 10) || 5) * 1024 * 1024;
const MAX_IMAGE_BYTES = (parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 2) * 1024 * 1024;

const RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const RESUME_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Builds a Multer disk storage engine scoped to a single subdirectory of
 * /uploads, generating a collision-proof filename of the form
 * "<userId>-<uuid><ext>" so files can never overwrite one another or leak
 * the original client-supplied filename.
 */
function buildStorage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'uploads', subdir));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const userId = req.user ? req.user.id : 'anon';
      cb(null, `${userId}-${uuidv4()}${ext}`);
    },
  });
}

/**
 * Builds a fileFilter that enforces both MIME type AND file extension
 * (defense in depth — MIME type alone is client-supplied and spoofable).
 */
function buildFileFilter(allowedMimeTypes, allowedExtensions, label) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      return cb(
        ApiError.badRequest(
          `Invalid file type for ${label}. Allowed types: ${[...allowedExtensions].join(', ')}.`
        )
      );
    }
    cb(null, true);
  };
}

const resumeUpload = multer({
  storage: buildStorage('resumes'),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: buildFileFilter(RESUME_MIME_TYPES, RESUME_EXTENSIONS, 'resume (PDF or DOCX)'),
});

const imageUpload = multer({
  storage: buildStorage('profiles'),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: buildFileFilter(IMAGE_MIME_TYPES, IMAGE_EXTENSIONS, 'image (JPG, PNG, or WEBP)'),
});

module.exports = { resumeUpload, imageUpload };
