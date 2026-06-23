import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Prisma } from '@prisma/client';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { ConfigService } from '@nestjs/config';
export declare class ApplicationsService {
    private prisma;
    private emailService;
    private notificationGateway;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, notificationGateway: NotificationGateway, configService: ConfigService);
    create(createApplicationDto: CreateApplicationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        service: string;
        serviceName: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        details: Prisma.JsonValue;
        documents: Prisma.JsonValue;
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
            gatewayResponse: Prisma.JsonValue | null;
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
        details: Prisma.JsonValue;
        documents: Prisma.JsonValue;
        amountPaid: number;
        completionTimeline: string;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        statusComment: string | null;
        certificateNumber: string | null;
        paymentStatus: string;
    }>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto, changedByEmail: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        service: string;
        serviceName: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        details: Prisma.JsonValue;
        documents: Prisma.JsonValue;
        amountPaid: number;
        completionTimeline: string;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        statusComment: string | null;
        certificateNumber: string | null;
        paymentStatus: string;
    }>;
    findAllAdmin(filters: {
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<({
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            transactionId: string | null;
            orderId: string;
            amount: number;
            paymentMethod: string | null;
            gatewayResponse: Prisma.JsonValue | null;
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
        details: Prisma.JsonValue;
        documents: Prisma.JsonValue;
        amountPaid: number;
        completionTimeline: string;
        status: import(".prisma/client").$Enums.ApplicationStatus;
        statusComment: string | null;
        certificateNumber: string | null;
        paymentStatus: string;
    })[]>;
}
