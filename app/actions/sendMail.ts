"use server"
import env from "@/utils/env";
import nodemailer from "nodemailer";

export async function sendMail({ email, html, subject }: { email: string, html: string, subject: string }) {
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
        const mailOptions = {
            from: "Alojamento Ideal <site@alojamentoideal.pt>",
            to: email,
            subject,
            html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Mail sent: ", info.messageId);
        return { success: true };
    } catch (error) {
        console.error("Mail failed: ", error);
        return { success: false, message: "mail-error" };
    }
}