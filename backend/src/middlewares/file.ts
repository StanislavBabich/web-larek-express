import path from 'path';
import multer from 'multer';
import { UPLOAD_PATH_TEMP } from '../config';

const tempDir = path.join(process.cwd(), 'src', 'public', UPLOAD_PATH_TEMP);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error('Unsupported file type'));
    return;
  }
  cb(null, true);
};

const fileMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default fileMiddleware;
