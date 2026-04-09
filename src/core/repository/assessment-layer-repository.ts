import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, map, of } from 'rxjs';

import { IAssessmentLayerModel } from '../model/assessment-layer-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class AssessmentLayerRepository {
  private readonly collectionPath = 'assessment-layers';

  constructor(private readonly firestoreService: FirestoreService) {}

  createAssessmentLayer(layer: Omit<IAssessmentLayerModel, 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.firestoreService.create<Omit<IAssessmentLayerModel, 'createdAt' | 'updatedAt'>>(
      this.collectionPath,
      layer,
    );
  }

  setAssessmentLayer(layerId: string, layer: Partial<IAssessmentLayerModel>): Promise<void> {
    return this.firestoreService.set<Partial<IAssessmentLayerModel>>(this.collectionPath, layerId, layer);
  }

  updateAssessmentLayer(layerId: string, updates: Partial<IAssessmentLayerModel>): Promise<void> {
    return this.firestoreService.update<IAssessmentLayerModel>(this.collectionPath, layerId, updates);
  }

  deleteAssessmentLayer(layerId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, layerId);
  }

  getAssessmentLayerById(layerId: string): Observable<IAssessmentLayerModel | undefined> {
    return this.firestoreService.getOne<IAssessmentLayerModel>(this.collectionPath, layerId);
  }

  getAllAssessmentLayers(): Observable<IAssessmentLayerModel[]> {
    return this.firestoreService.getAll<IAssessmentLayerModel>(this.collectionPath);
  }

  getAssessmentLayersByAssessmentId(assessmentId: string): Observable<IAssessmentLayerModel[]> {
    const constraints: QueryConstraint[] = [
      where('assessmentId', '==', assessmentId),
    ];

    return this.queryAssessmentLayers(constraints).pipe(
      map((layers) => [...layers].sort((left, right) => left.layer - right.layer)),
    );
  }

  queryAssessmentLayers(constraints: QueryConstraint[] = []): Observable<IAssessmentLayerModel[]> {
    return this.firestoreService.getByQuery<IAssessmentLayerModel>(this.collectionPath, constraints);
  }

  getAssessmentLayersByIds(layerIds: string[]): Observable<IAssessmentLayerModel[]> {
    if (layerIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', layerIds),
    ];

    return this.queryAssessmentLayers(constraints);
  }
}
