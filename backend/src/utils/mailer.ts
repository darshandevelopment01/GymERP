import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<boolean> => {
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
        const transporter = nodemailer.createTransport({
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
    } catch (error: any) {
        console.error('❌ SMTP Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('👉 Tip: Double check your SMTP_USER and SMTP_PASS in .env. Ensure there are no leading/trailing spaces.');
        }
        return false;
    }
};

