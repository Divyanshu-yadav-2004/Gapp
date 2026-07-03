import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';
export declare class PaymentsService {
    private prisma;
    private configService;
    private emailService;
    private notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, emailService: EmailService, notificationGateway: NotificationGateway);
    createOrder(applicationId: string): Promise<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    }>;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<any>;
    getPaymentsForOrder(orderId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        paymentMethod: string;
        paymentId: string;
        amount: number;
        timestamp: Date;
    }>;
    verifyWebhookSignature(signature: string, rawBody: string): boolean;
    handleWebhook(payload: any): Promise<{
        status: string;
    }>;
    verifyPaymentDirectly(orderId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        transactionId: string;
    }>;
    markPaymentSuccessful(orderId: string, transactionId: string, paymentMethod: string, gatewayResponse: any): Promise<{
        status: string;
    }>;
    markPaymentFailed(orderId: string, gatewayResponse: any): Promise<{
        status: string;
    }>;
    simulatePaymentResult(orderId: string, status: 'success' | 'fail'): Promise<{
        status: string;
    }>;
}
