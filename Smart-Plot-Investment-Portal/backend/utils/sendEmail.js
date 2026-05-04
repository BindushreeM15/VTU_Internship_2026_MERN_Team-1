const nodemailer = require("nodemailer");

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("SMTP_USER and SMTP_PASS must be defined in environment variables");
}

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

// Send booking confirmation email with plot and builder details
const sendBookingConfirmationEmail = async (investorEmail, bookingDetails) => {
  try {
    const {
      investorName,
      bookingId,
      plotNumber,
      plotSize,
      plotFacing,
      plotPrice,
      tokenAmount,
      projectName,
      projectLocation,
      builderName,
      builderCompany,
      builderPhone,
      builderEmail,
    } = bookingDetails;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px; }
          .card { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #667eea; }
          .card-label { font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .card-value { font-size: 16px; color: #333; margin-top: 5px; }
          .highlight { background: #fffacd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffd700; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Thank you for your purchase, ${investorName}</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">📋 Booking Details</div>
              <div class="card">
                <div class="card-label">Booking ID</div>
                <div class="card-value">${bookingId}</div>
              </div>
              <div class="card">
                <div class="card-label">Amount Paid</div>
                <div class="card-value">₹${Number(tokenAmount).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🏠 Plot Details</div>
              <div class="card">
                <div class="card-label">Plot Number</div>
                <div class="card-value">${plotNumber}</div>
              </div>
              <div class="card">
                <div class="card-label">Size</div>
                <div class="card-value">${plotSize} Sq.Ft</div>
              </div>
              <div class="card">
                <div class="card-label">Facing</div>
                <div class="card-value">${plotFacing}</div>
              </div>
              <div class="card">
                <div class="card-label">Price</div>
                <div class="card-value">₹${Number(plotPrice).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🏢 Project Details</div>
              <div class="card">
                <div class="card-label">Project Name</div>
                <div class="card-value">${projectName}</div>
              </div>
              <div class="card">
                <div class="card-label">Location</div>
                <div class="card-value">${projectLocation}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">👷 Builder Contact</div>
              <div class="card">
                <div class="card-label">Name</div>
                <div class="card-value">${builderName}</div>
              </div>
              <div class="card">
                <div class="card-label">Company</div>
                <div class="card-value">${builderCompany}</div>
              </div>
              <div class="card">
                <div class="card-label">Email</div>
                <div class="card-value"><a href="mailto:${builderEmail}">${builderEmail}</a></div>
              </div>
              <div class="card">
                <div class="card-label">Phone</div>
                <div class="card-value"><a href="tel:${builderPhone}">${builderPhone}</a></div>
              </div>
            </div>

            <div class="highlight">
              <strong>📌 Next Steps:</strong><br>
              The builder will contact you shortly to complete the formalities and handover procedures. Please keep your booking details safe for future reference.
            </div>
          </div>

          <div class="footer">
            <p>&copy; 2026 Smart Plot Investment Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(investorEmail, "🎉 Your Plot Booking is Confirmed!", html);
    return true;
  } catch (error) {
    console.error("❌ Booking confirmation email failed:", error);
    throw error;
  }
};

module.exports = { sendEmail, sendBookingConfirmationEmail };
module.exports.default = sendEmail;