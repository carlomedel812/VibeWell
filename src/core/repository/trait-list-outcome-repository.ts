import { Injectable } from '@angular/core';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { ITraitListOutcomesModel } from '../model/trait-list-outcomes-model';
import { TraitAttribute } from '../enum/trait-attribute';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class TraitListOutcomeRepository {
  private readonly collectionPath = 'trait-list-outcomes';

  constructor(private readonly firestoreService: FirestoreService) {}

  createTraitListOutcome(outcome: Omit<ITraitListOutcomesModel, 'id'>): Promise<string> {
    return this.firestoreService.create<Omit<ITraitListOutcomesModel, 'id'>>(
      this.collectionPath,
      outcome,
    );
  }

  setTraitListOutcome(outcomeId: string, outcome: Partial<ITraitListOutcomesModel>): Promise<void> {
    return this.firestoreService.set<Partial<ITraitListOutcomesModel>>(this.collectionPath, outcomeId, outcome);
  }

  updateTraitListOutcome(outcomeId: string, updates: Partial<ITraitListOutcomesModel>): Promise<void> {
    return this.firestoreService.update<ITraitListOutcomesModel>(this.collectionPath, outcomeId, updates);
  }

  deleteTraitListOutcome(outcomeId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, outcomeId);
  }

  getTraitListOutcomeById(outcomeId: string): Observable<ITraitListOutcomesModel | undefined> {
    return this.firestoreService.getOne<ITraitListOutcomesModel>(this.collectionPath, outcomeId);
  }

  getAllTraitListOutcomes(): Observable<ITraitListOutcomesModel[]> {
    return this.firestoreService.getAll<ITraitListOutcomesModel>(this.collectionPath);
  }

  queryTraitListOutcomes(constraints: QueryConstraint[] = []): Observable<ITraitListOutcomesModel[]> {
    return this.firestoreService.getByQuery<ITraitListOutcomesModel>(this.collectionPath, constraints);
  }

  getTraitListOutcomeByTraits(primaryTrait: TraitAttribute, secondaryTrait: TraitAttribute): Observable<ITraitListOutcomesModel[]> {
    const constraints: QueryConstraint[] = [
      where('primaryTrait', '==', primaryTrait),
      where('secondaryTrait', '==', secondaryTrait),
    ];

    return this.queryTraitListOutcomes(constraints);
  }
}
