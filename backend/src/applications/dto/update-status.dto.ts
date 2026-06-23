import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.PROCESSING })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({ example: 'Documents are verified, processing with government portal.', required: false })
  @IsString()
  @IsOptional()
  statusComment?: string;

  @ApiProperty({ example: 'PAN-9812-3210', required: false })
  @IsString()
  @IsOptional()
  certificateNumber?: string;
}
