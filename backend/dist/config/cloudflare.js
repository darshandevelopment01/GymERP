"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2_PUBLIC_URL = exports.R2_BUCKET_NAME = exports.r2Client = void 0;
// backend/src/config/cloudflare.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
exports.r2Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});
exports.R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
exports.R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
