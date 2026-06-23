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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(email, pass) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async refresh(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const savedToken = await this.prisma.refreshToken.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!savedToken || savedToken.expiresAt < new Date()) {
                if (savedToken) {
                    await this.prisma.refreshToken.delete({ where: { token } });
                }
                throw new common_1.UnauthorizedException('Refresh token expired or invalid');
            }
            const newPayload = { email: savedToken.user.email, sub: savedToken.user.id, role: savedToken.user.role };
            const accessToken = this.jwtService.sign(newPayload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
            });
            return {
                access_token: accessToken,
            };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(token) {
        try {
            await this.prisma.refreshToken.delete({ where: { token } });
        }
        catch (e) {
        }
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map