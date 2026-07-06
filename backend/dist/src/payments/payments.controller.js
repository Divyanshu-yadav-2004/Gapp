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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getPaymentConfig() {
        return this.paymentsService.getPaymentConfig();
    }
    async logWhatsAppSent(applicationId) {
        if (!applicationId) {
            throw new common_1.BadRequestException('applicationId is required');
        }
        return this.paymentsService.logWhatsAppSent(applicationId);
    }
    async markAsSeen(applicationId, req) {
        if (!applicationId) {
            throw new common_1.BadRequestException('applicationId is required');
        }
        const userEmail = req.user?.email || 'admin';
        return this.paymentsService.markAsSeen(applicationId, userEmail);
    }
    async confirmPayment(applicationId, req) {
        if (!applicationId) {
            throw new common_1.BadRequestException('applicationId is required');
        }
        const userEmail = req.user?.email || 'admin';
        return this.paymentsService.confirmPaymentManually(applicationId, userEmail);
    }
    async rejectPayment(applicationId, req) {
        if (!applicationId) {
            throw new common_1.BadRequestException('applicationId is required');
        }
        const userEmail = req.user?.email || 'admin';
        return this.paymentsService.rejectPaymentManually(applicationId, userEmail);
    }
    createOrder(applicationId) {
        if (!applicationId) {
            throw new common_1.BadRequestException('applicationId is required');
        }
        return this.paymentsService.createOrder(applicationId);
    }
    verifySignature(orderId, paymentId, signature) {
        if (!orderId || !paymentId || !signature) {
            throw new common_1.BadRequestException('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
        }
        return this.paymentsService.verifyPaymentSignature(orderId, paymentId, signature);
    }
    async handleWebhook(signature, payload) {
        if (signature) {
            const rawBody = JSON.stringify(payload);
            const isVerified = this.paymentsService.verifyWebhookSignature(signature, rawBody);
            if (!isVerified) {
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
        }
        return this.paymentsService.handleWebhook(payload);
    }
    verifyPayment(orderId) {
        return this.paymentsService.verifyPaymentDirectly(orderId);
    }
    simulate(orderId, status) {
        if (!orderId || !status) {
            throw new common_1.BadRequestException('orderId and status are required');
        }
        return this.paymentsService.simulatePaymentResult(orderId, status);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment configuration for QR code' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPaymentConfig", null);
__decorate([
    (0, common_1.Post)('whatsapp-sent/:applicationId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Log that user has clicked WhatsApp confirmation button (Public)' }),
    __param(0, (0, common_1.Param)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "logWhatsAppSent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Post)('seen/:applicationId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark application payment request as seen by admin (Admin/Staff only)' }),
    __param(0, (0, common_1.Param)('applicationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "markAsSeen", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Post)('confirm/:applicationId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm & verify payment manually (Admin/Staff only)' }),
    __param(0, (0, common_1.Param)('applicationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Post)('reject/:applicationId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reject payment manually (Admin/Staff only)' }),
    __param(0, (0, common_1.Param)('applicationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Post)('create-order'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Razorpay payment order (Public - Deprecated)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                applicationId: { type: 'string', example: 'EC-2026-12345' },
            },
            required: ['applicationId'],
        },
    }),
    __param(0, (0, common_1.Body)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify-signature'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Razorpay payment signature (Deprecated)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                razorpay_order_id: { type: 'string' },
                razorpay_payment_id: { type: 'string' },
                razorpay_signature: { type: 'string' },
            },
            required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'],
        },
    }),
    __param(0, (0, common_1.Body)('razorpay_order_id')),
    __param(1, (0, common_1.Body)('razorpay_payment_id')),
    __param(2, (0, common_1.Body)('razorpay_signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifySignature", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Razorpay Webhook Endpoint (Deprecated)' }),
    __param(0, (0, common_1.Headers)('x-razorpay-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('verify/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger direct API status pull (Deprecated)' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('simulate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Simulate/complete PG transaction locally for testing (Sandbox Dev tool)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                orderId: { type: 'string' },
                status: { type: 'string', enum: ['success', 'fail'] },
            },
            required: ['orderId', 'status'],
        },
    }),
    __param(0, (0, common_1.Body)('orderId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "simulate", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
let OrdersController = class OrdersController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    getPaymentsForOrder(orderId) {
        if (!orderId) {
            throw new common_1.BadRequestException('orderId is required');
        }
        return this.paymentsService.getPaymentsForOrder(orderId);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(':orderId/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Lookup payments for a specific Razorpay order' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getPaymentsForOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)('v1/orders'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], OrdersController);
//# sourceMappingURL=payments.controller.js.map