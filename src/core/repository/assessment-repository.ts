import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IAssessmentModel } from '../model/assessment-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class AssessmentRepository {
  private readonly collectionPath = 'assessments';

  constructor(private readonly firestoreService: FirestoreService) {}

  createAssessment(assessment: Omit<IAssessmentModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.firestoreService.create<Omit<IAssessmentModel, 'id' | 'createdAt' | 'updatedAt'>>(
      this.collectionPath,
      assessment,
    );
  }

  setAssessment(assessmentId: string, assessment: Partial<IAssessmentModel>): Promise<void> {
    return this.firestoreService.set<Partial<IAssessmentModel>>(this.collectionPath, assessmentId, assessment);
  }

  updateAssessment(assessmentId: string, updates: Partial<IAssessmentModel>): Promise<void> {
    return this.firestoreService.update<IAssessmentModel>(this.collectionPath, assessmentId, updates);
  }

  deleteAssessment(assessmentId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, assessmentId);
  }

  getAssessmentById(assessmentId: string): Observable<IAssessmentModel | undefined> {
    return this.firestoreService.getOne<IAssessmentModel>(this.collectionPath, assessmentId);
  }

  getAllAssessments(): Observable<IAssessmentModel[]> {
    return this.firestoreService.getAll<IAssessmentModel>(this.collectionPath);
  }

  getEnabledAssessments(): Observable<IAssessmentModel[]> {
    const constraints: QueryConstraint[] = [
      where('enabled', '==', true),
    ];

    return this.queryAssessments(constraints);
  }

  queryAssessments(constraints: QueryConstraint[] = []): Observable<IAssessmentModel[]> {
    return this.firestoreService.getByQuery<IAssessmentModel>(this.collectionPath, constraints);
  }

  getAssessmentsByIds(assessmentIds: string[]): Observable<IAssessmentModel[]> {
    if (assessmentIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', assessmentIds),
    ];

    return this.queryAssessments(constraints);
  }
}
