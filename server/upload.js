import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create router
const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

// Multer instance
const upload = multer({ storage });

// POST /api/upload-avatar
// Expects field name 'avatar'
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Return URL path to the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, fileUrl });
});

export default router;
