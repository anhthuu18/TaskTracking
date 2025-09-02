export interface UserModel {
    id: number;
    username: string;
    email: string;
    password: string;
    dateDeleted?: Date;
    dateModified: Date;
    dateCreated: Date;
}
export interface UserResponse {
    id: number;
    username: string;
    email: string;
    dateCreated: Date;
    dateModified: Date;
    dateDeleted?: Date;
}
