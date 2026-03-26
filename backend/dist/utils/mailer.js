"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocxBuffer = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const pizzip_1 = __importDefault(require("pizzip"));
const docxtemplater_1 = __importDefault(require("docxtemplater"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
