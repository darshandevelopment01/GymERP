"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create a reusable transporter strictly configured for Hostinger Webmail or regular SMTP
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true, // true for 465, false for other ports. Hostinger uses 465 for SSL.
    auth: {
        user: process.env.SMTP_USER, // Your full email e.g. hello@muscletime.co.in
        pass: process.env.SMTP_PASS, // Your email password
    },
});
const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not found in .env! Mocking email to:', to);
            return false;
        }
        const info = await transporter.sendMail({
            from: `"MuscleTime ERP" <${process.env.SMTP_USER}>`,
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
