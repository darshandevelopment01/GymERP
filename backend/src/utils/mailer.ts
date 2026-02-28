import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Default to the provided info@muscletime.co.in email if not explicitly set
const SMTP_USER_EMAIL = process.env.SMTP_USER || 'info@muscletime.co.in';

// Create a reusable transporter strictly configured for Hostinger Webmail or regular SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true, // true for 465, false for other ports. Hostinger uses 465 for SSL.
    auth: {
        user: SMTP_USER_EMAIL,
        pass: process.env.SMTP_PASS, // Your email password
    },
});

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        if (!process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP password (SMTP_PASS) not found! Mocking email to:', to);
            return false;
        }

        const info = await transporter.sendMail({
            from: `"MuscleTime ERP" <${SMTP_USER_EMAIL}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log(`✅ Email sent securely to ${to}. MessageId: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email via SMTP:', error);
        return false;
    }
};
