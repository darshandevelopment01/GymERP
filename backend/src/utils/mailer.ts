import os from 'os';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import { RECEIPT_TEMPLATE_BASE64 } from '../assets/receiptTemplate';

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
        const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const user = process.env.SMTP_USER || 'info@muscletime.co.in';
        const pass = process.env.SMTP_PASS;

        if (!pass) {
            console.warn('⚠️ SMTP password (SMTP_PASS) not found in environment!');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
                user,
                pass,
            },
            debug: true,
            logger: true
        });

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
 * Fills a DOCX template then converts to PDF using a serverless-friendly approach.
 */
export const generateReceiptPdfBuffer = async (data: any): Promise<Buffer> => {
    let browser = null;
    const tempDocxPath = path.join(os.tmpdir(), `receipt_${Date.now()}.docx`);

    try {
        console.log('📄 Generating PDF Receipt Buffer (Serverless-mode)...');
        
        // 1. Generate the filled DOCX
        const docxBuf = generateDocxBuffer(data);
        fs.writeFileSync(tempDocxPath, docxBuf);

        // 2. Convert DOCX to HTML using Mammoth
        const { value: html } = await mammoth.convertToHtml({ path: tempDocxPath });

        // 3. Convert HTML to PDF using Puppeteer/Chromium
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Add basic styling to make it look decent
        const styledHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        h1, h2 { color: #2563eb; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f8fafc; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
            </html>
        `;

        await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
        
        const pdfBuf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        console.log('✅ PDF Receipt Buffer generated successfully');
        return Buffer.from(pdfBuf);
    } catch (error: any) {
        console.error('❌ Error generating PDF buffer:', error);
        throw error;
    } finally {
        if (browser) await(browser as any).close();
        if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
    }
};

