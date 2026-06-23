import { AdminService } from './admin.service';
import { Response } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboardStats(): Promise<{
        stats: {
            total: number;
            pending: number;
            processing: number;
            approved: number;
            rejected: number;
            revenue: number;
        };
        recentPayments: {
            id: string;
            transactionId: string;
            customerName: string;
            serviceName: string;
            amount: number;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
        }[];
        recentApplications: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            service: string;
            serviceName: string;
            customerName: string;
            customerPhone: string;
            customerEmail: string;
            details: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            amountPaid: number;
            completionTimeline: string;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            statusComment: string | null;
            certificateNumber: string | null;
            paymentStatus: string;
        }[];
    }>;
    getPayments(search?: string): Promise<({
        application: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            service: string;
            serviceName: string;
            customerName: string;
            customerPhone: string;
            customerEmail: string;
            details: import("@prisma/client/runtime/library").JsonValue;
            documents: import("@prisma/client/runtime/library").JsonValue;
            amountPaid: number;
            completionTimeline: string;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            statusComment: string | null;
            certificateNumber: string | null;
            paymentStatus: string;
        };
    } & {
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
    })[]>;
    exportCsv(res: Response): Promise<Response<any, Record<string, any>>>;
}
