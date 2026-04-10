import { IFirestoreDocumentModel } from "./firestore-document-model";
import { UserRole } from "../enum/user-role";

export interface IUserModel extends IFirestoreDocumentModel {
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    role: UserRole;
}