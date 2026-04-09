import { UserRole } from "../enum/user-role";

export interface IUserModel {
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    role: UserRole;
}