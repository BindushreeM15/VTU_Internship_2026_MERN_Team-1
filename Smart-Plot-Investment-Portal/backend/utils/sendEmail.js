const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ use Gmail service
  auth: {
    user: process.env.SMTP_USER, // your gmail
    pass: process.env.SMTP_PASS, // app password (NOT your real password)
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Smart Plot" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;