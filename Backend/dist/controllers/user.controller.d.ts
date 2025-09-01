import { UserService } from '../services/user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    createUser(userData: {
        Username: string;
        Email: string;
        Password: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            UserID: any;
            Username: any;
            Email: any;
            DateCreated: any;
        };
    }>;
    getUserById(id: string): Promise<{
        success: boolean;
        data: {
            UserID: any;
            Username: any;
            Email: any;
            DateCreated: any;
            DateModified: any;
        };
    }>;
    getAllUsers(): Promise<{
        success: boolean;
        data: any;
    }>;
    updateUser(id: string, updateData: {
        Username?: string;
        Email?: string;
        Password?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            UserID: any;
            Username: any;
            Email: any;
            DateModified: any;
        };
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
