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
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(UploadsService_1.name);
        this.localUploadDir = path.join(process.cwd(), 'uploads');
        if (this.configService.get('UPLOAD_PROVIDER') === 'local') {
            if (!fs.existsSync(this.localUploadDir)) {
                fs.mkdirSync(this.localUploadDir, { recursive: true });
                this.logger.log(`Created local upload directory: ${this.localUploadDir}`);
            }
        }
    }
    async uploadFile(file, folder = 'general') {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const provider = this.configService.get('UPLOAD_PROVIDER', 'local');
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (!allowedExtensions.includes(fileExtension)) {
            throw new common_1.BadRequestException('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size exceeds the 5MB limit.');
        }
        const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        if (provider === 's3') {
            try {
                const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: this.configService.get('AWS_S3_REGION'),
                    credentials: {
                        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
                    },
                });
                const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
                const key = `${folder}/${fileName}`;
                await s3Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                this.logger.log(`Uploaded file to S3: ${key}`);
                return `https://${bucketName}.s3.${this.configService.get('AWS_S3_REGION')}.amazonaws.com/${key}`;
            }
            catch (err) {
                this.logger.error(`S3 upload failed, falling back to local storage: ${err.message}`);
            }
        }
        const destinationFolder = path.join(this.localUploadDir, folder);
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });
        }
        const filePath = path.join(destinationFolder, fileName);
        fs.writeFileSync(filePath, file.buffer);
        this.logger.log(`Saved file locally: ${filePath}`);
        return `/uploads/${folder}/${fileName}`;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map