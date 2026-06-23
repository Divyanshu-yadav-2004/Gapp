import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private localUploadDir = path.join(process.cwd(), 'uploads');

  constructor(private configService: ConfigService) {
    // Ensure upload directory exists if using local storage
    if (this.configService.get<string>('UPLOAD_PROVIDER') === 'local') {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
        this.logger.log(`Created local upload directory: ${this.localUploadDir}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const provider = this.configService.get<string>('UPLOAD_PROVIDER', 'local');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.');
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 5MB limit.');
    }

    const fileName = `${uuidv4()}${fileExtension}`;

    if (provider === 's3') {
      // Setup AWS S3 SDK dynamically to prevent startup failure if AWS credentials are not configured
      try {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region: this.configService.get<string>('AWS_S3_REGION'),
          credentials: {
            accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          },
        });

        const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
        const key = `${folder}/${fileName}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        this.logger.log(`Uploaded file to S3: ${key}`);
        return `https://${bucketName}.s3.${this.configService.get<string>('AWS_S3_REGION')}.amazonaws.com/${key}`;
      } catch (err) {
        this.logger.error(`S3 upload failed, falling back to local storage: ${err.message}`);
      }
    }

    // Fallback or explicit Local Storage
    const destinationFolder = path.join(this.localUploadDir, folder);
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    const filePath = path.join(destinationFolder, fileName);
    fs.writeFileSync(filePath, file.buffer);

    this.logger.log(`Saved file locally: ${filePath}`);
    // Return relative API URL. The server main.ts will serve 'uploads' as static assets
    return `/uploads/${folder}/${fileName}`;
  }
}
