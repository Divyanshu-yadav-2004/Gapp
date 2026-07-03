import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(applicationId: string): Promise<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    }>;
    verifySignature(orderId: string, paymentId: string, signature: string): Promise<any>;
    handleWebhook(signature: string, payload: any): Promise<{
        status: string;
    }>;
    verifyPayment(orderId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        transactionId: string;
    }>;
    simulate(orderId: string, status: 'success' | 'fail'): Promise<{
        status: string;
    }>;
}
export declare class OrdersController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getPaymentsForOrder(orderId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        paymentMethod: string;
        paymentId: string;
        amount: number;
        timestamp: Date;
    }>;
}
