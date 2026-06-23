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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let ApplicationsController = class ApplicationsController {
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    create(createApplicationDto) {
        return this.applicationsService.create(createApplicationDto);
    }
    findOne(id) {
        return this.applicationsService.findOne(id);
    }
    updateStatus(id, updateStatusDto, req) {
        return this.applicationsService.updateStatus(id, updateStatusDto, req.user.email);
    }
    findAll(search, status, startDate, endDate) {
        return this.applicationsService.findAllAdmin({ search, status, startDate, endDate });
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new application (Public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Track application by ID (Public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update application status (Admin/Staff only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.STAFF),
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all applications with filters (Admin/Staff only)' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'YYYY-MM-DD' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAll", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('Applications'),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map