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
   * Initialize a payment order with Cashfree
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

    const orderId = payment ? payment.orderId : `ORDER-${applicationId}-${Date.now()}`;

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          applicationId,
          orderId,
          amount: app.amountPaid,
          status: 'PENDING',
        },
      });
    }

    const appId = this.configService.get<string>('CASHFREE_APP_ID');
    const secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY');
    const apiUrl = this.configService.get<string>('CASHFREE_API_URL');

    // For local/dev testing, if dummy test keys are used, return sandbox session
    try {
      this.logger.log(`Creating Cashfree order for ${orderId}`);
      
      const response = await axios.post(
        `${apiUrl}/orders`,
        {
          order_id: orderId,
          order_amount: app.amountPaid,
          order_currency: 'INR',
          customer_details: {
            customer_id: app.customerPhone, // Unique ID format
            customer_name: app.customerName,
            customer_email: app.customerEmail,
            customer_phone: app.customerPhone,
          },
          order_meta: {
            // Frontend will redirect/handle this return
            return_url: `http://localhost:5000/index.html?track=${applicationId}`,
            notify_url: `${this.configService.get<string>('BACKEND_WEBHOOK_URL', 'http://localhost:3000')}/payments/webhook`,
          },
        },
        {
          headers: {
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        payment_session_id: response.data.payment_session_id,
        order_id: orderId,
        amount: app.amountPaid,
        cf_order_id: response.data.cf_order_id,
      };
    } catch (error) {
      this.logger.error(`Cashfree API Error: ${error.response?.data?.message || error.message}`);
      
      // Fallback response for simulator/demo mode when credentials aren't live
      return {
        is_simulated: true,
        order_id: orderId,
        amount: app.amountPaid,
        payment_session_id: `SIM-SESSION-${orderId}`,
      };
    }
  }

  /**
   * Verify Cashfree webhook request signature
   */
  verifyWebhookSignature(signature: string, timestamp: string, rawBody: string): boolean {
    const secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY');
    if (!secretKey) return false;

    // Signature formula = SHA256 HMAC of timestamp + rawBody
    const data = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('base64');

    return computedSignature === signature;
  }

  /**
   * Handle Webhook updates (Cashfree callback)
   */
  async handleWebhook(payload: any) {
    this.logger.log(`Received payment webhook payload: ${JSON.stringify(payload)}`);
    
    // Extract properties depending on Cashfree webhook format
    const { data } = payload;
    if (!data) return { status: 'ignored' };

    const orderId = data.order?.order_id;
    const paymentStatus = data.payment?.payment_status;
    const transactionId = data.payment?.cf_payment_id || `TXN-${Date.now()}`;
    const paymentMethod = data.payment?.payment_method?.type || 'upi';

    if (!orderId || !paymentStatus) {
      return { status: 'invalid_data' };
    }

    if (paymentStatus === 'SUCCESS') {
      return this.markPaymentSuccessful(orderId, transactionId, paymentMethod, data);
    } else if (paymentStatus === 'FAILED') {
      return this.markPaymentFailed(orderId, data);
    }

    return { status: 'unhandled_event' };
  }

  /**
   * Verify payment status directly (pull API)
   */
  async verifyPaymentDirectly(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { application: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', transactionId: payment.transactionId };
    }

    const appId = this.configService.get<string>('CASHFREE_APP_ID');
    const secretKey = this.configService.get<string>('CASHFREE_SECRET_KEY');
    const apiUrl = this.configService.get<string>('CASHFREE_API_URL');

    try {
      const response = await axios.get(`${apiUrl}/orders/${orderId}`, {
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const orderStatus = response.data.order_status;
      if (orderStatus === 'PAID') {
        // Fetch payment details
        const paymentsResponse = await axios.get(`${apiUrl}/orders/${orderId}/payments`, {
          headers: {
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2023-08-01',
          },
        });

        const successPayment = paymentsResponse.data.find((p: any) => p.payment_status === 'SUCCESS');
        if (successPayment) {
          await this.markPaymentSuccessful(
            orderId,
            successPayment.cf_payment_id,
            successPayment.payment_group,
            successPayment
          );
          return { status: 'SUCCESS', transactionId: successPayment.cf_payment_id };
        }
      }
    } catch (err) {
      this.logger.error(`Direct payment verification failed: ${err.message}`);
    }

    return { status: payment.status };
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
