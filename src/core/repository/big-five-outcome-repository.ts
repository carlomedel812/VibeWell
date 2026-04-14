import { Injectable } from '@angular/core';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { IBigFivePersonalityTraitOutcomeModel, ITraitScoreModel } from '../model/big-five-outcomes-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class BigFiveOutcomeRepository {
  private readonly collectionPath = 'big-five-outcomes-2';

  constructor(private readonly firestoreService: FirestoreService) {}

  createBigFiveOutcome(outcome: Omit<IBigFivePersonalityTraitOutcomeModel, 'id'>): Promise<string> {
    return this.firestoreService.create<Omit<IBigFivePersonalityTraitOutcomeModel, 'id'>>(
      this.collectionPath,
      outcome,
    );
  }

  setBigFiveOutcome(outcomeId: string, outcome: Partial<IBigFivePersonalityTraitOutcomeModel>): Promise<void> {
    return this.firestoreService.set<Partial<IBigFivePersonalityTraitOutcomeModel>>(this.collectionPath, outcomeId, outcome);
  }

  updateBigFiveOutcome(outcomeId: string, updates: Partial<IBigFivePersonalityTraitOutcomeModel>): Promise<void> {
    return this.firestoreService.update<IBigFivePersonalityTraitOutcomeModel>(this.collectionPath, outcomeId, updates);
  }

  deleteBigFiveOutcome(outcomeId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, outcomeId);
  }

  getBigFiveOutcomeById(outcomeId: string): Observable<IBigFivePersonalityTraitOutcomeModel | undefined> {
    return this.firestoreService.getOne<IBigFivePersonalityTraitOutcomeModel>(this.collectionPath, outcomeId);
  }

  getAllBigFiveOutcomes(): Observable<IBigFivePersonalityTraitOutcomeModel[]> {
    return this.firestoreService.getAll<IBigFivePersonalityTraitOutcomeModel>(this.collectionPath);
  }

  queryBigFiveOutcomes(constraints: QueryConstraint[] = []): Observable<IBigFivePersonalityTraitOutcomeModel[]> {
    return this.firestoreService.getByQuery<IBigFivePersonalityTraitOutcomeModel>(this.collectionPath, constraints);
  }

  getBigFiveOutcomeByTraitScores(traitScores: ITraitScoreModel): Observable<IBigFivePersonalityTraitOutcomeModel[]> {
    const constraints: QueryConstraint[] = [
      where('traitScores.openness', '==', traitScores.openness),
      where('traitScores.conscientiousness', '==', traitScores.conscientiousness),
      where('traitScores.extraversion', '==', traitScores.extraversion),
      where('traitScores.agreeableness', '==', traitScores.agreeableness),
      where('traitScores.neuroticism', '==', traitScores.neuroticism),
    ];

    return this.queryBigFiveOutcomes(constraints);
  }
}
