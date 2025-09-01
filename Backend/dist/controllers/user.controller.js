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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../services/user.service");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async createUser(userData) {
        try {
            if (!userData.Username || !userData.Email || !userData.Password) {
                throw new common_1.HttpException('Tất cả các trường là bắt buộc', common_1.HttpStatus.BAD_REQUEST);
            }
            const emailExists = await this.userService.isEmailExists(userData.Email);
            if (emailExists) {
                throw new common_1.HttpException('Email đã tồn tại', common_1.HttpStatus.CONFLICT);
            }
            const usernameExists = await this.userService.isUsernameExists(userData.Username);
            if (usernameExists) {
                throw new common_1.HttpException('Tên người dùng đã tồn tại', common_1.HttpStatus.CONFLICT);
            }
            const newUser = await this.userService.createUser(userData);
            return {
                success: true,
                message: 'Tạo người dùng thành công',
                data: {
                    UserID: newUser.UserID,
                    Username: newUser.Username,
                    Email: newUser.Email,
                    DateCreated: newUser.DateCreated,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Lỗi server', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserById(id) {
        try {
            const userId = parseInt(id);
            if (isNaN(userId)) {
                throw new common_1.HttpException('ID không hợp lệ', common_1.HttpStatus.BAD_REQUEST);
            }
            const user = await this.userService.getUserById(userId);
            if (!user) {
                throw new common_1.HttpException('Không tìm thấy người dùng', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: {
                    UserID: user.UserID,
                    Username: user.Username,
                    Email: user.Email,
                    DateCreated: user.DateCreated,
                    DateModified: user.DateModified,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Lỗi server', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllUsers() {
        try {
            const users = await this.userService.getAllUsers();
            return {
                success: true,
                data: users.map(user => ({
                    UserID: user.UserID,
                    Username: user.Username,
                    Email: user.Email,
                    DateCreated: user.DateCreated,
                    DateModified: user.DateModified,
                })),
            };
        }
        catch (error) {
            throw new common_1.HttpException('Lỗi server', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUser(id, updateData) {
        try {
            const userId = parseInt(id);
            if (isNaN(userId)) {
                throw new common_1.HttpException('ID không hợp lệ', common_1.HttpStatus.BAD_REQUEST);
            }
            const existingUser = await this.userService.getUserById(userId);
            if (!existingUser) {
                throw new common_1.HttpException('Không tìm thấy người dùng', common_1.HttpStatus.NOT_FOUND);
            }
            if (updateData.Email && updateData.Email !== existingUser.Email) {
                const emailExists = await this.userService.isEmailExists(updateData.Email);
                if (emailExists) {
                    throw new common_1.HttpException('Email đã tồn tại', common_1.HttpStatus.CONFLICT);
                }
            }
            if (updateData.Username && updateData.Username !== existingUser.Username) {
                const usernameExists = await this.userService.isUsernameExists(updateData.Username);
                if (usernameExists) {
                    throw new common_1.HttpException('Tên người dùng đã tồn tại', common_1.HttpStatus.CONFLICT);
                }
            }
            const updatedUser = await this.userService.updateUser(userId, updateData);
            return {
                success: true,
                message: 'Cập nhật người dùng thành công',
                data: {
                    UserID: updatedUser.UserID,
                    Username: updatedUser.Username,
                    Email: updatedUser.Email,
                    DateModified: updatedUser.DateModified,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Lỗi server', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteUser(id) {
        try {
            const userId = parseInt(id);
            if (isNaN(userId)) {
                throw new common_1.HttpException('ID không hợp lệ', common_1.HttpStatus.BAD_REQUEST);
            }
            const existingUser = await this.userService.getUserById(userId);
            if (!existingUser) {
                throw new common_1.HttpException('Không tìm thấy người dùng', common_1.HttpStatus.NOT_FOUND);
            }
            await this.userService.deleteUser(userId);
            return {
                success: true,
                message: 'Xóa người dùng thành công',
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Lỗi server', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map