import { TraitAttribute } from '../enum/trait-attribute';
import { BigFivePersonalityTraitType } from '../enum/big-five-personality-trait-type';
import { BigFiveTraitScoreType } from '../enum/big-five-trait-score-type';
import { ITraitListAdjectiveModel } from '../model/trait-list-adjective-model';
import { IAssessmentLayerAnswerBigFivePersonalityOption } from '../model/assessment-answer-model';

export type TraitScoreMap = Record<TraitAttribute, number>;

function computeTraitListScores(selectedTraits: ITraitListAdjectiveModel[]): TraitScoreMap {
  const scores = Object.values(TraitAttribute).reduce((acc, attribute) => {
    acc[attribute] = 0;
    return acc;
  }, {} as TraitScoreMap);

  for (const trait of selectedTraits) {
    if (trait.attribute in scores) {
      scores[trait.attribute] += trait.scoringWeight;
    }
  }

  return scores;
}

function getTopTraitAttributes(scores: TraitScoreMap): { primary: TraitAttribute; secondary: TraitAttribute } {
  const sorted = Object.entries(scores)
    .filter(([key]) => key !== TraitAttribute.NONE)
    .sort((a, b) => b[1] - a[1]);

  return {
    primary: sorted[0]?.[0] as TraitAttribute ?? TraitAttribute.NONE,
    secondary: sorted[1]?.[0] as TraitAttribute ?? TraitAttribute.NONE,
  };
}

export function computeTopTraitAttributes(selectedTraits: ITraitListAdjectiveModel[]): { primary: TraitAttribute; secondary: TraitAttribute } {
  const scores = computeTraitListScores(selectedTraits);
  return getTopTraitAttributes(scores);
}

export type BigFiveScoreMap = Record<BigFivePersonalityTraitType, number>;

export interface BigFiveTraitResult {
  percentile: number;
  level: BigFiveTraitScoreType;
}

export type BigFiveResultMap = Record<BigFivePersonalityTraitType, BigFiveTraitResult>;

export function computeBigFiveScores(selectedOptions: IAssessmentLayerAnswerBigFivePersonalityOption[]): BigFiveResultMap {
  const rawScores = Object.values(BigFivePersonalityTraitType).reduce((acc, trait) => {
    acc[trait] = 0;
    return acc;
  }, {} as BigFiveScoreMap);

  for (const option of selectedOptions) {
    if (option.trait in rawScores) {
      rawScores[option.trait] += option.score;
    }
  }

  const results = Object.values(BigFivePersonalityTraitType).reduce((acc, trait) => {
    const percentile = ((rawScores[trait] - 10) / 40) * 100;
    let level: BigFiveTraitScoreType;

    if (percentile > 66) {
      level = BigFiveTraitScoreType.HIGH;
    } else if (percentile >= 34) {
      level = BigFiveTraitScoreType.MEDIUM;
    } else {
      level = BigFiveTraitScoreType.LOW;
    }

    acc[trait] = { percentile: Math.round(percentile), level };
    return acc;
  }, {} as BigFiveResultMap);

  return results;
}

export function formatBigFiveProfile(results: BigFiveResultMap): string {
  return [
    `O:${results[BigFivePersonalityTraitType.OPENNESS].level}`,
    `C:${results[BigFivePersonalityTraitType.CONSCIENTIOUSNESS].level}`,
    `E:${results[BigFivePersonalityTraitType.EXTRAVERSION].level}`,
    `A:${results[BigFivePersonalityTraitType.AGREEABLENESS].level}`,
    `N:${results[BigFivePersonalityTraitType.NEUROTICISM].level}`,
  ].join(' | ');
}
