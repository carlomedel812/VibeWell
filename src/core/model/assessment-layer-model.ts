import { AssessmentLayerType } from "../enum/assessment-layer-type";
import { IBigFivePersonalityTraitConfigModel } from "./big-five-personality-trait-config-model";
import { IFirestoreDocumentModel } from "./firestore-document-model";
import { ITraitListConfigModel } from "./trait-list-config-model";

export interface IAssessmentLayerModel extends IFirestoreDocumentModel {
    title?: string;
    description?: string;
    assessmentId: string;
    imageUrl?: string;
    layer: number;
    type: AssessmentLayerType;
    config: IBigFivePersonalityTraitConfigModel | ITraitListConfigModel;
    createdAt: Date;
    updatedAt: Date;
}