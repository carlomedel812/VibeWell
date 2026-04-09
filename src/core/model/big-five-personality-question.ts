import { IBigFivePersonalityTraitType } from '../enum/big-five-personality-trait-type';

export interface IBigFivePersonalityQuestion {
    layerId: string;
    trait: IBigFivePersonalityTraitType;
    statement: string;
    scoringTypePositive: boolean
}