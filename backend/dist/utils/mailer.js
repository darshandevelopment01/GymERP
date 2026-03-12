"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Default to the provided info@muscletime.co.in email if not explicitly set
const SMTP_USER_EMAIL = process.env.SMTP_USER || 'info@muscletime.co.in';
// Create a reusable transporter strictly configured for Hostinger Webmail or regular SMTP
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true, // true for 465, false for other ports. Hostinger uses 465 for SSL.
    auth: {
        user: SMTP_USER_EMAIL,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP password (SMTP_PASS) not found in environment! Available env keys:', Object.keys(process.env).filter(k => k.startsWith('SMTP')).join(', ') || 'NONE');
            return false;
        }
        console.log(`📧 Attempting to send email to ${to} via ${process.env.SMTP_HOST || 'smtp.hostinger.com'}:${process.env.SMTP_PORT || '465'} as ${SMTP_USER_EMAIL}`);
        const info = await transporter.sendMail({
            from: `"MuscleTime ERP" <${SMTP_USER_EMAIL}>`,
            to,
            subject,
            html: htmlContent,
        });
        console.log(`✅ Email sent securely to ${to}. MessageId: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error('❌ Error sending email via SMTP:', error);
        return false;
    }
};
exports.sendEmail = sendEmail;
