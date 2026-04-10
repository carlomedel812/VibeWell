import { IFirestoreDocumentModel } from './firestore-document-model';
import { IBigFivePersonalityTraitType } from '../enum/big-five-personality-trait-type';

export interface IBigFivePersonalityQuestionModel extends IFirestoreDocumentModel {
    layerId: string;
    trait: IBigFivePersonalityTraitType;
    statement: string;
    scoringTypePositive: boolean
}