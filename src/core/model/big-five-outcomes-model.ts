import { BigFiveTraitScoreType } from "../enum/big-five-trait-score-type";
import { IFirestoreDocumentModel } from "./firestore-document-model";

export interface IBigFivePersonalityTraitOutcomeModel extends IFirestoreDocumentModel {
    coreBaselines: ICoreBaselineModel;
    environmentalFit: IEnvironmentalFitModel;
    oceanProfile: String;
    synthesizedDynamics: ISynthesizeDynamicsModel
    traitScores: ITraitScoreModel;
}

export interface ICoreBaselineModel {
    energyBattery: string;
    executionAndWorkEthic: string;
    stressBaseline: string;
    trustBaseline: string;   
}

export interface IEnvironmentalFitModel {
    idealManagerProfile: string;
    toxicEnvironmentTrigger: string;
}

export interface ISynthesizeDynamicsModel {
    decisionVelocity: string;
    feedbackReceptivity: string;
    influenceEngine: string;
    infoProcessingStyle: string;
    riskTolerance: string;
}

export interface ITraitScoreModel {
    agreeableness: BigFiveTraitScoreType;
    conscientiousness: BigFiveTraitScoreType;
    extraversion: BigFiveTraitScoreType;
    neuroticism: BigFiveTraitScoreType;
    openness: BigFiveTraitScoreType;
}