import { IFirestoreDocumentModel } from './firestore-document-model';
import { BigFivePersonalityTraitType } from '../enum/big-five-personality-trait-type';

export interface IBigFivePersonalityQuestionModel extends IFirestoreDocumentModel {
    layerId: string;
    trait: BigFivePersonalityTraitType;
    statement: string;
    scoringTypePositive: boolean
}