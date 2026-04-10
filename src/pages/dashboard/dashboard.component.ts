import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonProgressBar, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline, checkmarkCircleOutline, timeOutline,
  flashOutline, barChartOutline, calendarOutline,
  ribbonOutline, arrowForwardOutline, sparklesOutline, peopleOutline,
} from 'ionicons/icons';
import { forkJoin, of } from 'rxjs';

import { IAssessmentAnswerModel } from '../../core/model/assessment-answer-model';
import { IAssessmentModel } from '../../core/model/assessment-model';
import { UserRole } from '../../core/enum/user-role';
import { AssessmentAnswerRepository } from '../../core/repository/assessment-answer-repository';
import { AssessmentRepository } from '../../core/repository/assessment-repository';
import { DashboardRefreshService } from '../../core/service/dashboard-refresh.service';
import { TokenStorageService } from '../../core/service/token-storage.service';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend: 'up' | 'neutral';
}

interface RecentActivity {
  title: string;
  date: string;
  score: number;
  icon: string;
}

type AssessmentProgressState = 'new' | 'resume' | 'completed';

interface DashboardAssessmentCard {
  assessment: IAssessmentModel;
  status: AssessmentProgressState;
  answer?: IAssessmentAnswerModel;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [RouterLink, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonIcon, IonProgressBar, IonSpinner],
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  greeting = this.getGreeting();
  isAdmin = false;
  availableAssessments: DashboardAssessmentCard[] = [];
  completedAssessments: DashboardAssessmentCard[] = [];
  isAssessmentsLoading = true;

  stats: StatCard[] = [
    { label: 'Total Sessions',  value: '24',   sub: '+3 this week',    icon: 'flash-outline',             trend: 'up'     },
    { label: 'Avg. Score',      value: '78%',  sub: '+5% vs last week', icon: 'trending-up-outline',      trend: 'up'     },
    { label: 'Time Spent',      value: '6.4h', sub: 'Past 7 days',     icon: 'time-outline',              trend: 'neutral' },
    { label: 'Streak',          value: '5d',   sub: 'Keep it up!',     icon: 'ribbon-outline',            trend: 'up'     },
  ];

  skills = [
    { label: 'Logic',     progress: 0.82, color: '#50C878' },
    { label: 'Memory',    progress: 0.64, color: '#50C878' },
    { label: 'Focus',     progress: 0.71, color: '#50C878' },
    { label: 'Cognitive', progress: 0.55, color: '#50C878' },
  ];

  recentActivity: RecentActivity[] = [
    { title: 'Pattern Recognition', date: 'Today, 9:14 AM',       score: 91, icon: 'bar-chart-outline'         },
    { title: 'Working Memory Test', date: 'Yesterday, 4:30 PM',   score: 73, icon: 'checkmark-circle-outline'  },
    { title: 'Focus Challenge',     date: 'Apr 6, 11:00 AM',      score: 68, icon: 'calendar-outline'          },
    { title: 'Logic Puzzle',        date: 'Apr 5, 8:45 AM',       score: 85, icon: 'flash-outline'             },
  ];

  constructor(
    private readonly assessmentAnswerRepository: AssessmentAnswerRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly dashboardRefreshService: DashboardRefreshService,
    private readonly tokenStorageService: TokenStorageService,
  ) {
    addIcons({
      trendingUpOutline, checkmarkCircleOutline, timeOutline,
      flashOutline, barChartOutline, calendarOutline,
      ribbonOutline, arrowForwardOutline, sparklesOutline, peopleOutline,
    });
  }

  ngOnInit(): void {
    this.greeting = this.getGreeting();
    this.isAdmin = this.tokenStorageService.decodeToken()?.role === UserRole.ADMIN;
    this.loadAssessments();

    this.dashboardRefreshService.refreshRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.greeting = this.getGreeting();
        this.isAdmin = this.tokenStorageService.decodeToken()?.role === UserRole.ADMIN;
        this.loadAssessments();
      });
  }

  get hasCompletedAssessments(): boolean {
    return this.completedAssessments.length > 0;
  }

  getAssessmentChipLabel(status: AssessmentProgressState): string {
    switch (status) {
      case 'resume':
        return 'Resume';
      case 'completed':
        return 'Completed';
      default:
        return 'New';
    }
  }

  getAssessmentChipIcon(status: AssessmentProgressState): string {
    switch (status) {
      case 'resume':
        return 'time-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      default:
        return 'sparkles-outline';
    }
  }

  getAssessmentActionLabel(status: AssessmentProgressState): string {
    switch (status) {
      case 'resume':
        return 'Open';
      case 'completed':
        return 'View';
      default:
        return 'Start';
    }
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#50C878';
    if (score >= 60) return '#f4d47c';
    return '#e87070';
  }

  private loadAssessments(): void {
    const userId = this.tokenStorageService.getCurrentUserUid();
    this.isAssessmentsLoading = true;

    forkJoin({
      assessments: this.assessmentRepository.getEnabledAssessments(),
      answers: userId
        ? this.assessmentAnswerRepository.getAssessmentAnswersByUserId(userId)
        : of([]),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ assessments, answers }) => {
          const dashboardCards = this.buildAssessmentCards(assessments, answers);
          this.availableAssessments = dashboardCards.filter((card) => card.status !== 'completed');
          this.completedAssessments = dashboardCards.filter((card) => card.status === 'completed');
          this.isAssessmentsLoading = false;
        },
        error: () => {
          this.availableAssessments = [];
          this.completedAssessments = [];
          this.isAssessmentsLoading = false;
        },
      });
  }

  private getGreeting(date = new Date()): string {
    const hour = date.getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }

  private buildAssessmentCards(
    assessments: IAssessmentModel[],
    answers: IAssessmentAnswerModel[],
  ): DashboardAssessmentCard[] {
    const latestAnswersByAssessmentId = new Map<string, IAssessmentAnswerModel>();

    for (const answer of answers) {
      const existingAnswer = latestAnswersByAssessmentId.get(answer.assessmentId);
      if (!existingAnswer || this.getAnswerTimestamp(answer) > this.getAnswerTimestamp(existingAnswer)) {
        latestAnswersByAssessmentId.set(answer.assessmentId, answer);
      }
    }

    return assessments.map((assessment) => {
      const answer = assessment.id ? latestAnswersByAssessmentId.get(assessment.id) : undefined;
      return {
        assessment,
        answer,
        status: answer?.completed ? 'completed' : answer ? 'resume' : 'new',
      } satisfies DashboardAssessmentCard;
    });
  }

  private getAnswerTimestamp(answer: IAssessmentAnswerModel): number {
    return this.getDateValue(answer.completedAt)
      || this.getDateValue((answer as { updatedAt?: unknown }).updatedAt)
      || this.getDateValue((answer as { createdAt?: unknown }).createdAt)
      || 0;
  }

  private getDateValue(value: unknown): number {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }
}
