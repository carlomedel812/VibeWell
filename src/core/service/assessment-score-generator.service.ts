import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
    IAssessmentOutcomeModel,
    ILayerOutcomeModel,
} from '../model/assessment-outcome-model';
import {
    IAssessmentAnswerModel,
    IAssessmentLayerAnswerBigFivePersonalityModel,
    IAssessmentLayerAnswerTraitListModel,
} from '../model/assessment-answer-model';
import { AssessmentLayerType } from '../enum/assessment-layer-type';
import { AssessmentOutcomeRepository } from '../repository/assessment-outcome-repository';
import { BigFiveOutcomeRepository } from '../repository/big-five-outcome-repository';
import { TraitListOutcomeRepository } from '../repository/trait-list-outcome-repository';
import { BigFiveResultMap, computeBigFiveScores, computeTopTraitAttributes, formatBigFiveProfile } from '../utils/trait-score.util';
import { BigFivePersonalityTraitType } from '../enum/big-five-personality-trait-type';
import { ITraitScoreModel } from '../model/big-five-outcomes-model';

@Injectable({
    providedIn: 'root',
})
export class AssessmentOutcomeGeneratorService {

    constructor(
        private readonly assessmentOutcomeRepository: AssessmentOutcomeRepository,
        private readonly bigFiveOutcomeRepository: BigFiveOutcomeRepository,
        private readonly traitListOutcomeRepository: TraitListOutcomeRepository,
    ) { }

    public async generateOutcomesForAssessment(
        assessmentAnswer: IAssessmentAnswerModel,
        assessmentOutcome?: IAssessmentOutcomeModel | null,
    ): Promise<IAssessmentOutcomeModel> {

        if (!assessmentOutcome) {
            const newOutcomeId =
                await this.assessmentOutcomeRepository.createAssessmentOutcome({
                    assessmentAnswerId: assessmentAnswer.id!,
                    generationComplete: false,
                    layerOutcomes: [],
                });

            const outcomes = await firstValueFrom(
                this.assessmentOutcomeRepository.getAssessmentOutcomeById(newOutcomeId),
            );

            assessmentOutcome = outcomes!;
        }

        for (let index = 0; index < assessmentAnswer.layerAnswers.length; index++) {
            const layerAnswer = assessmentAnswer.layerAnswers[index];
            const existingLayerOutcome = assessmentOutcome!.layerOutcomes.find((lo) => lo.layerId === layerAnswer.layerId);

            if (existingLayerOutcome) {
                continue;
            }

            if (layerAnswer.type == AssessmentLayerType.TRAIT_LIST) {
                const answer = layerAnswer.answer as IAssessmentLayerAnswerTraitListModel;
                const topTraits = computeTopTraitAttributes(answer.selectedTraits);

                const traitListOutcomes = await firstValueFrom(
                    this.traitListOutcomeRepository.getTraitListOutcomeByTraits(
                        topTraits.primary,
                        topTraits.secondary,
                    ),
                );
                const traitListOutcome = traitListOutcomes[0];

                const layerOutcome: ILayerOutcomeModel = {
                    layerId: layerAnswer.layerId,
                    layerOrder: index,
                    layerType: layerAnswer.type,
                    outcome: { traitListOutcomeId: traitListOutcome?.id ?? '' },
                };
                assessmentOutcome!.layerOutcomes.push(layerOutcome);
            } else {
                const answer = layerAnswer.answer as IAssessmentLayerAnswerBigFivePersonalityModel;
                const bigFiveResults = computeBigFiveScores(answer.selectedOption);
                const oceanProfile = formatBigFiveProfile(bigFiveResults);

                const bigFiveOutcomeId = await this.resolveBigFiveOutcomeId(oceanProfile, bigFiveResults);

                const layerOutcome: ILayerOutcomeModel = {
                    layerId: layerAnswer.layerId,
                    layerOrder: index,
                    layerType: layerAnswer.type,
                    outcome: { 
                        opennesPercentile: bigFiveResults.OPENNESS.percentile,
                        conscientiousnessPercentile: bigFiveResults.CONSCIENTIOUSNESS.percentile,
                        extraversionPercentile: bigFiveResults.EXTRAVERSION.percentile,
                        neuroticismPercentile: bigFiveResults.NEUROTICISM.percentile,
                        agreeablenessPercentile: bigFiveResults.AGREEABLENESS.percentile,
                        bigFiveTraitOutcomeId: bigFiveOutcomeId,
                    },
                };
                assessmentOutcome!.layerOutcomes.push(layerOutcome);
            }
        }

        assessmentOutcome!.generationComplete = true;
        await this.assessmentOutcomeRepository.setAssessmentOutcome(
            assessmentOutcome!.id!,
            {
                generationComplete: assessmentOutcome!.generationComplete,
                layerOutcomes: assessmentOutcome!.layerOutcomes,
            },
        );

        return assessmentOutcome;
    }

    private async resolveBigFiveOutcomeId(oceanProfile: string, bigFiveResults: BigFiveResultMap): Promise<string> {
        // Try fetching by oceanProfile as the document ID
        const outcomeById = await firstValueFrom(
            this.bigFiveOutcomeRepository.getBigFiveOutcomeById(oceanProfile),
        );

        if (outcomeById) {
            return outcomeById.id ?? '';
        }

        // Fallback: match by trait scores
        const traitScores: ITraitScoreModel = {
            openness: bigFiveResults[BigFivePersonalityTraitType.OPENNESS].level,
            conscientiousness: bigFiveResults[BigFivePersonalityTraitType.CONSCIENTIOUSNESS].level,
            extraversion: bigFiveResults[BigFivePersonalityTraitType.EXTRAVERSION].level,
            agreeableness: bigFiveResults[BigFivePersonalityTraitType.AGREEABLENESS].level,
            neuroticism: bigFiveResults[BigFivePersonalityTraitType.NEUROTICISM].level,
        };

        const outcomesByScores = await firstValueFrom(
            this.bigFiveOutcomeRepository.getBigFiveOutcomeByTraitScores(traitScores),
        );

        return outcomesByScores[0]?.id ?? '';
    }
}
