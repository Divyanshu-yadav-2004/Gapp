import { IsString, IsNotEmpty, IsEmail, IsObject, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'pan' })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({ example: 'PAN Card Registration' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ example: 'Amit Kumar Mishra' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'amit.mishra@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({ example: { applicationType: 'New PAN Card', dob: '1995-05-15' } })
  @IsObject()
  @IsNotEmpty()
  details: any;

  @ApiProperty({ example: { aadhaarDoc: 'http://...', photoDoc: 'http://...' } })
  @IsObject()
  @IsNotEmpty()
  documents: any;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @IsNotEmpty()
  amountPaid: number;

  @ApiProperty({ example: '3 to 5 working days' })
  @IsString()
  @IsNotEmpty()
  completionTimeline: string;
}
