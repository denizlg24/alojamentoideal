"use server"
import env from "@/utils/env";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export async function sendMail({ email, html, subject, attachments }: { email: string, html: string, subject: string, attachments?: Mail.Attachment[] }) {
    try {
        const transporter = nodemailer.createTransport({
            host: "mail.alojamentoideal.pt",
            port: 465,
            secure: true, // upgrade later with STARTTLS
            auth: {
                user: "site@alojamentoideal.pt",
                pass: env.WEBMAIL_PASS,
            },
        });
        const mailOptions: SMTPTransport.MailOptions = {
            from: "Alojamento Ideal <site@alojamentoideal.pt>",
            to: email,
            subject,
            html,
            attachments: attachments
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Mail failed: ", error);
        return { success: false, message: "mail-error" };
    }
}