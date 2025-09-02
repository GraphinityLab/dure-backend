// utils/emailUtils.ts
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Create a Nodemailer transporter using SMTP
// You will need to configure this with your actual email service provider's details.
// For example, if you're using Gmail, you would set up an App Password.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends an email to a specified recipient.
 * @param to The recipient's email address.
 * @param subject The subject line of the email.
 * @param html The HTML content of the email body.
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM, // Sender address
            to,                          // List of receivers
            subject,                     // Subject line
            html,                        // HTML body content
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};
