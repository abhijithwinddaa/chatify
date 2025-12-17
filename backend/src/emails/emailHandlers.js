import { resendClient, sender } from "../lib/resend.js"
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js"


export const sendWelcomeEmail = async (email, name, clientURL) => {
    try {
        const { data, error } = await resendClient.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Welcome to Chatify!",
            html: createWelcomeEmailTemplate(name, clientURL)
        });

        if (error) {
            // Log error but don't throw - email is non-critical
            console.warn("⚠️ Welcome email skipped (Resend config):", error.message);
            return { success: false, error: error.message };
        }

        console.log("✅ Welcome email sent successfully:", data?.id);
        return { success: true, data };
    } catch (err) {
        // Catch any unexpected errors - still don't block signup
        console.warn("⚠️ Welcome email failed:", err.message);
        return { success: false, error: err.message };
    }
};
