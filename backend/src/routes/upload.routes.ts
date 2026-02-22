// backend/src/routes/upload.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../config/cloudflare';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage (no local file saving)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    },
});

// Upload profile photo
router.post(
    '/profile-photo',
    authMiddleware,
    upload.single('photo'),
    async (req: Request, res: Response) => {
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
            await r2Client.send(
                new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            const publicUrl = `${R2_PUBLIC_URL}/${key}`;

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
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading photo',
                error: error.message,
            });
        }
    }
);

export default router;
