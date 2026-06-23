"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApplicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const email_service_1 = require("../notifications/email.service");
const notification_gateway_1 = require("../notifications/notification.gateway");
const config_1 = require("@nestjs/config");
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    constructor(prisma, emailService, notificationGateway, configService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.notificationGateway = notificationGateway;
        this.configService = configService;
        this.logger = new common_1.Logger(ApplicationsService_1.name);
    }
    async create(createApplicationDto) {
        const { customerEmail, customerName, customerPhone, service, serviceName, amountPaid, completionTimeline, details, documents } = createApplicationDto;
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const existing = await this.prisma.application.findFirst({
            where: {
                customerEmail,
                service,
                createdAt: { gte: oneMinuteAgo },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('A duplicate application was recently submitted. Please wait a moment.');
        }
        const year = new Date().getFullYear();
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        const customId = `EC-${year}-${randomDigits}`;
        const application = await this.prisma.application.create({
            data: {
                id: customId,
                service,
                serviceName,
                customerName,
                customerPhone,
                customerEmail,
                details: details,
                documents: documents,
                amountPaid,
                completionTimeline,
                paymentStatus: amountPaid === 0 ? 'Inquiry' : 'Pending',
                status: client_1.ApplicationStatus.PENDING_VERIFICATION,
            },
        });
        this.logger.log(`Created application in DB with ID: ${customId}`);
        if (amountPaid > 0) {
            const orderId = `ORDER-${customId}-${Date.now()}`;
            await this.prisma.payment.create({
                data: {
                    applicationId: customId,
                    orderId,
                    amount: amountPaid,
                    status: 'PENDING',
                },
            });
        }
        if (amountPaid === 0) {
            await this.emailService.sendWelcomeAndSubmissionEmail(customerEmail, customerName, customId, serviceName, amountPaid, completionTimeline);
            const adminEmail = this.configService.get('ADMIN_EMAIL');
            if (adminEmail) {
                await this.emailService.sendAdminNotificationOfNewSubmission(adminEmail, customerName, customId, serviceName, amountPaid);
            }
            this.notificationGateway.sendToAdmins('application:new', {
                id: customId,
                customerName,
                serviceName,
                amountPaid,
                createdAt: application.createdAt,
            });
        }
        return application;
    }
    async findOne(id) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                payments: true,
                statusHistories: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        return application;
    }
    async updateStatus(id, updateStatusDto, changedByEmail) {
        const application = await this.findOne(id);
        const oldStatus = application.status;
        const { status, statusComment, certificateNumber } = updateStatusDto;
        const updatedApp = await this.prisma.application.update({
            where: { id },
            data: {
                status,
                statusComment: statusComment || '',
                certificateNumber: certificateNumber || '',
            },
        });
        await this.prisma.statusHistory.create({
            data: {
                applicationId: id,
                oldStatus,
                newStatus: status,
                changedBy: changedByEmail,
                comment: statusComment || '',
            },
        });
        await this.emailService.sendStatusChangeEmail(application.customerEmail, application.customerName, id, application.serviceName, oldStatus, status, statusComment || '', certificateNumber || '');
        this.notificationGateway.sendStatusUpdateToUser(id, {
            id,
            status,
            statusComment: statusComment || '',
            certificateNumber: certificateNumber || '',
        });
        this.notificationGateway.sendToAdmins('status:updated', {
            id,
            status,
        });
        return updatedApp;
    }
    async findAllAdmin(filters) {
        const { search, status, startDate, endDate } = filters;
        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        return this.prisma.application.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { payments: true },
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = ApplicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        notification_gateway_1.NotificationGateway,
        config_1.ConfigService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map