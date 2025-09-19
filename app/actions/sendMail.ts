"use server"
import env from "@/utils/env";
import nodemailer from "nodemailer";

export async function sendMail({ email, html, subject }: { email: string, html: string, subject: string }) {
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
    transporter.sendMail(mailOptions, function (err) {
        if (err) {
            console.log("Mail failed: ",err);
            return { success: false, message: "mail-error" };
        }
    });
    console.log("Mail sent!")
    return { success: true }
}