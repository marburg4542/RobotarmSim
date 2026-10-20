// server/index.js
import express from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// ─── Setup __dirname for ES modules ────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── App & Port ────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Connect MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Middlewares ───────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/models', express.static(path.join(__dirname, '../client/public/models')));
app.use(express.static(path.join(__dirname, '../client/build')));

// ─── Multer for avatar uploads ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// ─── Mongoose Schemas & Models ────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatarUrl:    { type: String },
}, { timestamps: true });

const resetTokenSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date,   required: true },
}, { timestamps: true });

const User       = mongoose.model('User', userSchema);
const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

// ─── Auth middleware ───────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const auth = req.headers.authorization?.split(' ');
  if (auth?.[0] === 'Bearer' && auth[1]) {
    try {
      const payload      = jwt.verify(auth[1], process.env.JWT_SECRET);
      req.userId         = payload.userId;
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }
  return res.status(401).json({ success: false, message: 'No token provided' });
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user         = new User({ username, email, passwordHash });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} already in use` });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user                   = await User.findOne({ username });
    if (!user) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success:   true,
      token,
      username:  user.username,
      avatarUrl: user.avatarUrl
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user      = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Email not found' });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await new ResetToken({ user: user._id, token, expiresAt }).save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth:    { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      email,
      subject: '🔑 Password Reset',
      html:    `<p>คลิกเพื่อตั้งรหัสผ่านใหม่:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reset link' });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const record = await ResetToken.findOne({ token }).populate('user');
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt           = await bcrypt.genSalt(10);
    record.user.passwordHash = await bcrypt.hash(newPassword, salt);
    await record.user.save();
    await ResetToken.deleteOne({ _id: record._id });

    res.json({ success: true });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── UPDATE PROFILE (avatar + username) ─────────────────────────────────────
app.post(
  '/api/update-profile',
  authenticate,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (req.body.username && req.body.username !== user.username) {
        user.username = req.body.username;
      }
      if (req.file) {
        user.avatarUrl = `/uploads/${req.file.filename}`;
      }
      await user.save();

      res.json({
        success:   true,
        username:  user.username,
        avatarUrl: user.avatarUrl
      });
    } catch (err) {
      console.error('Update-profile error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
app.post(
  '/api/change-password',
  authenticate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const salt           = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ success: true });
    } catch (err) {
      console.error('Change-password error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── Catch-all: serve React app ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// ─── Error handler (500) ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
