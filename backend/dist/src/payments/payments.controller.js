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
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
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
    (0, common_1.Post)('create-order'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Razorpay payment order (Public)' }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Verify Razorpay payment signature' }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Razorpay Webhook Endpoint (Callback verification)' }),
    __param(0, (0, common_1.Headers)('x-razorpay-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('verify/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger direct API status pull (Pull PG check)' }),
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