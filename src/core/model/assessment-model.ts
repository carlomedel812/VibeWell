export interface IAssessmentModel {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    thumbnailUrl?: string;
    enabled: boolean;
}