import { AssessmentLayerType } from "../enum/assessment-layer-type";
import { IBigFivePersonalityTraitConfig } from "./big-five-personality-trait-config-model";
import { ITraitListConfigModel } from "./trait-list-config-model";

export interface IAssessmentLayerModel {
    name?: string;
    description?: string;
    assessmentId: string;
    layer: number;
    type: AssessmentLayerType;
    config: IBigFivePersonalityTraitConfig | ITraitListConfigModel;
    createdAt: Date;
    updatedAt: Date;
}