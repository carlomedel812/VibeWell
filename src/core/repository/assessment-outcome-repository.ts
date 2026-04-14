import { Injectable } from '@angular/core';
import { QueryConstraint, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IAssessmentOutcomeModel } from '../model/assessment-outcome-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class AssessmentOutcomeRepository {
  private readonly collectionPath = 'assessment-outcomes';

  constructor(private readonly firestoreService: FirestoreService) {}

  createAssessmentOutcome(outcome: Omit<IAssessmentOutcomeModel, 'id'>): Promise<string> {
    return this.firestoreService.create<Omit<IAssessmentOutcomeModel, 'id'>>(
      this.collectionPath,
      outcome,
    );
  }

  setAssessmentOutcome(outcomeId: string, outcome: Partial<IAssessmentOutcomeModel>): Promise<void> {
    return this.firestoreService.set<Partial<IAssessmentOutcomeModel>>(this.collectionPath, outcomeId, outcome);
  }

  updateAssessmentOutcome(outcomeId: string, updates: Partial<IAssessmentOutcomeModel>): Promise<void> {
    return this.firestoreService.update<IAssessmentOutcomeModel>(this.collectionPath, outcomeId, updates);
  }

  deleteAssessmentOutcome(outcomeId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, outcomeId);
  }

  getAssessmentOutcomeById(outcomeId: string): Observable<IAssessmentOutcomeModel | undefined> {
    return this.firestoreService.getOne<IAssessmentOutcomeModel>(this.collectionPath, outcomeId);
  }

  getAllAssessmentOutcomes(): Observable<IAssessmentOutcomeModel[]> {
    return this.firestoreService.getAll<IAssessmentOutcomeModel>(this.collectionPath);
  }

  getAssessmentOutcomesByAnswerId(assessmentAnswerId: string): Observable<IAssessmentOutcomeModel[]> {
    const constraints: QueryConstraint[] = [
      where('assessmentAnswerId', '==', assessmentAnswerId),
    ];

    return this.queryAssessmentOutcomes(constraints);
  }

  queryAssessmentOutcomes(constraints: QueryConstraint[] = []): Observable<IAssessmentOutcomeModel[]> {
    return this.firestoreService.getByQuery<IAssessmentOutcomeModel>(this.collectionPath, constraints);
  }
}
