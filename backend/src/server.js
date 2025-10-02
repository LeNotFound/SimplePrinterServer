import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { exec } from 'child_process';
import mime from 'mime-types';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root config.json
const rootDir = path.resolve(__dirname, '..', '..');
const rootConfigPath = path.join(rootDir, 'config.json');
let rootConfig = { printerName: 'YOUR_PRINTER_NAME', backendPort: 3002, upload: { maxSizeMB: 50 }, allowOrigins: ['*'] };
try {
  if (fs.existsSync(rootConfigPath)) {
    rootConfig = { ...rootConfig, ...JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8')) };
  }
} catch (e) {
  console.warn('Failed to load config.json, using defaults:', e.message);
}

// Config (env overrides file)
const PORT = Number(process.env.BACKEND_PORT || rootConfig.backendPort || 3002);
export const PRINTER_NAME = process.env.PRINTER_NAME || rootConfig.printerName || 'YOUR_PRINTER_NAME';
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const TEMP_DIR = path.join(__dirname, '..', 'tmp');

// Ensure directories exist
for (const dir of [UPLOAD_DIR, TEMP_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const app = express();
const corsOrigins = process.env.ALLOW_ORIGINS ? process.env.ALLOW_ORIGINS.split(',') : (rootConfig.allowOrigins || ['*']);
app.use(cors({ origin: corsOrigins.includes('*') ? true : corsOrigins }));
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
  limits: { fileSize: (rootConfig.upload?.maxSizeMB || 50) * 1024 * 1024 }
});

// In-memory map: id -> { id, name, path, mimetype }
function fixFilenameEncoding(name) {
  try {
    // 某些浏览器上传的 filename 以 latin1 解码为字符串，需转为 utf8
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch (e) {
    return name;
  }
}
const files = new Map();

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const id = path.parse(req.file.filename).name; // uuid without ext
    const info = {
      id,
      name: fixFilenameEncoding(req.file.originalname),
      path: req.file.path,
      mimetype: req.file.mimetype
    };
    files.set(id, info);
    res.json({ id, name: info.name });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

app.get('/api/files', (req, res) => {
  res.json(Array.from(files.values()).map(f => ({ id: f.id, name: f.name, mimetype: f.mimetype })));
});

// Preview endpoint: returns pdf or image; converts docx to pdf first
app.get('/api/preview/:id', async (req, res) => {
  const file = files.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const { path: filePath, mimetype } = file;
  try {
    if (mimetype === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      return fs.createReadStream(filePath).pipe(res);
    }
    if (mimetype.startsWith('image/')) {
      res.setHeader('Content-Type', mimetype);
      return fs.createReadStream(filePath).pipe(res);
    }
    // no docx support
    return res.status(400).json({ error: 'Unsupported file type' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Preview error' });
  }
});

// Print endpoint
app.post('/api/print/:id', (req, res) => {
  const file = files.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = file.path;
  const printer = PRINTER_NAME;
  const cmd = `lp -d "${printer}" "${filePath}"`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('lp error:', stderr || error.message);
      return res.status(500).json({ error: 'Print failed', details: stderr || error.message });
    }
    // stdout often contains job id like: 'request id is PRINTER-123 (1 file(s))'
    res.json({ success: true, message: stdout.trim() });
  });
});

// Queue endpoint
app.get('/api/queue', (req, res) => {
  exec('lpstat -o', (error, stdout, stderr) => {
    if (error) {
      console.error('lpstat error:', stderr || error.message);
      return res.status(500).json({ error: 'Failed to query print queue' });
    }
    const lines = stdout.split('\n').filter(Boolean);
    res.json({ jobs: lines });
  });
});

app.listen(PORT, () => {
  console.log(`Printer server listening on http://0.0.0.0:${PORT}`);
});
