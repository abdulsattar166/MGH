import { Router } from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// On serverless hosts the bundle directory is read-only, so uploads go to the
// writable temp directory instead. Directory creation can never throw at
// import time (that used to crash the whole API on Vercel).
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const UPLOADS_DIR = isServerless
  ? path.join(os.tmpdir(), "mubarak-uploads")
  : path.resolve(__dirname, "../../uploads");

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  /* read-only filesystem — uploads are simply unavailable in this runtime */
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = (() => {
      if (file.mimetype === "image/png") return "png";
      if (file.mimetype === "image/webp") return "webp";
      return "jpg";
    })();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG and WEBP images are allowed."));
  },
});

const router = Router();

// POST /api/uploads  (multipart/form-data, field name "file")
//   returns { url, path } — store `url` in the relevant image_url column.
router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file was uploaded." });
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(201).json({ ok: true, url, path: `/uploads/${req.file.filename}` });
  });
});

export default router;
