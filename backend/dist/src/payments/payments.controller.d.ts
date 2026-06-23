import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
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
    handleWebhook(signature: string, timestamp: string, payload: any): Promise<{
        status: string;
    }>;
    verifyPayment(orderId: string): Promise<{
        status: string;
        transactionId: any;
    } | {
        status: "PENDING" | "FAILED";
        transactionId?: undefined;
    }>;
    simulate(orderId: string, status: 'success' | 'fail'): Promise<{
        status: string;
    }>;
}
