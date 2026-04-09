import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IBigFivePersonalityQuestionModel } from '../model/big-five-personality-question';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class BigFivePersonalityQuestionRepository {
  private readonly collectionPath = 'big-five-personality-questions';

  constructor(private readonly firestoreService: FirestoreService) {}

  createBigFivePersonalityQuestion(question: IBigFivePersonalityQuestionModel): Promise<string> {
    return this.firestoreService.create<IBigFivePersonalityQuestionModel>(this.collectionPath, question);
  }

  setBigFivePersonalityQuestion(questionId: string, question: Partial<IBigFivePersonalityQuestionModel>): Promise<void> {
    return this.firestoreService.set<Partial<IBigFivePersonalityQuestionModel>>(this.collectionPath, questionId, question);
  }

  updateBigFivePersonalityQuestion(questionId: string, updates: Partial<IBigFivePersonalityQuestionModel>): Promise<void> {
    return this.firestoreService.update<IBigFivePersonalityQuestionModel>(this.collectionPath, questionId, updates);
  }

  deleteBigFivePersonalityQuestion(questionId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, questionId);
  }

  getBigFivePersonalityQuestionById(questionId: string): Observable<IBigFivePersonalityQuestionModel | undefined> {
    return this.firestoreService.getOne<IBigFivePersonalityQuestionModel>(this.collectionPath, questionId);
  }

  getAllBigFivePersonalityQuestions(): Observable<IBigFivePersonalityQuestionModel[]> {
    return this.firestoreService.getAll<IBigFivePersonalityQuestionModel>(this.collectionPath);
  }

  getBigFivePersonalityQuestionsByLayerId(layerId: string): Observable<IBigFivePersonalityQuestionModel[]> {
    const constraints: QueryConstraint[] = [
      where('layerId', '==', layerId),
    ];

    return this.queryBigFivePersonalityQuestions(constraints);
  }

  getBigFivePersonalityQuestionsByTrait(trait: IBigFivePersonalityQuestionModel['trait']): Observable<IBigFivePersonalityQuestionModel[]> {
    const constraints: QueryConstraint[] = [
      where('trait', '==', trait),
    ];

    return this.queryBigFivePersonalityQuestions(constraints);
  }

  queryBigFivePersonalityQuestions(constraints: QueryConstraint[] = []): Observable<IBigFivePersonalityQuestionModel[]> {
    return this.firestoreService.getByQuery<IBigFivePersonalityQuestionModel>(this.collectionPath, constraints);
  }

  getBigFivePersonalityQuestionsByIds(questionIds: string[]): Observable<IBigFivePersonalityQuestionModel[]> {
    if (questionIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', questionIds),
    ];

    return this.queryBigFivePersonalityQuestions(constraints);
  }
}
