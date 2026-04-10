import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IAssessmentAnswerModel } from '../model/assessment-answer-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class AssessmentAnswerRepository {
  private readonly collectionPath = 'assessment-answers';

  constructor(private readonly firestoreService: FirestoreService) {}

  createAssessmentAnswer(answer: Omit<IAssessmentAnswerModel, 'id'>): Promise<string> {
    return this.firestoreService.create<Omit<IAssessmentAnswerModel, 'id'>>(
      this.collectionPath,
      answer,
    );
  }

  setAssessmentAnswer(answerId: string, answer: Partial<IAssessmentAnswerModel>): Promise<void> {
    return this.firestoreService.set<Partial<IAssessmentAnswerModel>>(this.collectionPath, answerId, answer);
  }

  updateAssessmentAnswer(answerId: string, updates: Partial<IAssessmentAnswerModel>): Promise<void> {
    return this.firestoreService.update<IAssessmentAnswerModel>(this.collectionPath, answerId, updates);
  }

  deleteAssessmentAnswer(answerId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, answerId);
  }

  getAssessmentAnswerById(answerId: string): Observable<IAssessmentAnswerModel | undefined> {
    return this.firestoreService.getOne<IAssessmentAnswerModel>(this.collectionPath, answerId);
  }

  getAllAssessmentAnswers(): Observable<IAssessmentAnswerModel[]> {
    return this.firestoreService.getAll<IAssessmentAnswerModel>(this.collectionPath);
  }

  getAssessmentAnswersByUserId(userId: string): Observable<IAssessmentAnswerModel[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
    ];

    return this.queryAssessmentAnswers(constraints);
  }

  getAssessmentAnswersByAssessmentId(assessmentId: string): Observable<IAssessmentAnswerModel[]> {
    const constraints: QueryConstraint[] = [
      where('assessmentId', '==', assessmentId),
    ];

    return this.queryAssessmentAnswers(constraints);
  }

  getAssessmentAnswersByUserIdAndAssessmentId(userId: string, assessmentId: string): Observable<IAssessmentAnswerModel[]> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('assessmentId', '==', assessmentId),
    ];

    return this.queryAssessmentAnswers(constraints);
  }

  getCompletedAssessmentAnswers(): Observable<IAssessmentAnswerModel[]> {
    const constraints: QueryConstraint[] = [
      where('completed', '==', true),
    ];

    return this.queryAssessmentAnswers(constraints);
  }

  queryAssessmentAnswers(constraints: QueryConstraint[] = []): Observable<IAssessmentAnswerModel[]> {
    return this.firestoreService.getByQuery<IAssessmentAnswerModel>(this.collectionPath, constraints);
  }

  getAssessmentAnswersByIds(answerIds: string[]): Observable<IAssessmentAnswerModel[]> {
    if (answerIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', answerIds),
    ];

    return this.queryAssessmentAnswers(constraints);
  }
}
