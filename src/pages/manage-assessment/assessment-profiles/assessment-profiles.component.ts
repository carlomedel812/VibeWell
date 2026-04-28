import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  timeOutline,
  removeCircleOutline,
  eyeOutline,
  searchOutline,
  closeCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { forkJoin, of, switchMap, map } from 'rxjs';

import { IUserModel } from '../../../core/model/user-model';
import { IAssessmentAnswerModel } from '../../../core/model/assessment-answer-model';
import { IAssessmentModel } from '../../../core/model/assessment-model';
import { UserRepository } from '../../../core/repository/user-repository';
import { AssessmentAnswerRepository } from '../../../core/repository/assessment-answer-repository';
import { AssessmentRepository } from '../../../core/repository/assessment-repository';
import { AssessmentOutcomeRepository } from '../../../core/repository/assessment-outcome-repository';
import { capitalize } from '../../../core/utils/string.util';

type ProfileStatus = 'completed' | 'in-progress' | 'not-taken';
type UserSearchField = 'email' | 'firstName' | 'lastName';
type SortOption = 'name' | 'date';

interface UserProfileRow {
  user: IUserModel;
  status: ProfileStatus;
  answer?: IAssessmentAnswerModel;
}

@Component({
  selector: 'app-assessment-profiles',
  standalone: true,
  templateUrl: './assessment-profiles.component.html',
  styleUrls: ['./assessment-profiles.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonIcon,
    IonSelect,
    IonSelectOption,
  ],
})
export class AssessmentProfilesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly userRepository = inject(UserRepository);
  private readonly assessmentAnswerRepository = inject(AssessmentAnswerRepository);
  private readonly assessmentRepository = inject(AssessmentRepository);
  private readonly assessmentOutcomeRepository = inject(AssessmentOutcomeRepository);

  assessmentId = '';
  assessment: IAssessmentModel | null = null;
  userProfiles: UserProfileRow[] = [];
  isLoading = true;
  isLoadingMore = false;
  loadError = '';
  hasMore = true;

  searchText = '';
  selectedSearchField: UserSearchField = 'email';
  hasActiveSearch = false;
  sortBy: SortOption = 'name';

  deleteTarget: UserProfileRow | null = null;
  isDeleting = false;
  deleteError = '';
  readonly searchFieldOptions: Array<{ label: string; value: UserSearchField }> = [
    { label: 'Email', value: 'email' },
    { label: 'First name', value: 'firstName' },
    { label: 'Last name', value: 'lastName' },
  ];

  private readonly pageSize = 10;
  private lastCursor: QueryDocumentSnapshot<DocumentData> | null = null;

  readonly capitalize = capitalize;
  private allAnswers: IAssessmentAnswerModel[] = [];
  private answeredUserIds = new Set<string>();

  toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
    return null;
  }

  get sortedProfiles(): UserProfileRow[] {
    return [...this.userProfiles].sort((a, b) => {
      if (this.sortBy === 'name') {
        const nameA = `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim().toLowerCase();
        const nameB = `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        const dateA = this.toDate(a.answer?.completedAt)?.getTime() ?? 0;
        const dateB = this.toDate(b.answer?.completedAt)?.getTime() ?? 0;
        return dateB - dateA; // newest first
      }
    });
  }

  constructor() {
    addIcons({ checkmarkCircleOutline, timeOutline, removeCircleOutline, eyeOutline, searchOutline, closeCircleOutline, trashOutline });
  }

  ngOnInit(): void {
    this.assessmentId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.assessmentId) {
      this.loadError = 'Assessment ID not found.';
      this.isLoading = false;
      return;
    }

    this.loadProfiles();
  }

  applySearch(): void {
    this.hasActiveSearch = !!this.searchText.trim();
    this.resetPagination();
    this.loadProfiles();
  }

  clearSearch(): void {
    this.searchText = '';
    this.hasActiveSearch = false;
    this.resetPagination();
    this.loadProfiles();
  }

  onSearchFieldChange(): void {
    if (this.hasActiveSearch) {
      this.applySearch();
    }
  }

  private resetPagination(): void {
    this.lastCursor = null;
    this.hasMore = true;
    this.userProfiles = [];
  }

  private loadProfiles(): void {
    this.isLoading = true;
    this.loadError = '';

    const searchOpts = this.hasActiveSearch
      ? { searchField: this.selectedSearchField, searchText: this.searchText.toLowerCase() }
      : {};

    forkJoin({
      assessment: this.assessmentRepository.getAssessmentById(this.assessmentId),
      answers: this.assessmentAnswerRepository.getAssessmentAnswersByAssessmentId(this.assessmentId),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ assessment, answers }) => {
          this.assessment = assessment ?? null;
          this.allAnswers = answers;

          // Collect user IDs that have any answer for this assessment
          const userIds = [...new Set(answers.map((a) => a.userId).filter(Boolean))];
          this.answeredUserIds = new Set(userIds);

          if (userIds.length === 0) {
            return this.userRepository.getUsersPage({ pageSize: this.pageSize, ...searchOpts }).pipe(
              map((page) => ({ answeredUsers: [] as IUserModel[], page })),
            );
          }

          // Fetch answered users first, then first page of remaining users
          // Firestore 'in' queries support max 30 items; batch if needed
          const batches: string[][] = [];
          for (let i = 0; i < userIds.length; i += 30) {
            batches.push(userIds.slice(i, i + 30));
          }

          return forkJoin(batches.map((batch) => this.userRepository.getUsersByIds(batch))).pipe(
            map((results: IUserModel[][]) => ([] as IUserModel[]).concat(...results)),
            switchMap((answeredUsers: IUserModel[]) =>
              this.userRepository.getUsersPage({ pageSize: this.pageSize, ...searchOpts }).pipe(
                map((page) => ({ answeredUsers, page })),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: ({ answeredUsers, page }) => {
          // When searching, filter answered users to match the search criteria client-side
          const filteredAnswered = this.hasActiveSearch
            ? answeredUsers.filter((u) => this.matchesSearch(u))
            : answeredUsers;

          // Build priority rows: completed first, then in-progress
          const answeredRows = filteredAnswered.map((u) => this.buildRow(u));
          const completedRows = answeredRows.filter((r) => r.status === 'completed');
          const inProgressRows = answeredRows.filter((r) => r.status === 'in-progress');

          // Remaining users (not in answered set)
          const remainingRows = page.items
            .filter((u) => !this.answeredUserIds.has(u.id ?? ''))
            .map((u) => this.buildRow(u));

          this.userProfiles = [...completedRows, ...inProgressRows, ...remainingRows];
          this.lastCursor = page.lastVisible;
          this.hasMore = page.items.length === this.pageSize;
          this.isLoading = false;
        },
        error: () => {
          this.loadError = 'Failed to load data.';
          this.isLoading = false;
        },
      });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;

    this.isLoadingMore = true;

    const searchOpts = this.hasActiveSearch
      ? { searchField: this.selectedSearchField, searchText: this.searchText.toLowerCase() }
      : {};

    this.userRepository
      .getUsersPage({ pageSize: this.pageSize, cursor: this.lastCursor, ...searchOpts })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          const newRows = page.items
            .filter((u) => !this.answeredUserIds.has(u.id ?? ''))
            .map((u) => this.buildRow(u));
          this.userProfiles.push(...newRows);
          this.lastCursor = page.lastVisible;
          this.hasMore = page.items.length === this.pageSize;
          this.isLoadingMore = false;
        },
        error: () => {
          this.isLoadingMore = false;
        },
      });
  }

  private buildRow(user: IUserModel): UserProfileRow {
    const answer = this.allAnswers.find((a) => a.userId === user.id);

    if (!answer) {
      return { user, status: 'not-taken' };
    }

    if (answer.completed) {
      return { user, status: 'completed', answer };
    }

    return { user, status: 'in-progress', answer };
  }

  confirmDelete(row: UserProfileRow): void {
    this.deleteTarget = row;
    this.deleteError = '';
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.deleteError = '';
  }

  async executeDelete(): Promise<void> {
    const row = this.deleteTarget;
    if (!row || this.isDeleting) return;

    this.isDeleting = true;
    this.deleteError = '';

    try {
      // 1. Find and delete assessment-outcome(s) by assessmentAnswerId
      if (row.answer?.id) {
        const outcomes = await new Promise<import('../../../core/model/assessment-outcome-model').IAssessmentOutcomeModel[]>((resolve, reject) =>
          this.assessmentOutcomeRepository.getAssessmentOutcomesByAnswerId(row.answer!.id!)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: resolve, error: reject }),
        );

        for (const outcome of outcomes) {
          if (outcome.id) {
            await this.assessmentOutcomeRepository.deleteAssessmentOutcome(outcome.id);
          }
        }

        // 2. Delete the assessment-answer
        await this.assessmentAnswerRepository.deleteAssessmentAnswer(row.answer.id);
      }

      // Remove from local state
      this.userProfiles = this.userProfiles.map((r) =>
        r.user.id === row.user.id ? { user: r.user, status: 'not-taken' as ProfileStatus } : r,
      );
      this.allAnswers = this.allAnswers.filter((a) => a.userId !== row.user.id);
      this.answeredUserIds.delete(row.user.id ?? '');
      this.deleteTarget = null;
    } catch {
      this.deleteError = 'Failed to delete assessment data. Please try again.';
    } finally {
      this.isDeleting = false;
    }
  }

  private matchesSearch(user: IUserModel): boolean {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return true;
    const value = (user[this.selectedSearchField] ?? '').toLowerCase();
    return value.startsWith(term);
  }
}
