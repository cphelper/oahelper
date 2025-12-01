import nodemailer from 'nodemailer'

// Create transporter with connection pooling for faster emails
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'support@oahelper.in',
    pass: 'Kam25hai@123',
  },
  pool: true, // Enable connection pooling
  maxConnections: 5, // Max concurrent connections
  maxMessages: 100, // Max messages per connection
  rateDelta: 1000, // Rate limiting
  rateLimit: 5, // Max 5 messages per second
  connectionTimeout: 5000, // 5 second connection timeout
  greetingTimeout: 5000, // 5 second greeting timeout
  socketTimeout: 10000, // 10 second socket timeout
})

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"Oahelper" <support@oahelper.in>',
      to: email,
      subject: 'Password Reset Code - OA Helper',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset</h2>
          <p style="color: #666; font-size: 16px;">You requested to reset your password. Use the code below to proceed:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} OA Helper</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"Oahelper" <support@oahelper.in>',
      to: email,
      subject: 'Verify Your Email - OA Helper',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px;">Welcome to OA Helper! Use the code below to verify your email:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} OA Helper</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}
