import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserData } from '../dtos/create-user.dto';
import { UpdateUserDTO } from '../dtos/update-user.dto';
import { UserResponse } from '../model/user.model';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<UserResponse[]>;
    findOne(id: number): Promise<UserResponse>;
    create(createUserDto: CreateUserData): Promise<UserResponse>;
    update(id: number, updateUserDto: UpdateUserDTO): Promise<UserResponse>;
    remove(id: number): Promise<void>;
    findByUsername(username: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
}
