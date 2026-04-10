import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  closeCircleOutline,
  peopleOutline,
  searchOutline,
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';

import { UserRole } from '../../core/enum/user-role';
import { IUserModel } from '../../core/model/user-model';
import { IUserPageOptions, UserRepository } from '../../core/repository/user-repository';

interface UserManagementCard {
  user: IUserModel;
  draftRole: UserRole;
  draftIsActive: boolean;
  hasProfileImageError: boolean;
  isExpanded: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

type UserSearchField = 'email' | 'firstName' | 'lastName';

@Component({
  selector: 'app-users-management',
  standalone: true,
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
  imports: [
    FormsModule,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class UsersManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly userRoles = Object.values(UserRole);
  readonly searchFieldOptions: Array<{ label: string; value: UserSearchField }> = [
    { label: 'Search by Email', value: 'email' },
    { label: 'Search by First Name', value: 'firstName' },
    { label: 'Search by Last Name', value: 'lastName' },
  ];
  readonly pageSize = 6;

  userCards: UserManagementCard[] = [];
  isLoading = true;
  loadError: string | null = null;
  searchText = '';
  selectedSearchField: UserSearchField = 'email';
  currentPage = 1;
  totalUserCount = 0;
  hasNextPage = false;
  private readonly pageCursors = new Map<number, QueryDocumentSnapshot<DocumentData> | null>([[1, null]]);

  constructor(private readonly userRepository: UserRepository) {
    addIcons({
      peopleOutline,
      chevronDownOutline,
      chevronUpOutline,
      checkmarkCircleOutline,
      searchOutline,
      closeCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadUsersPage(1, true);
  }

  toggleCard(card: UserManagementCard): void {
    card.isExpanded = !card.isExpanded;
  }

  onProfileImageError(card: UserManagementCard): void {
    card.hasProfileImageError = true;
  }

  applySearch(): void {
    this.resetPagination();
    this.loadUsersPage(1, true);
  }

  clearSearch(): void {
    this.searchText = '';
    this.resetPagination();
    this.loadUsersPage(1, true);
  }

  onSearchFieldChange(): void {
    this.applySearch();
  }

  get hasActiveSearch(): boolean {
    return this.searchText.trim().length > 0;
  }

  get totalPages(): number {
    return Math.ceil(this.totalUserCount / this.pageSize);
  }

  get hasPagination(): boolean {
    return this.totalPages > 1;
  }

  get startItemNumber(): number {
    if (this.totalUserCount === 0 || this.userCards.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItemNumber(): number {
    return Math.min(this.startItemNumber + this.userCards.length - 1, this.totalUserCount);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.loadUsersPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage) {
      this.loadUsersPage(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && this.pageCursors.has(page)) {
      this.loadUsersPage(page);
    }
  }

  hasPendingChanges(card: UserManagementCard): boolean {
    return card.draftRole !== card.user.role || card.draftIsActive !== card.user.isActive;
  }

  resetCard(card: UserManagementCard): void {
    card.draftRole = card.user.role;
    card.draftIsActive = card.user.isActive;
    card.errorMessage = null;
    card.successMessage = null;
  }

  async saveCard(card: UserManagementCard): Promise<void> {
    if (!card.user.id || !this.hasPendingChanges(card) || card.isSaving) {
      return;
    }

    card.isSaving = true;
    card.errorMessage = null;
    card.successMessage = null;

    try {
      const updatedAt = new Date();

      await this.userRepository.updateUser(card.user.id, {
        role: card.draftRole,
        isActive: card.draftIsActive,
        updatedAt,
      });

      card.user = {
        ...card.user,
        role: card.draftRole,
        isActive: card.draftIsActive,
        updatedAt,
      };
      card.successMessage = 'User updated successfully.';
    } catch {
      card.errorMessage = 'Unable to save this user right now. Please try again.';
    } finally {
      card.isSaving = false;
    }
  }

  getDisplayName(user: IUserModel): string {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  }

  getInitials(user: IUserModel): string {
    const firstInitial = user.firstName?.charAt(0) ?? '';
    const lastInitial = user.lastName?.charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    return initials || user.email.charAt(0).toUpperCase();
  }

  formatDate(value: unknown): string {
    const date = this.resolveDate(value);
    if (!date) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  get canJumpToPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  private loadUsersPage(page: number, refreshCount = false): void {
    this.isLoading = true;
    this.loadError = null;

    const pageRequest = this.buildPageRequest(page);
    const totalCount$ = refreshCount
      ? this.userRepository.getUsersCount({
          searchField: this.selectedSearchField,
          searchText: this.searchText,
        })
      : null;

    const page$ = this.userRepository.getUsersPage(pageRequest);

    (totalCount$
      ? forkJoin({ pageResult: page$, totalCount: totalCount$ })
      : forkJoin({ pageResult: page$, totalCount: of(this.totalUserCount) }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pageResult, totalCount }) => {
          this.totalUserCount = totalCount;
          this.userCards = pageResult.items.map((user) => ({
            user,
            draftRole: user.role,
            draftIsActive: user.isActive,
            hasProfileImageError: false,
            isExpanded: false,
            isSaving: false,
            errorMessage: null,
            successMessage: null,
          } satisfies UserManagementCard));

          this.currentPage = page;
          this.hasNextPage = !!pageResult.lastVisible && this.endItemNumber < this.totalUserCount;

          if (pageResult.lastVisible && page < this.totalPages) {
            this.pageCursors.set(page + 1, pageResult.lastVisible);
          } else {
            this.pageCursors.delete(page + 1);
          }

          this.isLoading = false;
        },
        error: () => {
          this.userCards = [];
          this.totalUserCount = 0;
          this.hasNextPage = false;
          this.loadError = 'We could not load users from Firestore.';
          this.isLoading = false;
        },
      });
  }

  private buildPageRequest(page: number): IUserPageOptions {
    return {
      pageSize: this.pageSize,
      cursor: this.pageCursors.get(page) ?? null,
      searchField: this.selectedSearchField,
      searchText: this.searchText,
    };
  }

  private resetPagination(): void {
    this.currentPage = 1;
    this.totalUserCount = 0;
    this.hasNextPage = false;
    this.pageCursors.clear();
    this.pageCursors.set(1, null);
  }

  private resolveDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      const date = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  }
}