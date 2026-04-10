import { IFirestoreDocumentModel } from "./firestore-document-model";

export interface IAssessmentModel extends IFirestoreDocumentModel {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    thumbnailUrl?: string;
    enabled: boolean;
}