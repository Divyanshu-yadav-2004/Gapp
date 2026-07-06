import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Get, Param, BadRequestException, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get payment configuration for QR code' })
  getPaymentConfig() {
    return this.paymentsService.getPaymentConfig();
  }

  @Post('whatsapp-sent/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log that user has clicked WhatsApp confirmation button (Public)' })
  async logWhatsAppSent(@Param('applicationId') applicationId: string) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }
    return this.paymentsService.logWhatsAppSent(applicationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('seen/:applicationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark application payment request as seen by admin (Admin/Staff only)' })
  async markAsSeen(@Param('applicationId') applicationId: string, @Req() req) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }
    const userEmail = req.user?.email || 'admin';
    return this.paymentsService.markAsSeen(applicationId, userEmail);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('confirm/:applicationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm & verify payment manually (Admin/Staff only)' })
  async confirmPayment(@Param('applicationId') applicationId: string, @Req() req) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }
    const userEmail = req.user?.email || 'admin';
    return this.paymentsService.confirmPaymentManually(applicationId, userEmail);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('reject/:applicationId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject payment manually (Admin/Staff only)' })
  async rejectPayment(@Param('applicationId') applicationId: string, @Req() req) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }
    const userEmail = req.user?.email || 'admin';
    return this.paymentsService.rejectPaymentManually(applicationId, userEmail);
  }

  @Post('create-order')
  @ApiOperation({ summary: 'Create a new Razorpay payment order (Public - Deprecated)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', example: 'EC-2026-12345' },
      },
      required: ['applicationId'],
    },
  })
  createOrder(@Body('applicationId') applicationId: string) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }
    return this.paymentsService.createOrder(applicationId);
  }

  @Post('verify-signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment signature (Deprecated)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        razorpay_order_id: { type: 'string' },
        razorpay_payment_id: { type: 'string' },
        razorpay_signature: { type: 'string' },
      },
      required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'],
    },
  })
  verifySignature(
    @Body('razorpay_order_id') orderId: string,
    @Body('razorpay_payment_id') paymentId: string,
    @Body('razorpay_signature') signature: string
  ) {
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
    }
    return this.paymentsService.verifyPaymentSignature(orderId, paymentId, signature);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay Webhook Endpoint (Deprecated)' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any
  ) {
    if (signature) {
      const rawBody = JSON.stringify(payload);
      const isVerified = this.paymentsService.verifyWebhookSignature(signature, rawBody);
      if (!isVerified) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }
    return this.paymentsService.handleWebhook(payload);
  }

  @Get('verify/:orderId')
  @ApiOperation({ summary: 'Manually trigger direct API status pull (Deprecated)' })
  verifyPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.verifyPaymentDirectly(orderId);
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate/complete PG transaction locally for testing (Sandbox Dev tool)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        status: { type: 'string', enum: ['success', 'fail'] },
      },
      required: ['orderId', 'status'],
    },
  })
  simulate(
    @Body('orderId') orderId: string,
    @Body('status') status: 'success' | 'fail'
  ) {
    if (!orderId || !status) {
      throw new BadRequestException('orderId and status are required');
    }
    return this.paymentsService.simulatePaymentResult(orderId, status);
  }
}

@ApiTags('Orders')
@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':orderId/payments')
  @ApiOperation({ summary: 'Lookup payments for a specific Razorpay order' })
  getPaymentsForOrder(@Param('orderId') orderId: string) {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
    return this.paymentsService.getPaymentsForOrder(orderId);
  }
}

