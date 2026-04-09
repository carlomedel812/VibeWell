import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { ITraitListAdjectiveModel } from '../model/trait-list-adjective-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class TraitListAdjectiveRepository {
  private readonly collectionPath = 'trait-list-adjectives';

  constructor(private readonly firestoreService: FirestoreService) {}

  createTraitListAdjective(adjective: ITraitListAdjectiveModel): Promise<string> {
    return this.firestoreService.create<ITraitListAdjectiveModel>(this.collectionPath, adjective);
  }

  setTraitListAdjective(adjectiveId: string, adjective: Partial<ITraitListAdjectiveModel>): Promise<void> {
    return this.firestoreService.set<Partial<ITraitListAdjectiveModel>>(this.collectionPath, adjectiveId, adjective);
  }

  updateTraitListAdjective(adjectiveId: string, updates: Partial<ITraitListAdjectiveModel>): Promise<void> {
    return this.firestoreService.update<ITraitListAdjectiveModel>(this.collectionPath, adjectiveId, updates);
  }

  deleteTraitListAdjective(adjectiveId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, adjectiveId);
  }

  getTraitListAdjectiveById(adjectiveId: string): Observable<ITraitListAdjectiveModel | undefined> {
    return this.firestoreService.getOne<ITraitListAdjectiveModel>(this.collectionPath, adjectiveId);
  }

  getAllTraitListAdjectives(): Observable<ITraitListAdjectiveModel[]> {
    return this.firestoreService.getAll<ITraitListAdjectiveModel>(this.collectionPath);
  }

  getTraitListAdjectivesByLayerId(layerId: string): Observable<ITraitListAdjectiveModel[]> {
    const constraints: QueryConstraint[] = [
      where('layerId', '==', layerId),
    ];

    return this.queryTraitListAdjectives(constraints);
  }

  getTraitListAdjectivesByAttribute(attribute: string): Observable<ITraitListAdjectiveModel[]> {
    const constraints: QueryConstraint[] = [
      where('attribute', '==', attribute),
    ];

    return this.queryTraitListAdjectives(constraints);
  }

  queryTraitListAdjectives(constraints: QueryConstraint[] = []): Observable<ITraitListAdjectiveModel[]> {
    return this.firestoreService.getByQuery<ITraitListAdjectiveModel>(this.collectionPath, constraints);
  }

  getTraitListAdjectivesByIds(adjectiveIds: string[]): Observable<ITraitListAdjectiveModel[]> {
    if (adjectiveIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', adjectiveIds),
    ];

    return this.queryTraitListAdjectives(constraints);
  }
}
