import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
    return addDoc(collectionRef, this.removeUndefinedFields({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })).then((result) => result.id);
  }

  set<T extends object>(path: string, id: string, data: T): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return setDoc(docRef, this.removeUndefinedFields({
      ...data,
      updatedAt: Date.now(),
    }), { merge: true });
  }

  update<T extends object>(path: string, id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return updateDoc(docRef, this.removeUndefinedFields({
      ...data,
      updatedAt: Date.now(),
    }) as Record<string, unknown>);
  }

  delete(path: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(docRef);
  }

  getOne<T>(path: string, id: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, `${path}/${id}`);
    return from(getDoc(docRef)).pipe(
      map((snapshot) => (snapshot.exists() ? ({
        id: snapshot.id,
        ...snapshot.data(),
      } as T) : undefined)),
    );
  }

  getAll<T>(path: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const queryRef = query(collectionRef);

    return from(getDocs(queryRef)).pipe(
      map((snapshot) => snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as T))),
    );
  }

  getByQuery<T>(path: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const queryRef = constraints.length > 0
      ? query(collectionRef, ...constraints)
      : query(collectionRef);

    return from(getDocs(queryRef)).pipe(
      map((snapshot) => snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as T))),
    );
  }

  private removeUndefinedFields<T>(value: T): T {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.removeUndefinedFields(item))
        .filter((item) => item !== undefined) as T;
    }

    if (value instanceof Date || value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .reduce<Record<string, unknown>>((sanitizedObject, [key, entryValue]) => {
        sanitizedObject[key] = this.removeUndefinedFields(entryValue);
        return sanitizedObject;
      }, {}) as T;
  }
}
