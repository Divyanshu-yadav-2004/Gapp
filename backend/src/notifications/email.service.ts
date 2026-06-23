import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendEmail(to: string, subject: string, htmlContent: string) {
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'EasyCafe');
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@easycafe.com');

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email successfully sent to ${to} (Subject: ${subject})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} (Subject: ${subject}): ${error.message}`);
    }
  }

  async sendWelcomeAndSubmissionEmail(
    email: string,
    customerName: string,
    applicationId: string,
    serviceName: string,
    amountPaid: number,
    timeline: string
  ) {
    const subject = `✅ Application Submitted Successfully — ${applicationId}`;
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlContent = `
      <div style="font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 26px;">Easy<span style="color: #1e1b4b;">Cafe</span></h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Smart Digital Assistant</p>
        </div>
        <div style="margin-bottom: 25px;">
          <p style="font-size: 16px; line-height: 1.5; color: #334155;">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5; color: #334155;">Thank you for applying through EasyCafe. Your application has been registered successfully. Our operators will process your submission within the timeline specified below.</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 25px; border-left: 4px solid #4f46e5;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; margin-bottom: 10px;">Application Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 40%;">Application ID:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${applicationId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Service Name:</td>
              <td style="padding: 6px 0; color: #0f172a;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Submission Date:</td>
              <td style="padding: 6px 0; color: #0f172a;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Current Status:</td>
              <td style="padding: 6px 0; color: #d97706; font-weight: bold;">Pending Verification</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount Paid:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">₹${amountPaid}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Est. Timeline:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: bold;">${timeline}</td>
            </tr>
          </table>
        </div>
        <div style="margin-bottom: 25px;">
          <p style="font-size: 14px; line-height: 1.5; color: #64748b;">You can track your application status anytime on our website using your Application ID.</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #64748b; text-align: center;">
          <p style="margin: 0 0 5px 0;">Need Help? Contact our Support Team:</p>
          <p style="margin: 0; font-weight: 500; color: #334155;">Email: support@easycafe.in | Mobile: +91 98765 43210</p>
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, htmlContent);
  }

  async sendAdminNotificationOfNewSubmission(
    adminEmail: string,
    customerName: string,
    applicationId: string,
    serviceName: string,
    amountPaid: number
  ) {
    const subject = `🚨 [New Application] EasyCafe ID: ${applicationId}`;
    const dateStr = new Date().toLocaleString('en-IN');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #fff;">
        <h2 style="color: #4f46e5; margin-top: 0;">New Application Submitted</h2>
        <p>Hello Admin,</p>
        <p>A customer has submitted a new application. Here are the details:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td><strong>App ID:</strong></td><td>${applicationId}</td></tr>
            <tr><td><strong>Customer Name:</strong></td><td>${customerName}</td></tr>
            <tr><td><strong>Service Name:</strong></td><td>${serviceName}</td></tr>
            <tr><td><strong>Amount Paid:</strong></td><td>₹${amountPaid}</td></tr>
            <tr><td><strong>Date/Time:</strong></td><td>${dateStr}</td></tr>
          </table>
        </div>
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Please login to the Staff Panel to review and process this application.</p>
      </div>
    `;

    await this.sendEmail(adminEmail, subject, htmlContent);
  }

  async sendAdminPaymentSuccessNotification(
    adminEmail: string,
    customerName: string,
    serviceName: string,
    amountPaid: number,
    transactionId: string,
    status: string
  ) {
    const subject = `💰 [Payment Successful] ₹${amountPaid} Received — Txn: ${transactionId}`;
    const dateStr = new Date().toLocaleString('en-IN');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #fff;">
        <h2 style="color: #10b981; margin-top: 0;">Payment Received Instantly</h2>
        <p>Hello Owner/Admin,</p>
        <p>A new payment has been processed successfully. Payment details below:</p>
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e6f4ea;"><td style="padding: 8px 0;"><strong>Customer Name:</strong></td><td>${customerName}</td></tr>
            <tr style="border-bottom: 1px solid #e6f4ea;"><td style="padding: 8px 0;"><strong>Service Name:</strong></td><td>${serviceName}</td></tr>
            <tr style="border-bottom: 1px solid #e6f4ea;"><td style="padding: 8px 0;"><strong>Amount Paid:</strong></td><td>₹${amountPaid}</td></tr>
            <tr style="border-bottom: 1px solid #e6f4ea;"><td style="padding: 8px 0;"><strong>Transaction ID:</strong></td><td>${transactionId}</td></tr>
            <tr style="border-bottom: 1px solid #e6f4ea;"><td style="padding: 8px 0;"><strong>Date & Time:</strong></td><td>${dateStr}</td></tr>
            <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #047857; font-weight: bold;">${status}</td></tr>
          </table>
        </div>
      </div>
    `;

    await this.sendEmail(adminEmail, subject, htmlContent);
  }

  async sendStatusChangeEmail(
    email: string,
    customerName: string,
    applicationId: string,
    serviceName: string,
    oldStatus: string,
    newStatus: string,
    comment: string,
    certificateNumber: string
  ) {
    const subject = `🔔 EasyCafe Status Update: Application ${applicationId} is ${newStatus}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #fff;">
        <h2 style="color: #3b82f6; margin-top: 0;">Application Status Update</h2>
        <p>Dear ${customerName},</p>
        <p>The status of your application <strong>${applicationId}</strong> for <strong>${serviceName}</strong> has been updated.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td><strong>Previous Status:</strong></td><td>${oldStatus}</td></tr>
            <tr><td><strong>New Status:</strong></td><td style="font-weight: bold; color: #1e3a8a;">${newStatus}</td></tr>
            ${comment ? `<tr><td><strong>Staff Notes:</strong></td><td>${comment}</td></tr>` : ''}
            ${certificateNumber ? `<tr><td><strong>Certificate / Reference Number:</strong></td><td style="font-weight: bold; color: #15803d;">${certificateNumber}</td></tr>` : ''}
          </table>
        </div>
        <p>You can track updates in real-time on our EasyCafe dashboard.</p>
      </div>
    `;

    await this.sendEmail(email, subject, htmlContent);
  }
}
