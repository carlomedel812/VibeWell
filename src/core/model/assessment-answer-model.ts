import { AssessmentLayerType } from "../enum/assessment-layer-type";
import { IFirestoreDocumentModel } from "./firestore-document-model";
import { ITraitListAdjectiveModel } from "./trait-list-adjective-model";

export interface IAssessmentAnswerModel extends IFirestoreDocumentModel {
    userId: string;
    assessmentId: string;
    completed: boolean;
    completedAt?: Date;
    layerAnswers: IAssessmentLayerAnswerModel[];
}

export interface IAssessmentLayerAnswerModel {
    layerId: string;
    type: AssessmentLayerType;
    completed: boolean;
    completedAt?: Date;
    answer: IAssessmentLayerAnswerTraitListModel | IAssessmentLayerAnswerBigFivePersonalityModel;
}


export interface IAssessmentLayerAnswerTraitListModel {
    selectedTraits: ITraitListAdjectiveModel[];
}

export interface IAssessmentLayerAnswerBigFivePersonalityModel {
    selectedOption: IAssessmentLayerAnswerBigFivePersonalityOption[];
}

export interface IAssessmentLayerAnswerBigFivePersonalityOption {
    questionId: string;
    score: number;
}