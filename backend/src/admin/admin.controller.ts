import { Controller, Get, UseGuards, Query, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get Dashboard stats and activity lists (Admin only)' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('payments')
  @ApiOperation({ summary: 'List all payments transaction log (Admin only)' })
  @ApiQuery({ name: 'search', required: false })
  getPayments(@Query('search') search?: string) {
    return this.adminService.getPayments({ search });
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export application records to CSV file (Admin only)' })
  async exportCsv(@Res() res: Response) {
    const csvContent = await this.adminService.exportApplicationsToCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=easycafe-applications.csv');
    return res.status(200).send(csvContent);
  }
}
