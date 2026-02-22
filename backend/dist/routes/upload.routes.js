"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/upload.routes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const cloudflare_1 = require("../config/cloudflare");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for memory storage (no local file saving)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    },
});
// Upload profile photo
router.post('/profile-photo', auth_middleware_1.authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const file = req.file;
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `profile-photos/${timestamp}-${sanitizedName}`;
        // Upload to Cloudflare R2
        await cloudflare_1.r2Client.send(new client_s3_1.PutObjectCommand({
            Bucket: cloudflare_1.R2_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        const publicUrl = `${cloudflare_1.R2_PUBLIC_URL}/${key}`;
        res.json({
            success: true,
            data: {
                url: publicUrl,
                key: key,
                fileName: file.originalname,
                size: file.size,
            },
            message: 'Photo uploaded successfully',
        });
    }
    catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading photo',
            error: error.message,
        });
    }
});
exports.default = router;
