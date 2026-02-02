import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Email service utility for sending emails
 * Supports both SMTP and development mode (console logging)
 */

// Create transporter based on environment
const createTransporter = () => {
  // If SMTP credentials are provided, use SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // In development, use ethereal email for testing
  // In production without SMTP, this will log a warning
  if (process.env.NODE_ENV === 'development') {
    logger.warn('SMTP not configured - emails will be logged to console only');
    return null;
  }

  logger.error('SMTP not configured in production - emails cannot be sent');
  return null;
};

const transporter = createTransporter();

/**
 * Send email function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<Object>} - Email send result
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // If no transporter, just log in development
    if (!transporter) {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📧 [DEV MODE] Email would be sent:\nTo: ${to}\nSubject: ${subject}\n${text}`);
        return { success: true, messageId: 'dev-mode', devMode: true };
      } else {
        throw new Error('Email service not configured');
      }
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Context Hub" <noreply@contexthub.app>',
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided, otherwise plain text
    });

    logger.info(`📧 Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} frontendUrl - Frontend URL for reset link
 */
export const sendPasswordResetEmail = async (email, resetToken, frontendUrl) => {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request';
  const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This link will expire in 1 hour.<br>
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send email verification email
 * @param {string} email - User email
 * @param {string} verificationToken - Email verification token
 * @param {string} frontendUrl - Frontend URL for verification link
 */
export const sendEmailVerification = async (email, verificationToken, frontendUrl) => {
  const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const subject = 'Verify Your Email Address';
  const text = `Welcome! Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Context Hub!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

export default { sendEmail, sendPasswordResetEmail, sendEmailVerification };
