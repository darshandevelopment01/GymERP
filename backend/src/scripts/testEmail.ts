import { sendEmail } from '../utils/mailer';

async function testConnection() {
    const configs = [
        { port: 465, secure: true, label: 'Port 465 (SSL)' },
        { port: 587, secure: false, label: 'Port 587 (TLS)' }
    ];

    for (const config of configs) {
        console.log(`\n--- Testing ${config.label} ---`);
        const pass = process.env.SMTP_PASS || '';
        console.log(`Password Length: ${pass.length}`);
        console.log(`Password starts with: "${pass.substring(0, 2)}"`);
        console.log(`Password ends with: "${pass.substring(pass.length - 2)}"`);

        console.log('Host:', process.env.SMTP_HOST || 'smtp.hostinger.com');
        console.log('Port:', config.port);
        console.log('User:', process.env.SMTP_USER);

        const transporter = require('nodemailer').createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: config.port,
            secure: config.secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            debug: true,
            logger: true
        });

        try {
            console.log('Verifying connection...');
            await transporter.verify();
            console.log(`✅ Connection verified for ${config.label}`);

            const receiver = process.env.SMTP_USER || 'info@muscletime.co.in';
            console.log(`Sending test email to ${receiver}...`);

            await transporter.sendMail({
                from: `"Test" <${process.env.SMTP_USER}>`,
                to: receiver,
                subject: `SMTP Test - ${config.label}`,
                text: `Test successful using ${config.label}`
            });

            console.log(`✅ Success with ${config.label}!`);
            return;
        } catch (err: any) {
            console.log(`❌ Failed with ${config.label}:`, err.message);
            if (err.stack) console.log(err.stack);
        }
    }

    console.log('\n❌ ALL ATTEMPTS FAILED. Please check your credentials and server firewall.');
    process.exit(1);
}

testConnection();
