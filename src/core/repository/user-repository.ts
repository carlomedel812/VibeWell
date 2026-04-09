import { Injectable } from '@angular/core';
import { QueryConstraint, documentId, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IUserModel } from '../model/user-model';
import { FirestoreService } from '../service/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class UserRepository {
  private readonly collectionPath = 'users';

  constructor(private readonly firestoreService: FirestoreService) {}

  createUser(user: IUserModel): Promise<string> {
    return this.firestoreService.create<IUserModel>(this.collectionPath, user);
  }

  setUser(userId: string, user: Partial<IUserModel>): Promise<void> {
    return this.firestoreService.set<Partial<IUserModel>>(this.collectionPath, userId, user);
  }

  updateUser(userId: string, updates: Partial<IUserModel>): Promise<void> {
    return this.firestoreService.update<IUserModel>(this.collectionPath, userId, updates);
  }

  deleteUser(userId: string): Promise<void> {
    return this.firestoreService.delete(this.collectionPath, userId);
  }

  getUserById(userId: string): Observable<IUserModel | undefined> {
    return this.firestoreService.getOne<IUserModel>(this.collectionPath, userId);
  }

  getUserByEmail(email: string): Observable<IUserModel[]> {
    const constraints: QueryConstraint[] = [
      where('email', '==', email),
    ];

    return this.queryUsers(constraints);
  }

  getAllUsers(): Observable<IUserModel[]> {
    return this.firestoreService.getAll<IUserModel>(this.collectionPath);
  }

  queryUsers(constraints: QueryConstraint[] = []): Observable<IUserModel[]> {
    return this.firestoreService.getByQuery<IUserModel>(this.collectionPath, constraints);
  }

  getUsersByIds(userIds: string[]): Observable<IUserModel[]> {
    if (userIds.length === 0) {
      return of([]);
    }

    const constraints: QueryConstraint[] = [
      where(documentId(), 'in', userIds),
    ];

    return this.queryUsers(constraints);
  }
}
