import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  query,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly firestore = inject(Firestore);

  create<T extends object>(path: string, data: T): Promise<string> {
    const collectionRef = collection(this.firestore, path);
    return addDoc(collectionRef, {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).then((result) => result.id);
  }

  set<T extends object>(path: string, id: string, data: T): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return setDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
  }

  update<T extends object>(path: string, id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    } as Record<string, unknown>);
  }

  delete(path: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(docRef);
  }

  getOne<T>(path: string, id: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return from(getDoc(docRef)).pipe(
      map((snapshot) => (snapshot.exists() ? (snapshot.data() as T) : undefined)),
    );
  }

  getAll<T>(path: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    return collectionData(collectionRef, { idField: 'id' }) as Observable<T[]>;
  }

  getByQuery<T>(path: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const queryRef = constraints.length > 0
      ? query(collectionRef, ...constraints)
      : query(collectionRef);

    return collectionData(queryRef, { idField: 'id' }) as Observable<T[]>;
  }
}
