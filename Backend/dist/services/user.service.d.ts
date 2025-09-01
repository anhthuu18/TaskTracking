export declare class UserService {
    private prisma;
    constructor();
    createUser(userData: {
        Username: string;
        Email: string;
        Password: string;
    }): Promise<any>;
    getUserById(userId: number): Promise<any>;
    getUserByEmail(email: string): Promise<any>;
    getAllUsers(): Promise<any>;
    updateUser(userId: number, updateData: {
        Username?: string;
        Email?: string;
        Password?: string;
    }): Promise<any>;
    deleteUser(userId: number): Promise<any>;
    hardDeleteUser(userId: number): Promise<any>;
    isEmailExists(email: string): Promise<boolean>;
    isUsernameExists(username: string): Promise<boolean>;
}
