import { Resend } from "resend";
import config from "../config/config.js";

const resend = new Resend(config.RESEND_API_KEY);

export async function sendVerificationEmail({ to, otp }) {
    try {
        const senderEmail = config.EMAIL_FROM;

        const { data, error } = await resend.emails.send({
            from: senderEmail,
            to,
            subject: "Verify your email",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; text-align: center;">
                    <h2>Verify your email</h2>
                    <p>Use the verification code below to verify your email address.</p>

                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0;">
                        ${otp}
                    </div>

                    <p>This code will expire soon.</p>
                    <p style="color: #777; font-size: 13px;">
                        If you didn't request this code, you can ignore this email.
                    </p>
                </div>
            `
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (err) {
        console.error("Email Service Error:", err.message);
        throw err;
    }
}

export async function sendPasswordResetEmail({ to, otp }) {
    try {
        const senderEmail = config.EMAIL_FROM;

        const { data, error } = await resend.emails.send({
            from: senderEmail,
            to,
            subject: "Reset your password",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; text-align: center;">
                    <h2>Reset your password</h2>
                    <p>Use the code below to reset your password.</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire soon.</p>
                    <p style="color: #777; font-size: 13px;">
                        If you didn't request a password reset, you can ignore this email.
                    </p>
                </div>
            `
        });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (err) {
        console.error("Password Reset Email Error:", err.message);
        throw err;
    }
}