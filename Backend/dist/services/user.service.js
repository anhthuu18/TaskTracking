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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../generated/prisma");
let UserService = class UserService {
    constructor() {
        this.prisma = new prisma_1.PrismaClient();
    }
    async createUser(userData) {
        return this.prisma.user.create({
            data: {
                Username: userData.Username,
                Email: userData.Email,
                Password: userData.Password,
                DateCreated: new Date(),
            },
        });
    }
    async getUserById(userId) {
        return this.prisma.user.findFirst({
            where: {
                UserID: userId,
                DateDeleted: null,
            },
        });
    }
    async getUserByEmail(email) {
        return this.prisma.user.findFirst({
            where: {
                Email: email,
                DateDeleted: null,
            },
        });
    }
    async getAllUsers() {
        return this.prisma.user.findMany({
            where: {
                DateDeleted: null,
            },
        });
    }
    async updateUser(userId, updateData) {
        return this.prisma.user.update({
            where: { UserID: userId },
            data: {
                ...updateData,
                DateModified: new Date(),
            },
        });
    }
    async deleteUser(userId) {
        return this.prisma.user.update({
            where: { UserID: userId },
            data: {
                DateDeleted: new Date(),
            },
        });
    }
    async hardDeleteUser(userId) {
        return this.prisma.user.delete({
            where: { UserID: userId },
        });
    }
    async isEmailExists(email) {
        const user = await this.prisma.user.findFirst({
            where: {
                Email: email,
                DateDeleted: null,
            },
        });
        return !!user;
    }
    async isUsernameExists(username) {
        const user = await this.prisma.user.findFirst({
            where: {
                Username: username,
                DateDeleted: null,
            },
        });
        return !!user;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UserService);
//# sourceMappingURL=user.service.js.map