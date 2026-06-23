import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationGateway: NotificationGateway,
    private configService: ConfigService
  ) {}

  async create(createApplicationDto: CreateApplicationDto) {
    const { customerEmail, customerName, customerPhone, service, serviceName, amountPaid, completionTimeline, details, documents } = createApplicationDto;

    // Idempotency: Prevent identical applications submitted in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existing = await this.prisma.application.findFirst({
      where: {
        customerEmail,
        service,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (existing) {
      throw new BadRequestException('A duplicate application was recently submitted. Please wait a moment.');
    }

    // Generate custom EC ID: EC-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const customId = `EC-${year}-${randomDigits}`;

    // Create application
    const application = await this.prisma.application.create({
      data: {
        id: customId,
        service,
        serviceName,
        customerName,
        customerPhone,
        customerEmail,
        details: details as Prisma.InputJsonValue,
        documents: documents as Prisma.InputJsonValue,
        amountPaid,
        completionTimeline,
        paymentStatus: amountPaid === 0 ? 'Inquiry' : 'Pending',
        status: ApplicationStatus.PENDING_VERIFICATION,
      },
    });

    this.logger.log(`Created application in DB with ID: ${customId}`);

    // Create a pending Payment record if fee is > 0
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

    // If it's an inquiry (free service), immediately send welcome email + admin notifications
    if (amountPaid === 0) {
      // Send confirmation email to client
      await this.emailService.sendWelcomeAndSubmissionEmail(
        customerEmail,
        customerName,
        customId,
        serviceName,
        amountPaid,
        completionTimeline
      );

      // Send alert to admin
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.emailService.sendAdminNotificationOfNewSubmission(
          adminEmail,
          customerName,
          customId,
          serviceName,
          amountPaid
        );
      }

      // Trigger WebSockets for live admin dashboard reload
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

  async findOne(id: string) {
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
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, changedByEmail: string) {
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

    // Save to status logs/history
    await this.prisma.statusHistory.create({
      data: {
        applicationId: id,
        oldStatus,
        newStatus: status,
        changedBy: changedByEmail,
        comment: statusComment || '',
      },
    });

    // Notify User via Email
    await this.emailService.sendStatusChangeEmail(
      application.customerEmail,
      application.customerName,
      id,
      application.serviceName,
      oldStatus,
      status,
      statusComment || '',
      certificateNumber || ''
    );

    // Notify User via Socket.IO room (if they are on the tracking page)
    this.notificationGateway.sendStatusUpdateToUser(id, {
      id,
      status,
      statusComment: statusComment || '',
      certificateNumber: certificateNumber || '',
    });

    // Emit live update for admin dashboard count refreshes
    this.notificationGateway.sendToAdmins('status:updated', {
      id,
      status,
    });

    return updatedApp;
  }

  async findAllAdmin(filters: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { search, status, startDate, endDate } = filters;
    const where: Prisma.ApplicationWhereInput = {};

    if (status && status !== 'all') {
      where.status = status as ApplicationStatus;
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
}
