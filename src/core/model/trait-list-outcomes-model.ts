import { TraitAttribute } from "../enum/trait-attribute";
import { IFirestoreDocumentModel } from "./firestore-document-model";

export interface ITraitListOutcomesModel extends IFirestoreDocumentModel{
    archetypeName: string;
    executiveSummary: string;
    inGoodCompany: IInGoodCompanyModel[];
    operationalBlindSpots: string[];
    operationalDynamics: string[];
    primaryAnimal: string;
    primaryTrait: TraitAttribute;
    secondaryAnimal: string;
    secondaryTrait: TraitAttribute;
    signatureStrengths: string[];
}

export interface IInGoodCompanyModel {
    descritption: string;
    name: string;
    title: string;
}
