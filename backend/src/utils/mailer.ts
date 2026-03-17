import nodemailer from 'nodemailer';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

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
 * Reads a docx file, replaces variables in brackets {variable}, and returns a Buffer
 */
export const generateDocxBuffer = (templatePath: string, data: any): Buffer => {
    try {
        const content = fs.readFileSync(templatePath, 'binary');
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
        console.error('❌ Error generating DOCX buffer:', error);
        throw error;
    }
};

