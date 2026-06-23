import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Get, Param, BadRequestException, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create a new Cashfree PG payment order session (Public)' })
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

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cashfree Webhook Endpoint (Callback verification)' })
  async handleWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Body() payload: any
  ) {
    // If webhook signature is present, verify it (strict security rule)
    if (signature && timestamp) {
      const rawBody = JSON.stringify(payload);
      const isVerified = this.paymentsService.verifyWebhookSignature(signature, timestamp, rawBody);
      if (!isVerified) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }
    return this.paymentsService.handleWebhook(payload);
  }

  @Get('verify/:orderId')
  @ApiOperation({ summary: 'Manually trigger direct API status pull (Pull PG check)' })
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
