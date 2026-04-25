import { TraitAttribute } from "../enum/trait-attribute";
import { IFirestoreDocumentModel } from "./firestore-document-model";

export interface ITraitListOutcomesModel extends IFirestoreDocumentModel{
    archetypeName: string;
    executiveSummary: string;
    inGoodCompany: IInGoodCompanyModel[];
    operationalBlindSpots: IOperationalBlindspotModel[];
    operationalDynamics: IOperationDynamicsModel;
    primaryAnimal: string;
    primaryTrait: TraitAttribute;
    secondaryAnimal: string;
    secondaryTrait: TraitAttribute;
    signatureStrengths: ISignatureStrengthModel[];
    animalPictureUrl: string;
}

export interface ISignatureStrengthModel {
    name: string,
    description: string
}

export interface IOperationalBlindspotModel {
    name: string,
    description: string
}

export interface IOperationDynamicsModel {
    conflictAndMeetingStyle: string;
    delegationProfile: string;
    frictionPoint: string;
    optimalWorkEnvironment: string;
}

export interface IInGoodCompanyModel {
    description: string;
    name: string;
    title: string;
}
