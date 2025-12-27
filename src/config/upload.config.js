import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// 確保上傳目錄存在
await fs.mkdir(UPLOAD_DIR, { recursive: true });

// 配置存儲
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// 文件過濾器
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

// Multer 配置
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});
