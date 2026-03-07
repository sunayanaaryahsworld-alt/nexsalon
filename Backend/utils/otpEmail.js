import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from: `"NexSalon" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "NexSalon – Verify Your Email",
    html: `
      <div style="margin:0; padding:0; background-color:#f5efe8; font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
          <tr>
            <td align="center">

              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="
                max-width:520px;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 20px 40px rgba(0,0,0,0.12);
              ">

                <!-- Header -->
                <tr>
                  <td style="
                    background:#2f2320;
                    padding:24px;
                    text-align:center;
                  ">
                    <div style="
                      font-size:22px;
                      font-weight:700;
                      letter-spacing:3px;
                      color:#d6b37c;
                    ">
                      NexSalon
                    </div>
                    <div style="
                      margin-top:6px;
                      font-size:12px;
                      letter-spacing:1px;
                      color:#f0e6d8;
                    ">
                    </div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px 28px;">

                    <h2 style="
                      margin:0 0 12px;
                      font-size:20px;
                      font-weight:600;
                      color:#2f2320;
                    ">
                      Hello ${name},
                    </h2>

                    <p style="
                      margin:0 0 24px;
                      font-size:14px;
                      line-height:22px;
                      color:#555;
                    ">
                      Welcome to <strong>NexSalon</strong>.  
                      Please use the One-Time Password below to verify your email address.
                    </p>

                    <!-- OTP -->
                    <div style="text-align:center; margin:28px 0;">
                      <div style="
                        display:inline-block;
                        padding:14px 30px;
                        font-size:28px;
                        font-weight:600;
                        letter-spacing:6px;
                        color:#2f2320;
                        background:#faf7f2;
                        border:2px dashed #d6b37c;
                        border-radius:10px;
                      ">
                        ${otp}
                      </div>
                    </div>

                    <p style="
                      margin:0 0 12px;
                      font-size:13px;
                      color:#666;
                      text-align:center;
                    ">
                      This OTP is valid for <strong>5 minutes</strong>.
                    </p>

                    <p style="
                      margin:0;
                      font-size:12px;
                      color:#888;
                      text-align:center;
                    ">
                      For your security, do not share this code with anyone.
                    </p>

                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 28px;">
                    <hr style="border:none; border-top:1px solid #eee;">
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="
                    padding:20px 28px 26px;
                    text-align:center;
                  ">
                    <p style="
                      margin:0;
                      font-size:12px;
                      color:#999;
                    ">
                      If you didn’t request this verification, you can safely ignore this email.
                    </p>
                    <p style="
                      margin-top:8px;
                      font-size:11px;
                      color:#bbb;
                    ">
                      © ${new Date().getFullYear()} NexSalon. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
              <!-- End Card -->

            </td>
          </tr>
        </table>
      </div>
    `
  });
};


