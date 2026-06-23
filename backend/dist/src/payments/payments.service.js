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
        const appId = this.configService.get('CASHFREE_APP_ID');
        const secretKey = this.configService.get('CASHFREE_SECRET_KEY');
        const apiUrl = this.configService.get('CASHFREE_API_URL');
        try {
            this.logger.log(`Creating Cashfree order for ${orderId}`);
            const response = await axios_1.default.post(`${apiUrl}/orders`, {
                order_id: orderId,
                order_amount: app.amountPaid,
                order_currency: 'INR',
                customer_details: {
                    customer_id: app.customerPhone,
                    customer_name: app.customerName,
                    customer_email: app.customerEmail,
                    customer_phone: app.customerPhone,
                },
                order_meta: {
                    return_url: `http://localhost:5000/index.html?track=${applicationId}`,
                    notify_url: `${this.configService.get('BACKEND_WEBHOOK_URL', 'http://localhost:3000')}/payments/webhook`,
                },
            }, {
                headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01',
                    'Content-Type': 'application/json',
                },
            });
            return {
                payment_session_id: response.data.payment_session_id,
                order_id: orderId,
                amount: app.amountPaid,
                cf_order_id: response.data.cf_order_id,
            };
        }
        catch (error) {
            this.logger.error(`Cashfree API Error: ${error.response?.data?.message || error.message}`);
            return {
                is_simulated: true,
                order_id: orderId,
                amount: app.amountPaid,
                payment_session_id: `SIM-SESSION-${orderId}`,
            };
        }
    }
    verifyWebhookSignature(signature, timestamp, rawBody) {
        const secretKey = this.configService.get('CASHFREE_SECRET_KEY');
        if (!secretKey)
            return false;
        const data = timestamp + rawBody;
        const computedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(data)
            .digest('base64');
        return computedSignature === signature;
    }
    async handleWebhook(payload) {
        this.logger.log(`Received payment webhook payload: ${JSON.stringify(payload)}`);
        const { data } = payload;
        if (!data)
            return { status: 'ignored' };
        const orderId = data.order?.order_id;
        const paymentStatus = data.payment?.payment_status;
        const transactionId = data.payment?.cf_payment_id || `TXN-${Date.now()}`;
        const paymentMethod = data.payment?.payment_method?.type || 'upi';
        if (!orderId || !paymentStatus) {
            return { status: 'invalid_data' };
        }
        if (paymentStatus === 'SUCCESS') {
            return this.markPaymentSuccessful(orderId, transactionId, paymentMethod, data);
        }
        else if (paymentStatus === 'FAILED') {
            return this.markPaymentFailed(orderId, data);
        }
        return { status: 'unhandled_event' };
    }
    async verifyPaymentDirectly(orderId) {
        const payment = await this.prisma.payment.findUnique({
            where: { orderId },
            include: { application: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment for order ${orderId} not found`);
        }
        if (payment.status === 'SUCCESS') {
            return { status: 'SUCCESS', transactionId: payment.transactionId };
        }
        const appId = this.configService.get('CASHFREE_APP_ID');
        const secretKey = this.configService.get('CASHFREE_SECRET_KEY');
        const apiUrl = this.configService.get('CASHFREE_API_URL');
        try {
            const response = await axios_1.default.get(`${apiUrl}/orders/${orderId}`, {
                headers: {
                    'x-client-id': appId,
                    'x-client-secret': secretKey,
                    'x-api-version': '2023-08-01',
                },
            });
            const orderStatus = response.data.order_status;
            if (orderStatus === 'PAID') {
                const paymentsResponse = await axios_1.default.get(`${apiUrl}/orders/${orderId}/payments`, {
                    headers: {
                        'x-client-id': appId,
                        'x-client-secret': secretKey,
                        'x-api-version': '2023-08-01',
                    },
                });
                const successPayment = paymentsResponse.data.find((p) => p.payment_status === 'SUCCESS');
                if (successPayment) {
                    await this.markPaymentSuccessful(orderId, successPayment.cf_payment_id, successPayment.payment_group, successPayment);
                    return { status: 'SUCCESS', transactionId: successPayment.cf_payment_id };
                }
            }
        }
        catch (err) {
            this.logger.error(`Direct payment verification failed: ${err.message}`);
        }
        return { status: payment.status };
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