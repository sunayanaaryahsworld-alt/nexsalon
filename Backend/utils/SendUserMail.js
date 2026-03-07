
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const sendUserMail = async ({ to, name, message }) => {
  const info = await transporter.sendMail({
    from: `"Salon & Spa" <${process.env.GMAIL_USER}>`,
    to,
    subject: "We received your inquiry ✅",
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f6f8fc; padding:32px;">
    <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,0.06); overflow:hidden;">

      <!-- Header -->
      <div style="background:#e8eef9; padding:22px 30px; border-bottom:1px solid #dbe3f3;">
        <h2 style="margin:0; color:#1e3a8a; font-weight:600;">
          Salon & Spa ✨
        </h2>
        <p style="margin:6px 0 0; font-size:14px; color:#475569;">
          Inquiry confirmation
        </p>
      </div>

      <!-- Content -->
      <div style="padding:30px; color:#1f2937;">
        <p style="font-size:15px; margin:0 0 12px;">
          Hello <b>${name}</b> 👋,
        </p>

        <p style="font-size:14.5px; line-height:1.7; color:#374151;">
          Thank you for contacting <b>Salon & Spa</b>.  
          We’ve successfully received your inquiry and our team will respond shortly.
        </p>

        <!-- Message box -->
        <div style="margin:24px 0; padding:18px 20px; background:#f8fafc; border-radius:6px; border:1px solid #e5eaf5;">
          <p style="margin:0 0 6px; font-size:13px; color:#64748b;">
            📨 <b>Your message</b>
          </p>
          <p style="margin:0; font-size:14px; color:#111827;">
            ${message}
          </p>
        </div>

        <p style="font-size:14px; color:#4b5563;">
          If you have any additional details, feel free to reply to this email.
        </p>

        <p style="margin-top:28px; font-size:14px;">
          Kind regards,<br />
          <b>Salon & Spa Team</b>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc; padding:14px 24px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5eaf5;">
        © ${new Date().getFullYear()} Salon & Spa · All rights reserved
      </div>

    </div>
  </div>
`
  });


  console.log("📧 Email sent to:", to);
  console.log("Message ID:", info.messageId);
};


export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Salon Booking" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "LOADED" : "MISSING");






