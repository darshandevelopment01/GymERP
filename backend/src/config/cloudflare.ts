// backend/src/config/cloudflare.ts
import { S3Client } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

// Support both: just Account ID, or full S3 API URL
let r2Endpoint: string;
if (R2_ACCOUNT_ID.startsWith('http')) {
    try {
        const url = new URL(R2_ACCOUNT_ID);
        r2Endpoint = url.origin; // Extracts https://xxxx.r2.cloudflarestorage.com
    } catch (e) {
        r2Endpoint = R2_ACCOUNT_ID;
    }
} else {
    r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

// Diagnostic Logging (Safe)
console.log('--- Cloudflare R2 Diagnostic ---');
console.log('R2_ACCOUNT_ID prefix:', R2_ACCOUNT_ID.substring(0, 10) + '...');
console.log('Calculated Endpoint:', r2Endpoint);
console.log('R2_BUCKET_NAME:', R2_BUCKET_NAME);
console.log('R2_PUBLIC_URL:', R2_PUBLIC_URL);
console.log('--------------------------------');

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
});
