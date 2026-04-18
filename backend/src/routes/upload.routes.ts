// backend/src/routes/upload.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../config/cloudflare';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for images (profile photos/offers)
const imageUpload = multer({
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

// Configure multer for documents (PDF, Docs, Images)
const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/webp'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, PNG, WebP.'));
        }
    },
});

// Upload profile photo
router.post(
    '/profile-photo',
    authMiddleware,
    imageUpload.single('photo'),
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

// Upload offer image
router.post(
    '/offer-image',
    authMiddleware,
    imageUpload.single('image'),
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
            const key = `offer-images/${timestamp}-${sanitizedName}`;

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
                message: 'Offer image uploaded successfully',
            });
        } catch (error: any) {
            console.error('Error uploading offer image:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading offer image',
                error: error.message,
            });
        }
    }
);

// Private Employee Document Upload
router.post(
    '/employee-document',
    authMiddleware,
    docUpload.single('document'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const file = req.file;
            const timestamp = Date.now();
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const key = `employee-docs/${timestamp}-${sanitizedName}`;

            // Upload to Cloudflare R2
            await r2Client.send(
                new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            res.json({
                success: true,
                data: {
                    fileKey: key,
                    fileName: file.originalname,
                    size: file.size,
                },
                message: 'Document uploaded successfully',
            });
        } catch (error: any) {
            console.error('Error uploading document:', error);
            res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
        }
    }
);

// Generate Presigned URL for private documents
router.get(
    '/employee-document/presigned/:key(*)',
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const key = req.params.key as string;
            if (!key) return res.status(400).json({ success: false, message: 'Key is required' });

            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            });

            // URL expires in 300 seconds (5 minutes)
            const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });

            res.json({ success: true, url });
        } catch (error: any) {
            console.error('Error generating presigned URL:', error);
            res.status(500).json({ success: false, message: 'Error generating access link', error: error.message });
        }
    }
);

export default router;
