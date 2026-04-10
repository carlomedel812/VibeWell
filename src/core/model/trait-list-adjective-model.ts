import { IFirestoreDocumentModel } from "./firestore-document-model";
import { TraitAttribute } from "../enum/trait-attribute";

export interface ITraitListAdjectiveModel extends IFirestoreDocumentModel {
    layerId: string;
    adjective: string;
    attribute: TraitAttribute;
    scoringWeight: number;
}