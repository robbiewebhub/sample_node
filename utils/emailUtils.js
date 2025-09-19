const sendgrid = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendResetPasswordEmail = async (email, resetLink) => {
  const imagePath = path.join(__dirname, "Vector.png");
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const message = {
    to: email,
    from: "noreply@swye360.com",
    subject: "Reset your password",
    text: `Hello,

  We received a request to reset your password. Click on the following link to reset your password:
  ${resetLink}

  If you did not request this, please ignore this email.

  Best regards,
  Your Company Team`,
    html: `
     <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .email-container {
            max-width: 600px;
            margin: 50px auto;
            background: #fff;
            padding: 60px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .email-header {
            text-align: left;
          }

          .email-header img {
            max-width: 200px;
          }
          .email-body {
            margin-top: 20px;
          }
          .email-button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            margin-top: 20px;
          }
          .email-footer {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <img src="cid:Vector" alt="SWYE360 Logo" />
          </div>
          <div class="email-body">
            <p>Hello,</p>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset it:</p>
            <p>
              <a href="${resetLink}" class="email-button">Reset Password</a>
            </p>
            <p><strong>This link is valid for 15 minutes only.</strong></p>
            <p>
              If you did not request a password reset, please ignore this email and
              contact support at noreply@swye360.com.
            </p>
            <p>Best regards,</p>
            <p>SWYE360 Team</p>
          </div>
          <div class="email-footer">
            <div>This email was sent to <a href="mailto:supportemail">${email}</a></p>
            <p>©2024 SWYE360 Corporation Dallas, Texas 75036, US</p>
          </div>
        </div>
      </body>
    </html>

  `,
    attachments: [
      {
        content: imageBase64,
        filename: "Vector.png",
        type: "image/png",
        disposition: "inline",
        content_id: "Vector",
      },
    ],
  };

  try {
    await sendgrid.send(message);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

const sendUserCredentialsEmail = async ({
  email,
  password,
  department,
  role,
}) => {
  const imagePath = path.join(__dirname, "Vector.png");
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const message = {
    to: email,
    from: "noreply@swye360.com",
    subject: "Account Credentials",
    text: `Hello,
    If you did not request this, please ignore this email.
    Best regards,
    Your Company Team`,

    html: `
   <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Account Credentials</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .email-container {
        max-width: 600px;
        margin: 50px auto;
        background: #fff;
        padding: 60px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .email-header {
        text-align: left;
      }

      .email-header img {
        max-width: 200px;
      }
      .email-body {
        margin-top: 20px;
      }
      .email-button {
        display: inline-block;
        background-color: #007bff;
        color: #ffffff !important;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 16px;
        margin-top: 20px;
      }
      .email-footer {
        margin-top: 20px;
        font-size: 14px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h2>Account Credentials</h2>
      </div>
      <div class="email-body">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Role:</strong> ${role}</p>
      </div>
      <div class="email-footer">
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
      </div>
    </div>
  </body>
</html>


  `,
  };

  try {
    await sendgrid.send(message);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

const sendVisitingUserEmail = async ({
  fullName,
  email,
  phone,
  university,
}) => {
  const message = {
    to: "partners@swye360.com",
    from: "noreply@swye360.com",
    subject: "A user visited on higher ed guided tour.",

    text: `Hello,
      If you did not request this, please ignore this email.
      Best regards,
      Your Company Team`,

    html: `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Account Credentials</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .email-container {
              max-width: 600px;
              margin: 50px auto;
              background: #fff;
              padding: 60px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .email-header {
              text-align: left;
            }
      
            .email-header img {
              max-width: 200px;
            }
            .email-body {
              margin-top: 20px;
            }
            .email-button {
              display: inline-block;
              background-color: #007bff;
              color: #ffffff !important;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 16px;
              margin-top: 20px;
            }
            .email-footer {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h2>Visiting User Details :</h2>
            </div>
            <div class="email-body">
              <p><strong>Full Name:</strong> ${fullName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>University:</strong> ${university}</p>
            </div>
            <div class="email-footer">
              <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
            </div>
          </div>
        </body>
      </html>
  
  
    `,
  };
  try {
    await sendgrid.send(message);
  } catch (error) {
    logger.error(
      "An error occurred while sending email to visiting user: %s",
      error.message,
      { satck: error.stack }
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while sending email to visiting user. Please try again later.",
    });
  }
};

const sendRiskStudentEmail = async (
  email,
  message,
  subject,
  attachments = [],
  cc = []
) => {
  const mailInformation = {
    to: email,
    subject: subject,
    text: message,
    attachments,
    cc,
  };
  await sendMail(mailInformation);
};

const sendMail = async ({
  to,
  from = "noreply@swye360.com",
  subject,
  text,
  html,
  attachments = [],
  cc = [],
}) => {
  const message = {
    to,
    from,
    subject,
    text,
    html,
    cc,
    attachments,
  };
  try {
    await sendgrid.send(message);
  } catch (error) {
    logger.error("An error occurred while sending email: %s", error.message, {
      satck: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "An error occurred while sending email. Please try again later.",
    });
  }
};
module.exports = {
  sendResetPasswordEmail,
  sendUserCredentialsEmail,
  sendVisitingUserEmail,
  sendRiskStudentEmail,
};
