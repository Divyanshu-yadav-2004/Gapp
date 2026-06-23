import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            role: any;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
}
