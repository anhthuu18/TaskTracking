import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { UpdateUserDTO } from '../dtos/update-user.dto';
import { UserResponse } from '../model/user.model';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<UserResponse[]>;
    findOne(id: number): Promise<UserResponse>;
    create(createUserDto: CreateUserDTO): Promise<UserResponse>;
    update(id: number, updateUserDto: UpdateUserDTO): Promise<UserResponse>;
    remove(id: number): Promise<void>;
}
