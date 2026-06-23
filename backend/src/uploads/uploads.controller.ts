import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a single document (PDF or Image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'applications'
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const url = await this.uploadsService.uploadFile(file, folder);
    return { url };
  }
}
