import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get main metrics for Admin Dashboard
   */
  async getDashboardStats() {
    const totalApps = await this.prisma.application.count();
    const pendingApps = await this.prisma.application.count({
      where: { status: ApplicationStatus.PENDING_VERIFICATION },
    });
    const processingApps = await this.prisma.application.count({
      where: { status: ApplicationStatus.PROCESSING },
    });
    const approvedApps = await this.prisma.application.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejectedApps = await this.prisma.application.count({
      where: { status: ApplicationStatus.REJECTED },
    });

    // Total Revenue (Only Paid applications)
    const paidApps = await this.prisma.application.aggregate({
      where: { paymentStatus: 'Paid' },
      _sum: { amountPaid: true },
    });
    const totalRevenue = paidApps._sum.amountPaid || 0;

    // Get 10 recent successful payments
    const recentPayments = await this.prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { application: true },
    });

    // Get 10 recent applications
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

  /**
   * Retrieve all payment history records
   */
  async getPayments(filters: { search?: string }) {
    const { search } = filters;
    const where: any = {};

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

  /**
   * Generates a CSV formatted string of applications data
   */
  async exportApplicationsToCsv(): Promise<string> {
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
}
