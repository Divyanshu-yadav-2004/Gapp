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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboardStats() {
        const totalApps = await this.prisma.application.count();
        const pendingApps = await this.prisma.application.count({
            where: { status: client_1.ApplicationStatus.PENDING_VERIFICATION },
        });
        const processingApps = await this.prisma.application.count({
            where: { status: client_1.ApplicationStatus.PROCESSING },
        });
        const approvedApps = await this.prisma.application.count({
            where: { status: client_1.ApplicationStatus.APPROVED },
        });
        const rejectedApps = await this.prisma.application.count({
            where: { status: client_1.ApplicationStatus.REJECTED },
        });
        const paidApps = await this.prisma.application.aggregate({
            where: { paymentStatus: 'Paid' },
            _sum: { amountPaid: true },
        });
        const totalRevenue = paidApps._sum.amountPaid || 0;
        const recentPayments = await this.prisma.payment.findMany({
            where: { status: 'SUCCESS' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { application: true },
        });
        const recentApplications = await this.prisma.application.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        return {
            stats: {
                total: totalApps,
                pending: pendingApps,
                processing: processingApps,
                approved: approvedApps,
                rejected: rejectedApps,
                revenue: totalRevenue,
            },
            recentPayments: recentPayments.map((p) => ({
                id: p.id,
                transactionId: p.transactionId,
                customerName: p.application.customerName,
                serviceName: p.application.serviceName,
                amount: p.amount,
                createdAt: p.createdAt,
                status: p.status,
            })),
            recentApplications,
        };
    }
    async getPayments(filters) {
        const { search } = filters;
        const where = {};
        if (search) {
            where.OR = [
                { transactionId: { contains: search, mode: 'insensitive' } },
                { orderId: { contains: search, mode: 'insensitive' } },
                { application: { customerName: { contains: search, mode: 'insensitive' } } },
                { application: { customerPhone: { contains: search } } },
            ];
        }
        return this.prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { application: true },
        });
    }
    async exportApplicationsToCsv() {
        const apps = await this.prisma.application.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const headers = [
            'Application ID',
            'Service',
            'Customer Name',
            'Customer Phone',
            'Customer Email',
            'Amount Paid',
            'Payment Status',
            'Application Status',
            'Certificate Number',
            'Comments',
            'Submitted Date',
        ];
        const rows = apps.map((app) => [
            app.id,
            app.serviceName,
            `"${app.customerName.replace(/"/g, '""')}"`,
            app.customerPhone,
            app.customerEmail,
            app.amountPaid,
            app.paymentStatus,
            app.status,
            app.certificateNumber || '',
            `"${(app.statusComment || '').replace(/"/g, '""')}"`,
            app.createdAt.toISOString(),
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map