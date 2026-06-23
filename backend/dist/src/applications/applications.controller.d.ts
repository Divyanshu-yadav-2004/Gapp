import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(createApplicationDto: CreateApplicationDto): Promise<{
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
    }>;
    findOne(id: string): Promise<{
        payments: {
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
        }[];
        statusHistories: {
            id: string;
            createdAt: Date;
            applicationId: string;
            oldStatus: import(".prisma/client").$Enums.ApplicationStatus;
            newStatus: import(".prisma/client").$Enums.ApplicationStatus;
            changedBy: string;
            comment: string | null;
        }[];
    } & {
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
    }>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto, req: any): Promise<{
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
    }>;
    findAll(search?: string, status?: string, startDate?: string, endDate?: string): Promise<({
        payments: {
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
        }[];
    } & {
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
    })[]>;
}
