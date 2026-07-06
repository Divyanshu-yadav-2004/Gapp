"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const email_service_1 = require("../notifications/email.service");
const notification_gateway_1 = require("../notifications/notification.gateway");
const axios_1 = require("axios");
const crypto = require("crypto");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, configService, emailService, notificationGateway) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.notificationGateway = notificationGateway;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async createOrder(applicationId) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application ${applicationId} not found`);
        }
        if (app.amountPaid <= 0) {
            throw new common_1.BadRequestException('This application has no fee and is processed as an Inquiry.');
        }
        const existingSuccessfulPayment = await this.prisma.payment.findFirst({
            where: {
                applicationId,
                status: 'SUCCESS',
            },
        });
        if (existingSuccessfulPayment) {
            throw new common_1.BadRequestException('This application has already been paid for.');
        }
        let payment = await this.prisma.payment.findFirst({
            where: { applicationId, status: 'PENDING' },
        });
        let rzpOrderId;
        const amount = app.amountPaid;
        if (payment && payment.orderId.startsWith('order_')) {
            rzpOrderId = payment.orderId;
        }
        else {
            const receiptId = `ORDER-${applicationId}-${Date.now()}`;
            const keyId = this.configService.get('RAZORPAY_KEY_ID');
            const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
            if (!keyId || !keySecret) {
                throw new common_1.BadRequestException('Razorpay API keys are not configured in environment variables');
            }
            const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
            try {
                this.logger.log(`Creating Razorpay order for application ${applicationId} with receipt ${receiptId}`);
                const response = await axios_1.default.post('https://api.razorpay.com/v1/orders', {
                    amount: Math.round(amount * 100),
                    currency: 'INR',
                    receipt: receiptId,
                    notes: {
                        applicationId: app.id,
                        serviceName: app.serviceName,
                        customerName: app.customerName,
                        customerPhone: app.customerPhone,
                        customerEmail: app.customerEmail,
                    },
                }, {
                    headers: {
                        Authorization: authHeader,
                        'Content-Type': 'application/json',
                    },
                });
                rzpOrderId = response.data.id;
                if (payment) {
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
                }
                else {
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
            }
            catch (error) {
                const errMsg = error.response?.data?.error?.description || error.message;
                this.logger.error(`Razorpay API Error: ${errMsg}`);
                throw new common_1.BadRequestException(`Payment gateway error: ${errMsg}`);
            }
        }
        return {
            order_id: rzpOrderId,
            amount: amount,
            currency: 'INR',
            key_id: this.configService.get('RAZORPAY_KEY_ID'),
            customer_name: app.customerName,
            customer_email: app.customerEmail,
            customer_phone: app.customerPhone,
        };
    }
    async verifyPaymentSignature(orderId, paymentId, signature) {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET');
        if (!secret) {
            throw new common_1.BadRequestException('Razorpay Key Secret is not configured');
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
        let paymentMethod = 'gateway';
        let fullPayload = { verifiedViaSignature: true };
        try {
            const keyId = this.configService.get('RAZORPAY_KEY_ID');
            const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;
            const response = await axios_1.default.get(`https://api.razorpay.com/v1/payments/${paymentId}`, { headers: { Authorization: authHeader } });
            if (response.data) {
                paymentMethod = response.data.method || 'gateway';
                fullPayload = { ...response.data, verifiedViaSignature: true };
            }
        }
        catch (err) {
            this.logger.warn(`Could not pull payment info from Razorpay API: ${err.message}`);
        }
        await this.markPaymentSuccessful(orderId, paymentId, paymentMethod, {
            ...fullPayload,
            paidTime: new Date().toISOString(),
        });
        return { status: 'SUCCESS', transactionId: paymentId };
    }
    async getPaymentsForOrder(orderId) {
        let payment = await this.prisma.payment.findUnique({
            where: { orderId },
            include: { application: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment record for order ${orderId} not found`);
        }
        if (payment.status === 'PENDING') {
            try {
                const keyId = this.configService.get('RAZORPAY_KEY_ID');
                const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
                if (keyId && keySecret) {
                    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
                    const response = await axios_1.default.get(`https://api.razorpay.com/v1/orders/${orderId}/payments`, { headers: { Authorization: authHeader } });
                    const items = response.data.items || [];
                    const capturedPayment = items.find((p) => p.status === 'captured');
                    const failedPayment = items.find((p) => p.status === 'failed');
                    if (capturedPayment) {
                        await this.markPaymentSuccessful(orderId, capturedPayment.id, capturedPayment.method || 'gateway', { ...capturedPayment, paidTime: new Date().toISOString() });
                        payment = await this.prisma.payment.findUnique({ where: { orderId }, include: { application: true } });
                    }
                    else if (failedPayment) {
                        await this.markPaymentFailed(orderId, {
                            ...failedPayment,
                            failureReason: failedPayment.error_description || 'Razorpay payment failed status',
                            failedAt: new Date().toISOString(),
                        });
                        payment = await this.prisma.payment.findUnique({ where: { orderId }, include: { application: true } });
                    }
                }
            }
            catch (err) {
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
    verifyWebhookSignature(signature, rawBody) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
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
    async handleWebhook(payload) {
        this.logger.log(`Received payment webhook event: ${payload.event}`);
        const event = payload.event;
        if (event === 'payment.captured' || event === 'order.paid') {
            const orderEntity = payload.payload?.order?.entity;
            const paymentEntity = payload.payload?.payment?.entity;
            const orderId = orderEntity?.id || paymentEntity?.order_id;
            const transactionId = paymentEntity?.id || `TXN-${Date.now()}`;
            const paymentMethod = paymentEntity?.method || 'gateway';
            if (orderId) {
                return this.markPaymentSuccessful(orderId, transactionId, paymentMethod, {
                    ...payload.payload,
                    paidTime: new Date().toISOString(),
                });
            }
        }
        else if (event === 'payment.failed') {
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
    async verifyPaymentDirectly(orderId) {
        const lookup = await this.getPaymentsForOrder(orderId);
        return {
            status: lookup.status,
            transactionId: lookup.paymentId,
        };
    }
    async markPaymentSuccessful(orderId, transactionId, paymentMethod, gatewayResponse) {
        const payment = await this.prisma.payment.findUnique({
            where: { orderId },
            include: { application: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment record with Order ID ${orderId} not found`);
        }
        if (payment.status === 'SUCCESS') {
            this.logger.log(`Payment for order ${orderId} already marked as SUCCESS`);
            return { status: 'already_completed' };
        }
        await this.prisma.payment.update({
            where: { orderId },
            data: {
                status: 'SUCCESS',
                transactionId,
                paymentMethod,
                gatewayResponse: gatewayResponse || {},
            },
        });
        const updatedApp = await this.prisma.application.update({
            where: { id: payment.applicationId },
            data: {
                paymentStatus: 'Paid',
            },
        });
        this.logger.log(`Payment SUCCESS: Order ID ${orderId}. Application ${payment.applicationId} set to Paid`);
        await this.emailService.sendWelcomeAndSubmissionEmail(updatedApp.customerEmail, updatedApp.customerName, updatedApp.id, updatedApp.serviceName, payment.amount, updatedApp.completionTimeline);
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        if (adminEmail) {
            await this.emailService.sendAdminPaymentSuccessNotification(adminEmail, updatedApp.customerName, updatedApp.serviceName, payment.amount, transactionId, 'Paid');
            await this.emailService.sendAdminNotificationOfNewSubmission(adminEmail, updatedApp.customerName, updatedApp.id, updatedApp.serviceName, payment.amount);
        }
        this.notificationGateway.sendStatusUpdateToUser(updatedApp.id, {
            id: updatedApp.id,
            paymentStatus: 'Paid',
        });
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
    async markPaymentFailed(orderId, gatewayResponse) {
        const payment = await this.prisma.payment.findUnique({
            where: { orderId },
            include: { application: true },
        });
        if (!payment)
            return { status: 'not_found' };
        if (payment.status === 'SUCCESS')
            return { status: 'already_completed' };
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
    async simulatePaymentResult(orderId, status) {
        const txnId = `SIM-TXN-${Date.now()}`;
        if (status === 'success') {
            return this.markPaymentSuccessful(orderId, txnId, 'upi-intent', { simulated: true });
        }
        else {
            return this.markPaymentFailed(orderId, { simulated: true });
        }
    }
    getPaymentConfig() {
        return {
            upiId: this.configService.get('PAYEE_UPI_ID', 'easycafe@upi'),
            payeeName: this.configService.get('PAYEE_NAME', 'EasyCafe Services'),
            whatsappNumber: this.configService.get('ADMIN_WHATSAPP', '919988776655'),
        };
    }
    async logWhatsAppSent(applicationId) {
        const payment = await this.prisma.payment.findFirst({
            where: { applicationId },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment record for application ${applicationId} not found`);
        }
        if (payment.status === 'SUCCESS' || payment.status === 'VERIFIED') {
            return { status: 'already_verified' };
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SENT' },
        });
        await this.prisma.paymentLog.create({
            data: {
                applicationId,
                action: 'WHATSAPP_SENT',
                performedBy: 'user',
            },
        });
        this.notificationGateway.sendStatusUpdateToUser(applicationId, {
            id: applicationId,
            paymentStatus: 'Sent',
        });
        this.notificationGateway.sendToAdmins('payment:update', {
            applicationId,
            status: 'SENT',
        });
        return { status: 'success', payment: updatedPayment };
    }
    async markAsSeen(applicationId, staffEmail) {
        const existingSeenLog = await this.prisma.paymentLog.findFirst({
            where: { applicationId, action: 'SEEN', performedBy: staffEmail },
        });
        if (!existingSeenLog) {
            await this.prisma.paymentLog.create({
                data: {
                    applicationId,
                    action: 'SEEN',
                    performedBy: staffEmail,
                },
            });
        }
        return { status: 'success' };
    }
    async confirmPaymentManually(applicationId, staffEmail) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application ${applicationId} not found`);
        }
        const payment = await this.prisma.payment.findFirst({
            where: { applicationId },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment record for application ${applicationId} not found`);
        }
        if (payment.status === 'VERIFIED' || payment.status === 'SUCCESS') {
            return { status: 'already_completed' };
        }
        const txnId = `MANUAL-CONFIRM-${Date.now()}`;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'VERIFIED',
                transactionId: txnId,
                paymentMethod: 'upi-qr',
            },
        });
        const updatedApp = await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                paymentStatus: 'Paid',
            },
        });
        await this.prisma.paymentLog.create({
            data: {
                applicationId,
                action: 'VERIFIED',
                performedBy: staffEmail,
            },
        });
        const whatsappLog = await this.prisma.paymentLog.findFirst({
            where: { applicationId, action: 'WHATSAPP_SENT' },
        });
        const whatsappStatus = whatsappLog ? 'Confirmed via WhatsApp (clicked button)' : 'Manual override (button not clicked)';
        await this.emailService.sendUserPaymentReceiptConfirmedEmail(updatedApp.customerEmail, updatedApp.customerName, payment.amount, applicationId);
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        if (adminEmail) {
            await this.emailService.sendAdminPaymentReceiptNotificationEmail(adminEmail, updatedApp.customerName, updatedApp.customerEmail, payment.amount, updatedApp.serviceName, new Date(), whatsappStatus);
        }
        this.notificationGateway.sendStatusUpdateToUser(applicationId, {
            id: applicationId,
            paymentStatus: 'Paid',
        });
        this.notificationGateway.sendToAdmins('payment:success', {
            transactionId: txnId,
            customerName: updatedApp.customerName,
            serviceName: updatedApp.serviceName,
            amount: payment.amount,
            paymentDate: new Date(),
            status: 'Paid',
        });
        return { status: 'success' };
    }
    async rejectPaymentManually(applicationId, staffEmail) {
        const payment = await this.prisma.payment.findFirst({
            where: { applicationId },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment record for application ${applicationId} not found`);
        }
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REJECTED' },
        });
        await this.prisma.application.update({
            where: { id: applicationId },
            data: { paymentStatus: 'Failed' },
        });
        await this.prisma.paymentLog.create({
            data: {
                applicationId,
                action: 'REJECTED',
                performedBy: staffEmail,
            },
        });
        this.notificationGateway.sendStatusUpdateToUser(applicationId, {
            id: applicationId,
            paymentStatus: 'Failed',
        });
        this.notificationGateway.sendToAdmins('payment:update', {
            applicationId,
            status: 'REJECTED',
        });
        return { status: 'success' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        email_service_1.EmailService,
        notification_gateway_1.NotificationGateway])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map