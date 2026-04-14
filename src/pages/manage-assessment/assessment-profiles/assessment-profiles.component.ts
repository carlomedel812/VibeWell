import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  timeOutline,
  removeCircleOutline,
  eyeOutline,
} from 'ionicons/icons';
import { forkJoin, of, switchMap } from 'rxjs';

import { IUserModel } from '../../../core/model/user-model';
import { IAssessmentAnswerModel } from '../../../core/model/assessment-answer-model';
import { IAssessmentModel } from '../../../core/model/assessment-model';
import { UserRepository } from '../../../core/repository/user-repository';
import { AssessmentAnswerRepository } from '../../../core/repository/assessment-answer-repository';
import { AssessmentRepository } from '../../../core/repository/assessment-repository';

type ProfileStatus = 'completed' | 'in-progress' | 'not-taken';

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
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonIcon,
  ],
})
export class AssessmentProfilesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly userRepository = inject(UserRepository);
  private readonly assessmentAnswerRepository = inject(AssessmentAnswerRepository);
  private readonly assessmentRepository = inject(AssessmentRepository);

  assessmentId = '';
  assessment: IAssessmentModel | null = null;
  userProfiles: UserProfileRow[] = [];
  isLoading = true;
  isLoadingMore = false;
  loadError = '';
  hasMore = true;

  private readonly pageSize = 10;
  private lastCursor: QueryDocumentSnapshot<DocumentData> | null = null;
  private allAnswers: IAssessmentAnswerModel[] = [];

  constructor() {
    addIcons({ checkmarkCircleOutline, timeOutline, removeCircleOutline, eyeOutline });
  }

  ngOnInit(): void {
    this.assessmentId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.assessmentId) {
      this.loadError = 'Assessment ID not found.';
      this.isLoading = false;
      return;
    }

    // Fetch assessment details + all answers for this assessment, then load first page of users
    forkJoin({
      assessment: this.assessmentRepository.getAssessmentById(this.assessmentId),
      answers: this.assessmentAnswerRepository.getAssessmentAnswersByAssessmentId(this.assessmentId),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({ assessment, answers }) => {
          this.assessment = assessment ?? null;
          this.allAnswers = answers;
          return this.userRepository.getUsersPage({ pageSize: this.pageSize });
        }),
      )
      .subscribe({
        next: (page) => {
          this.userProfiles = page.items.map((user) => this.buildRow(user));
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
    this.userRepository
      .getUsersPage({ pageSize: this.pageSize, cursor: this.lastCursor })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.userProfiles.push(...page.items.map((user) => this.buildRow(user)));
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
}
