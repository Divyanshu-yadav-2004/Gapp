import { ApplicationStatus } from '@prisma/client';
export declare class UpdateStatusDto {
    status: ApplicationStatus;
    statusComment?: string;
    certificateNumber?: string;
}
