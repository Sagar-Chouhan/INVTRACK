import nodemailer from 'nodemailer'

// Email configuration (use environment variables in production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
})

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User's full name
 */
export async function sendOTPEmail(email, otp, userName) {
  const mailOptions = {
    from: {
      name: 'INVTrack Software',
      address: process.env.EMAIL_USER || 'noreply@invtrack.com'
    },
    to: email,
    subject: 'Password Reset OTP - INVTrack',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; 
                     text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; 
                      letter-spacing: 8px; font-family: monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; 
                     padding: 12px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 INVTrack Software</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                Valid for 10 minutes
              </p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you did not request this password reset, 
              please ignore this email. Your password will remain unchanged.
            </div>

            <p style="margin-top: 20px;">
              For security reasons, this OTP will expire in <strong>10 minutes</strong>.
            </p>

            <p>
              Best regards,<br>
              <strong>INVTrack Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from INVTrack Software. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} INVTrack. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`OTP email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Email sending failed:', error.message)
    throw new Error('Failed to send OTP email. Please try again.')
  }
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
