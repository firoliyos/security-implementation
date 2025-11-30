// utils/sendEmail.js
import { transporter } from "../config/email.js";

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Leave System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("Email sent:", subject);

  } catch (err) {
    console.error("Email sending failed:", err);
  }
};
