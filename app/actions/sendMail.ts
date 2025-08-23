"use server"
import { verifySession } from "@/utils/verifySession";
import nodemailer from "nodemailer";

export async function sendMail({ email, html, subject }: { email: string, html: string, subject: string }) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const transporter = nodemailer.createTransport({
        host: "mail.alojamentoideal.pt",
        port: 465,
        secure: true, // upgrade later with STARTTLS
        auth: {
            user: "site@alojamentoideal.pt",
            pass: process.env.WEBMAIL_PASS,
        },
    });
    const mailOptions = {
        from: "Alojamento Ideal <site@alojamentoideal.pt>",
        to: email,
        subject,
        html,
    };
    transporter.sendMail(mailOptions, function (err) {
        if (err) {
            return { success: false, message: "mail-error" };
        }
    });
    return { success: true }
}