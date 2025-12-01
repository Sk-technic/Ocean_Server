import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

// ----------------------------------------------------
// STORAGE FOLDER
// ----------------------------------------------------
const uploadDir = path.join(__dirname, "../public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ----------------------------------------------------
// MIME TYPES
// ----------------------------------------------------
export const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const VIDEO_MIME = [
  "video/mp4",
  "video/mpeg",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
];

export const AUDIO_MIME = [
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/ogg",
  "audio/mp4",
];

// ----------------------------------------------------
// SIZE LIMITS
// ----------------------------------------------------
export const IMAGE_MAX = 5 * 1024 * 1024;   // 5MB
export const VIDEO_MAX = 50 * 1024 * 1024;  // 50MB
export const AUDIO_MAX = 10 * 1024 * 1024;  // 10MB

// ----------------------------------------------------
// STORAGE ENGINE
// ----------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  },
});

// ----------------------------------------------------
// FILTERS
// ----------------------------------------------------
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  IMAGE_MIME.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only image files are allowed."));
};

const videoFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  VIDEO_MIME.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only video files are allowed."));
};

const audioFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  AUDIO_MIME.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only audio files are allowed."));
};

const mediaFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const mime = file.mimetype;

  if (IMAGE_MIME.includes(mime) || VIDEO_MIME.includes(mime) || AUDIO_MIME.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Upload image, video, or audio."));
  }
};

// ----------------------------------------------------
// EXPORT MULTER INSTANCES
// ----------------------------------------------------

// Only image
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: IMAGE_MAX },
});

// Only video
export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: VIDEO_MAX },
});

// Only audio
export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: AUDIO_MAX },
});

// Mixed media (image + video + audio together)
export const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: VIDEO_MAX }, // highest limit for mixed upload
});
