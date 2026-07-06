import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService);
    private sendEmail;
    sendWelcomeAndSubmissionEmail(email: string, customerName: string, applicationId: string, serviceName: string, amountPaid: number, timeline: string): Promise<void>;
    sendAdminNotificationOfNewSubmission(adminEmail: string, customerName: string, applicationId: string, serviceName: string, amountPaid: number): Promise<void>;
    sendAdminPaymentSuccessNotification(adminEmail: string, customerName: string, serviceName: string, amountPaid: number, transactionId: string, status: string): Promise<void>;
    sendStatusChangeEmail(email: string, customerName: string, applicationId: string, serviceName: string, oldStatus: string, newStatus: string, comment: string, certificateNumber: string): Promise<void>;
    sendUserPaymentReceiptConfirmedEmail(email: string, customerName: string, amount: number, applicationId: string): Promise<void>;
    sendAdminPaymentReceiptNotificationEmail(adminEmail: string, customerName: string, customerEmail: string, amount: number, plan: string, paymentTime: Date, whatsappStatus: string): Promise<void>;
}
