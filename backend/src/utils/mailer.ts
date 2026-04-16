import os from 'os';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

import { RECEIPT_TEMPLATE_BASE64 } from '../assets/receiptTemplate';
import { generateReceiptPdfBuffer as generatePdfByPdfLib, ReceiptData } from './pdfReceipt';

export interface EmailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

export const sendEmail = async (
    to: string,
    subject: string,
    htmlContent: string,
    attachments: EmailAttachment[] = []
): Promise<boolean> => {
    const startTime = Date.now();
    let transporter: any = null;

    try {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS?.replace(/\s/g, ''); // ✅ Fix: Strip accidental spaces from SMTP password

        if (!host || !user || !pass) {
            console.warn('⚠️ [MAILER] SMTP config missing! Check SMTP_HOST, SMTP_USER, SMTP_PASS.');
            return false;
        }

        console.log(`📧 [MAILER] Starting email to ${to} via ${host}:${port}`);

        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            pool: false, 
            connectionTimeout: 30000, // Increased to 30s
            greetingTimeout: 30000,
            socketTimeout: 45000, // Increased to 45s
            ...(port === 587 ? { requireTLS: true } : {}),
            tls: { rejectUnauthorized: false },
            debug: false, 
            logger: false 
        } as any);

        // 1. Verify Connection
        await transporter.verify();
        const verifyTime = Date.now() - startTime;
        console.log(`✅ [MAILER] SMTP Verified (${verifyTime}ms)`);

        // 2. Send Mail
        const info = await transporter.sendMail({
            from: `"MuscleTime ERP" <${user}>`,
            to,
            subject,
            html: htmlContent,
            attachments: attachments.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType
            }))
        });

        const totalTime = Date.now() - startTime;
        console.log(`✅ [MAILER] Email sent in ${totalTime}ms. Response: ${info.response}`);
        
        return true;
    } catch (error: any) {
        const errorTime = Date.now() - startTime;
        console.error(`❌ [MAILER] Failed after ${errorTime}ms:`, error.message);
        if (error.response) console.error(`   SMTP Response: ${error.response}`);
        return false;
    } finally {
        if (transporter) {
            try { transporter.close(); } catch (e) {}
        }
    }
};

/**
 * Generates a docx buffer from a template.
 * Uses an embedded base64 template by default for Vercel compatibility.
 */
export const generateDocxBuffer = (data: any, templatePath?: string): Buffer => {
    try {
        let content: any;
        let actualPath = templatePath;
        if (!actualPath) {
            // Check both src/assets and dist/assets (standard path in dist will be ../assets relative to this file)
            const defaultPaths = [
                path.join(__dirname, '../../src/assets/MTF Reseat.docx'),
                path.join(__dirname, '../assets/MTF Reseat.docx'),
            ];
            for (const p of defaultPaths) {
                if (fs.existsSync(p)) {
                    actualPath = p;
                    console.log(`📄 Found physical template at: ${p}`);
                    break;
                }
            }
        }

        if (actualPath && fs.existsSync(actualPath)) {
            content = fs.readFileSync(actualPath, 'binary');
        } else {
            console.log('📦 Using embedded base64 template');
            content = Buffer.from(RECEIPT_TEMPLATE_BASE64, 'base64').toString('binary');
        }

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return buf;
    } catch (error: any) {
        if (error.code === 'EBUSY' || error.message?.includes('EBUSY')) {
            console.error('❌ File Lock Error: Please close Microsoft Word. The DOCX template is currently locked.', error);
            throw new Error('Please close Microsoft Word. The MTF Reseat.docx file is locked and cannot be read.');
        }
        console.error('❌ Error generating DOCX buffer:', error);
        throw error;
    }
};

/**
 * Generates a PDF buffer from a template data.
 * Uses a pure-JS browser-less approach for Vercel compatibility.
 */
export const generateReceiptPdfBuffer = async (data: any): Promise<Buffer> => {
    try {
        console.log('📄 Generating PDF Receipt Buffer (Serverless-mode: pdf-lib)...');
        // Map any extra fields or handle defaults if needed
        const receiptData: ReceiptData = {
          ...data,
          branch: data.branch || 'Main Branch',
          city: data.city || 'Pune',
        };
        
        return await generatePdfByPdfLib(receiptData);
    } catch (error: any) {
        console.error('❌ Error generating PDF buffer:', error);
        throw error;
    }
};

