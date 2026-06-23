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
        payment_session_id: any;
        order_id: string;
        amount: number;
        cf_order_id: any;
        is_simulated?: undefined;
    } | {
        is_simulated: boolean;
        order_id: string;
        amount: number;
        payment_session_id: string;
        cf_order_id?: undefined;
    }>;
    verifyWebhookSignature(signature: string, timestamp: string, rawBody: string): boolean;
    handleWebhook(payload: any): Promise<{
        status: string;
    }>;
    verifyPaymentDirectly(orderId: string): Promise<{
        status: string;
        transactionId: any;
    } | {
        status: "PENDING" | "FAILED";
        transactionId?: undefined;
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
