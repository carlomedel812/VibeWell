import { TraitAttribute } from "../enum/trait-attribute";

export interface ITraitListAdjectiveModel {
    layerId: string;
    adjective: string;
    attribute: TraitAttribute;
    scoringWeight: number;
}