import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getPaymentConfig(): {
        upiId: string;
        payeeName: string;
        whatsappNumber: string;
    };
    logWhatsAppSent(applicationId: string): Promise<{
        status: string;
        payment?: undefined;
    } | {
        status: string;
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            transactionId: string | null;
            orderId: string;
            amount: number;
            paymentMethod: string | null;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
            applicationId: string;
        };
    }>;
    markAsSeen(applicationId: string, req: any): Promise<{
        status: string;
    }>;
    confirmPayment(applicationId: string, req: any): Promise<{
        status: string;
    }>;
    rejectPayment(applicationId: string, req: any): Promise<{
        status: string;
    }>;
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
