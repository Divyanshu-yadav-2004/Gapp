import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new application (Public)' })
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Track application by ID (Public)' })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update application status (Admin/Staff only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req
  ) {
    return this.applicationsService.updateStatus(id, updateStatusDto, req.user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all applications with filters (Admin/Staff only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.applicationsService.findAllAdmin({ search, status, startDate, endDate });
  }
}
