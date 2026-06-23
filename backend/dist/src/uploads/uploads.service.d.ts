import { ConfigService } from '@nestjs/config';
export declare class UploadsService {
    private configService;
    private readonly logger;
    private localUploadDir;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
}
