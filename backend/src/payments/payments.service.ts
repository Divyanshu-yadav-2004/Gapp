import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
    private notificationGateway: NotificationGateway
  ) {}

  /**
   * Initialize a payment order with Razorpay
   */
  async createOrder(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    if (app.amountPaid <= 0) {
      throw new BadRequestException('This application has no fee and is processed as an Inquiry.');
    }

    // Check if there is an existing successful payment
    const existingSuccessfulPayment = await this.prisma.payment.findFirst({
      where: {
        applicationId,
        status: 'SUCCESS',
      },
    });

    if (existingSuccessfulPayment) {
      throw new BadRequestException('This application has already been paid for.');
    }

    // Check for existing pending payment or create a new order ID
    let payment = await this.prisma.payment.findFirst({
      where: { applicationId, status: 'PENDING' },
    });

    let rzpOrderId: string;
    const amount = app.amountPaid;

    // If there is an existing pending payment and it's a Razorpay Order ID, reuse it
    if (payment && payment.orderId.startsWith('order_')) {
      rzpOrderId = payment.orderId;
    } else {
      const receiptId = `ORDER-${applicationId}-${Date.now()}`;
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
      const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
      
      if (!keyId || !keySecret) {
        throw new BadRequestException('Razorpay API keys are not configured in environment variables');
      }

      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

      try {
        this.logger.log(`Creating Razorpay order for application ${applicationId} with receipt ${receiptId}`);
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: Math.round(amount * 100), // in paise
            currency: 'INR',
            receipt: receiptId,
            notes: {
              applicationId: app.id,
              serviceName: app.serviceName,
              customerName: app.customerName,
              customerPhone: app.customerPhone,
              customerEmail: app.customerEmail,
            },
          },
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
            },
          }
        );

        rzpOrderId = response.data.id;

        if (payment) {
          // Update the existing pending payment record
          payment = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              orderId: rzpOrderId,
              gatewayResponse: {
                receiptId,
                rzpOrderId,
                currency: 'INR',
                createdTime: new Date().toISOString(),
              },
            },
          });
        } else {
          // Create a new pending payment record
          payment = await this.prisma.payment.create({
            data: {
              applicationId,
              orderId: rzpOrderId,
              amount,
              status: 'PENDING',
              gatewayResponse: {
                receiptId,
                rzpOrderId,
                currency: 'INR',
                createdTime: new Date().toISOString(),
              },
            },
          });
        }
      } catch (error) {
        const errMsg = error.response?.data?.error?.description || error.message;
        this.logger.error(`Razorpay API Error: ${errMsg}`);
        throw new BadRequestException(`Payment gateway error: ${errMsg}`);
      }
    }

    return {
      order_id: rzpOrderId,
      amount: amount,
      currency: 'INR',
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      customer_name: app.customerName,
      customer_email: app.customerEmail,
      customer_phone: app.customerPhone,
    };
  }

  /**
   * Verify signature using HMAC SHA256
   */
  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<any> {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new BadRequestException('Razorpay Key Secret is not configured');
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const isVerified = generatedSignature === signature;

    if (!isVerified) {
      this.logger.warn(`Signature verification FAILED for Order ID: ${orderId}`);
      await this.markPaymentFailed(orderId, {
        failureReason: 'Invalid payment signature (verification failed)',
        failedAt: new Date().toISOString(),
        paymentId,
        signature,
      });
      return { status: 'FAILED', message: 'Signature verification failed' };
    }

    this.logger.log(`Signature verification SUCCESS for Order ID: ${orderId}`);

    // Fetch the payment status details to save full data from Razorpay API
    let paymentMethod = 'gateway';
    let fullPayload = { verifiedViaSignature: true };
    try {
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
      const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;
      const response = await axios.get(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        { headers: { Authorization: authHeader } }
      );
      if (response.data) {
        paymentMethod = response.data.method || 'gateway';
        fullPayload = { ...response.data, verifiedViaSignature: true };
      }
    } catch (err) {
      this.logger.warn(`Could not pull payment info from Razorpay API: ${err.message}`);
    }

    await this.markPaymentSuccessful(orderId, paymentId, paymentMethod, {
      ...fullPayload,
      paidTime: new Date().toISOString(),
    });

    return { status: 'SUCCESS', transactionId: paymentId };
  }

  /**
   * Lookup payments for a specific Razorpay order
   */
  async getPaymentsForOrder(orderId: string) {
    let payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { application: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record for order ${orderId} not found`);
    }

    if (payment.status === 'PENDING') {
      try {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
        if (keyId && keySecret) {
          const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
          const response = await axios.get(
            `https://api.razorpay.com/v1/orders/${orderId}/payments`,
            { headers: { Authorization: authHeader } }
          );

          const items = response.data.items || [];
          const capturedPayment = items.find((p: any) => p.status === 'captured');
          const failedPayment = items.find((p: any) => p.status === 'failed');

          if (capturedPayment) {
            await this.markPaymentSuccessful(
              orderId,
              capturedPayment.id,
              capturedPayment.method || 'gateway',
              { ...capturedPayment, paidTime: new Date().toISOString() }
            );
            payment = await this.prisma.payment.findUnique({ where: { orderId }, include: { application: true } });
          } else if (failedPayment) {
            await this.markPaymentFailed(orderId, {
              ...failedPayment,
              failureReason: failedPayment.error_description || 'Razorpay payment failed status',
              failedAt: new Date().toISOString(),
            });
            payment = await this.prisma.payment.findUnique({ where: { orderId }, include: { application: true } });
          }
        }
      } catch (err) {
        this.logger.error(`Error fetching payments from Razorpay API: ${err.message}`);
      }
    }

    return {
      status: payment.status,
      paymentMethod: payment.paymentMethod || 'unknown',
      paymentId: payment.transactionId || 'none',
      amount: payment.amount,
      timestamp: payment.updatedAt,
    };
  }

  /**
   * Verify Razorpay webhook request signature
   */
  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signature check skipped.');
      return true;
    }

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return computedSignature === signature;
  }

  /**
   * Handle Webhook updates (Razorpay callback)
   */
  async handleWebhook(payload: any) {
    this.logger.log(`Received payment webhook event: ${payload.event}`);
    
    const event = payload.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const orderEntity = payload.payload?.order?.entity;
      const paymentEntity = payload.payload?.payment?.entity;
      
      const orderId = orderEntity?.id || paymentEntity?.order_id;
      const transactionId = paymentEntity?.id || `TXN-${Date.now()}`;
      const paymentMethod = paymentEntity?.method || 'gateway';

      if (orderId) {
        return this.markPaymentSuccessful(
          orderId,
          transactionId,
          paymentMethod,
          {
            ...payload.payload,
            paidTime: new Date().toISOString(),
          }
        );
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        return this.markPaymentFailed(orderId, {
          ...payload.payload,
          failureReason: paymentEntity.error_description || 'Payment failed event from webhook',
          failedAt: new Date().toISOString(),
        });
      }
    }

    return { status: 'ignored' };
  }

  /**
   * Verify payment status directly (pull API)
   */
  async verifyPaymentDirectly(orderId: string) {
    const lookup = await this.getPaymentsForOrder(orderId);
    return {
      status: lookup.status,
      transactionId: lookup.paymentId,
    };
  }

  /**
   * Mark transaction as Successful in DB, update application & trigger notifications
   */
  async markPaymentSuccessful(orderId: string, transactionId: string, paymentMethod: string, gatewayResponse: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { application: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record with Order ID ${orderId} not found`);
    }

    // Prevent duplicate processing
    if (payment.status === 'SUCCESS') {
      this.logger.log(`Payment for order ${orderId} already marked as SUCCESS`);
      return { status: 'already_completed' };
    }

    // Update payment record
    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: 'SUCCESS',
        transactionId,
        paymentMethod,
        gatewayResponse: gatewayResponse || {},
      },
    });

    // Update parent Application paymentStatus
    const updatedApp = await this.prisma.application.update({
      where: { id: payment.applicationId },
      data: {
        paymentStatus: 'Paid',
      },
    });

    this.logger.log(`Payment SUCCESS: Order ID ${orderId}. Application ${payment.applicationId} set to Paid`);

    // 1. Send Welcome & Application confirmation email to user
    await this.emailService.sendWelcomeAndSubmissionEmail(
      updatedApp.customerEmail,
      updatedApp.customerName,
      updatedApp.id,
      updatedApp.serviceName,
      payment.amount,
      updatedApp.completionTimeline
    );

    // 2. Notify Admin/Owner via Email instantly
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (adminEmail) {
      await this.emailService.sendAdminPaymentSuccessNotification(
        adminEmail,
        updatedApp.customerName,
        updatedApp.serviceName,
        payment.amount,
        transactionId,
        'Paid'
      );
      // also send submission alert
      await this.emailService.sendAdminNotificationOfNewSubmission(
        adminEmail,
        updatedApp.customerName,
        updatedApp.id,
        updatedApp.serviceName,
        payment.amount
      );
    }

    // 3. Emit Real-time notifications via WebSockets
    // User room real-time status updates
    this.notificationGateway.sendStatusUpdateToUser(updatedApp.id, {
      id: updatedApp.id,
      paymentStatus: 'Paid',
    });

    // Admin Dashboard real-time refreshes (new payment + application)
    this.notificationGateway.sendToAdmins('payment:success', {
      transactionId,
      customerName: updatedApp.customerName,
      serviceName: updatedApp.serviceName,
      amount: payment.amount,
      paymentDate: new Date(),
      status: 'Paid',
    });

    this.notificationGateway.sendToAdmins('application:new', {
      id: updatedApp.id,
      customerName: updatedApp.customerName,
      serviceName: updatedApp.serviceName,
      amountPaid: payment.amount,
      createdAt: updatedApp.createdAt,
    });

    return { status: 'success' };
  }

  async markPaymentFailed(orderId: string, gatewayResponse: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { application: true },
    });

    if (!payment) return { status: 'not_found' };
    if (payment.status === 'SUCCESS') return { status: 'already_completed' };

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: 'FAILED',
        gatewayResponse: gatewayResponse || {},
      },
    });

    await this.prisma.application.update({
      where: { id: payment.applicationId },
      data: {
        paymentStatus: 'Failed',
      },
    });

    this.notificationGateway.sendStatusUpdateToUser(payment.applicationId, {
      id: payment.applicationId,
      paymentStatus: 'Failed',
    });

    return { status: 'failed' };
  }

  /**
   * Helper mock payment for user flow testing in developer sandbox
   */
  async simulatePaymentResult(orderId: string, status: 'success' | 'fail') {
    const txnId = `SIM-TXN-${Date.now()}`;
    if (status === 'success') {
      return this.markPaymentSuccessful(orderId, txnId, 'upi-intent', { simulated: true });
    } else {
      return this.markPaymentFailed(orderId, { simulated: true });
    }
  }
}
