import { Injectable } from '@angular/core';
import {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
  documentId,
  endAt,
  limit,
  orderBy,
  startAfter,
  startAt,
  where,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

import { IUserModel } from '../model/user-model';
import { FirestoreService, IFirestorePageResult } from '../service/firestore.service';

export interface IUserPageOptions {
  pageSize: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  searchField?: 'email' | 'firstName' | 'lastName';
  searchText?: string;
}

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

  getUsersPage(options: IUserPageOptions): Observable<IFirestorePageResult<IUserModel>> {
    return this.firestoreService.getPageByQuery<IUserModel>(
      this.collectionPath,
      this.buildPageConstraints(options),
    );
  }

  getUsersCount(options: Pick<IUserPageOptions, 'searchField' | 'searchText'> = {}): Observable<number> {
    return this.firestoreService.getCountByQuery(
      this.collectionPath,
      this.buildFilterConstraints(options),
    );
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

  private buildPageConstraints(options: IUserPageOptions): QueryConstraint[] {
    const constraints = this.buildFilterConstraints(options);

    if (options.cursor) {
      constraints.push(startAfter(options.cursor));
    }

    constraints.push(limit(options.pageSize));

    return constraints;
  }

  private buildFilterConstraints(options: Pick<IUserPageOptions, 'searchField' | 'searchText'>): QueryConstraint[] {
    const searchField = options.searchField ?? 'email';
    const trimmedSearchText = options.searchText?.trim() ?? '';
    const constraints: QueryConstraint[] = [orderBy(searchField)];

    if (trimmedSearchText) {
      constraints.push(startAt(trimmedSearchText));
      constraints.push(endAt(`${trimmedSearchText}\uf8ff`));
    }

    return constraints;
  }
}
