"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
        const port = parseInt(process.env.SMTP_PORT || '465', 10);
        const user = process.env.SMTP_USER || 'info@muscletime.co.in';
        const pass = process.env.SMTP_PASS;
        if (!pass) {
            console.warn('⚠️ SMTP password (SMTP_PASS) not found in environment!');
            return false;
        }
        // Create transporter on demand or use a singleton that checks env
        const transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
                user,
                pass,
            },
            // Debugging options
            debug: true,
            logger: true
        });
        console.log(`📧 Sending email to ${to} via ${host}:${port} as ${user}`);
        const info = await transporter.sendMail({
            from: `"MuscleTime ERP" <${user}>`,
            to,
            subject,
            html: htmlContent,
        });
        console.log(`✅ Email sent. MessageId: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error('❌ SMTP Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('👉 Tip: Double check your SMTP_USER and SMTP_PASS in .env. Ensure there are no leading/trailing spaces.');
        }
        return false;
    }
};
exports.sendEmail = sendEmail;
