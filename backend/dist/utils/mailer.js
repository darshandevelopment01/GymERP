"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptPdfBuffer = exports.generateDocxBuffer = exports.sendEmail = void 0;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const pizzip_1 = __importDefault(require("pizzip"));
const docxtemplater_1 = __importDefault(require("docxtemplater"));
const mammoth_1 = __importDefault(require("mammoth"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const receiptTemplate_1 = require("../assets/receiptTemplate");
const sendEmail = async (to, subject, htmlContent, attachments = []) => {
    try {
        const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const user = process.env.SMTP_USER || 'info@muscletime.co.in';
        const pass = process.env.SMTP_PASS;
        if (!pass) {
            console.warn('⚠️ SMTP password (SMTP_PASS) not found in environment!');
            return false;
        }
        const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        console.error('❌ SMTP Error:', error.message);
        return false;
    }
};
exports.sendEmail = sendEmail;
/**
 * Generates a docx buffer from a template.
 * Uses an embedded base64 template by default for Vercel compatibility.
 */
const generateDocxBuffer = (data, templatePath) => {
    try {
        let content;
        let actualPath = templatePath;
        if (!actualPath) {
            // Check both src/assets and dist/assets (standard path in dist will be ../assets relative to this file)
            const defaultPaths = [
                path_1.default.join(__dirname, '../../src/assets/MTF Reseat.docx'),
                path_1.default.join(__dirname, '../assets/MTF Reseat.docx'),
            ];
            for (const p of defaultPaths) {
                if (fs_1.default.existsSync(p)) {
                    actualPath = p;
                    console.log(`📄 Found physical template at: ${p}`);
                    break;
                }
            }
        }
        if (actualPath && fs_1.default.existsSync(actualPath)) {
            content = fs_1.default.readFileSync(actualPath, 'binary');
        }
        else {
            console.log('📦 Using embedded base64 template');
            content = Buffer.from(receiptTemplate_1.RECEIPT_TEMPLATE_BASE64, 'base64').toString('binary');
        }
        const zip = new pizzip_1.default(content);
        const doc = new docxtemplater_1.default(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        doc.render(data);
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });
        return buf;
    }
    catch (error) {
        if (error.code === 'EBUSY' || error.message?.includes('EBUSY')) {
            console.error('❌ File Lock Error: Please close Microsoft Word. The DOCX template is currently locked.', error);
            throw new Error('Please close Microsoft Word. The MTF Reseat.docx file is locked and cannot be read.');
        }
        console.error('❌ Error generating DOCX buffer:', error);
        throw error;
    }
};
exports.generateDocxBuffer = generateDocxBuffer;
/**
 * Generates a PDF buffer from a template data.
 * Fills a DOCX template then converts to PDF using a serverless-friendly approach.
 */
const generateReceiptPdfBuffer = async (data) => {
    let browser = null;
    const tempDocxPath = path_1.default.join(os_1.default.tmpdir(), `receipt_${Date.now()}.docx`);
    try {
        console.log('📄 Generating PDF Receipt Buffer (Serverless-mode)...');
        // 1. Generate the filled DOCX
        const docxBuf = (0, exports.generateDocxBuffer)(data);
        fs_1.default.writeFileSync(tempDocxPath, docxBuf);
        // 2. Convert DOCX to HTML using Mammoth
        const { value: html } = await mammoth_1.default.convertToHtml({ path: tempDocxPath });
        // 3. Convert HTML to PDF using Puppeteer/Chromium
        browser = await puppeteer_core_1.default.launch({
            args: chromium_1.default.args,
            defaultViewport: chromium_1.default.defaultViewport,
            executablePath: await chromium_1.default.executablePath(),
            headless: chromium_1.default.headless,
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
    }
    catch (error) {
        console.error('❌ Error generating PDF buffer:', error);
        throw error;
    }
    finally {
        if (browser)
            await browser.close();
        if (fs_1.default.existsSync(tempDocxPath))
            fs_1.default.unlinkSync(tempDocxPath);
    }
};
exports.generateReceiptPdfBuffer = generateReceiptPdfBuffer;
