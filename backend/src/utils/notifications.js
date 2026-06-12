import nodemailer from 'nodemailer'

// Configure email transporter
// For Gmail: Enable "Less secure app access" or use App Password
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
})

/**
 * Send OTP via Email
 */
export async function sendOTPEmail({ to, recipientName, productName, quantity, unit, issuedBy, otp, purpose }) {
  try {
    const mailOptions = {
      from: `"INVTrack System" <${process.env.EMAIL_USER || 'noreply@invtrack.com'}>`,
      to: to,
      subject: '🔔 Product Issued - Verification Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Product Issued</h1>
              <p>A product has been issued in your name</p>
            </div>
            
            <p>Dear <strong>${recipientName}</strong>,</p>
            
            <p>This is to inform you that a product has been issued to you from our inventory system.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Product:</span>
                <span class="detail-value">${productName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">${quantity} ${unit}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Issued By:</span>
                <span class="detail-value">${issuedBy}</span>
              </div>
              ${purpose ? `
              <div class="detail-row">
                <span class="detail-label">Purpose:</span>
                <span class="detail-value">${purpose}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Your Verification OTP:</p>
              <div class="otp">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 24 hours</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Note:</strong> Please keep this OTP secure. You may need it for verification purposes.
            </p>
            
            <div class="footer">
              <p>This is an automated message from INVTrack Inventory Management System</p>
              <p>© 2026 INVTrack. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send SMS (Mock function - integrate with SMS gateway)
 */
export async function sendOTPSMS({ mobile, recipientName, productName, quantity, unit, otp }) {
  try {
    // TODO: Integrate with SMS gateway (Twilio, MSG91, etc.)
    const message = `Dear ${recipientName}, Product "${productName}" (${quantity} ${unit}) has been issued to you. Your OTP: ${otp}. Valid for 24 hours. -INVTrack`
    
    console.log('\n📱 SMS NOTIFICATION (Mock)')
    console.log('To:', mobile)
    console.log('Message:', message)
    console.log('')
    
    // In production, call SMS API here:
    // await smsGateway.send({ to: mobile, message })
    
    return { success: true, method: 'mock' }
  } catch (error) {
    console.error('Failed to send SMS:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send daily pending-audit reminder to auditor
 */
export async function sendAuditReminderEmail({ to, auditorName, pendingItems }) {
  try {
    const rows = pendingItems
      .map((item, index) => {
        const deadline = item.verification_deadline
          ? new Date(item.verification_deadline).toLocaleDateString('en-IN')
          : '-'
        const daysRemaining = item.daysRemaining
        const statusText =
          daysRemaining < 0
            ? `${Math.abs(daysRemaining)} days overdue`
            : `${daysRemaining} days left`

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.categoryName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.recipientName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.issuedQty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${deadline}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: ${daysRemaining < 0 ? '#dc2626' : '#2563eb'};">${statusText}</td>
          </tr>
        `
      })
      .join('')

    const mailOptions = {
      from: `"INVTrack System" <${process.env.EMAIL_USER || 'noreply@invtrack.com'}>`,
      to,
      subject: `Pending Audit Reminder - ${pendingItems.length} item(s) need verification`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h2 style="margin-bottom: 8px;">Daily Audit Reminder</h2>
          <p>Hello <strong>${auditorName}</strong>,</p>
          <p>You have <strong>${pendingItems.length}</strong> pending audit verification item(s). Please complete verification within 30 days from issue date.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <thead>
              <tr style="background: #f3f4f6; text-align: left;">
                <th style="padding: 10px;">#</th>
                <th style="padding: 10px;">Product</th>
                <th style="padding: 10px;">Category</th>
                <th style="padding: 10px;">Recipient</th>
                <th style="padding: 10px;">Qty</th>
                <th style="padding: 10px;">Deadline</th>
                <th style="padding: 10px;">Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p style="margin-top: 16px;">Please login to INVTrack and complete your pending verifications.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated daily reminder from INVTrack.</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send audit reminder email:', error.message)
    return { success: false, error: error.message }
  }
}
