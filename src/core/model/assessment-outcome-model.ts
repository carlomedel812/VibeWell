import { AssessmentLayerType } from "../enum/assessment-layer-type";
import { IFirestoreDocumentModel } from "./firestore-document-model";

export interface IAssessmentOutcomeModel extends IFirestoreDocumentModel {
    assessmentAnswerId: string;
    generationComplete: boolean;
    layerOutcomes: ILayerOutcomeModel[];
}

export interface ILayerOutcomeModel {
    layerId: string;
    layerOrder: number;
    layerType: AssessmentLayerType;
    outcome: ITraitListOutcomeModel | IBigFivePersonalityTraitOutcomeModel;
}

export interface ITraitListOutcomeModel {
    traitListOutcomeId: string;
}

export interface IBigFivePersonalityTraitOutcomeModel {
    opennesPercentile: number;
    conscientiousnessPercentile: number;
    extraversionPercentile: number;
    neuroticismPercentile: number;
    agreeablenessPercentile: number;
    bigFiveTraitOutcomeId: string;
}