import { UsersService } from '../services/users.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { UpdateUserDTO } from '../dtos/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: import("../model/user.model").UserResponse[];
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: import("../model/user.model").UserResponse;
    }>;
    create(createUserDto: CreateUserDTO): Promise<{
        success: boolean;
        message: string;
        data: import("../model/user.model").UserResponse;
    }>;
    update(id: string, updateUserDto: UpdateUserDTO): Promise<{
        success: boolean;
        message: string;
        data: import("../model/user.model").UserResponse;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
