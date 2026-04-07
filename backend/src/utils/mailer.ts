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
    try {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (!host || !user || !pass) {
            console.warn('⚠️ SMTP config missing! Check SMTP_HOST, SMTP_USER, SMTP_PASS in environment.');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // SSL for 465, STARTTLS for 587
            auth: {
                user,
                pass,
            },
            // ✅ Optimized settings for Gmail and Serverless (Vercel)
            pool: false, // Disabling pooling for Vercel to ensure socket is flushed and closed before response ends
            maxMessages: 100,
            connectionTimeout: 10000, // 10s
            greetingTimeout: 10000, // 10s
            socketTimeout: 30000, // 30s
            ...(port === 587 ? { requireTLS: true } : {}),
            tls: {
                rejectUnauthorized: false // Helps avoid SSL/cert issues in some environments
            },
            debug: true,
            logger: true
        } as any);

        console.log(`📧 Sending email to ${to} via ${host}:${port} as ${user}`);

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

        console.log(`✅ Email sent. MessageId: ${info.messageId}`);
        return true;
    } catch (error: any) {
        console.error('❌ SMTP Error:', error.message);
        return false;
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

