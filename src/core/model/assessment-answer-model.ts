import { AssessmentLayerType } from "../enum/assessment-layer-type";
import { BigFivePersonalityTraitType } from "../enum/big-five-personality-trait-type";
import { BigFiveTraitScoreType } from "../enum/big-five-trait-score-type";
import { IFirestoreDocumentModel } from "./firestore-document-model";
import { ITraitListAdjectiveModel } from "./trait-list-adjective-model";

export interface IAssessmentAnswerModel extends IFirestoreDocumentModel {
    userId: string;
    assessmentId: string;
    completed: boolean;
    completedAt?: Date;
    createdAt?: number;
    updatedAt?: number;
    layerAnswers: IAssessmentLayerAnswerModel[];
}

export interface IAssessmentLayerAnswerModel {
    layerId: string;
    layer: number;
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
    /***
     * The value stored in here should be computed already. For Direct Questions, store it directly. 
     * For Reverse Question formula is 6 - userSelectedValue, so that the score is always in the 
     * same direction for all questions. This way, when we compute the outcome, we can simply sum up 
     * the scores for each trait without worrying about whether it's a reverse question or not.
     */
    score: number;
    trait: BigFivePersonalityTraitType
}