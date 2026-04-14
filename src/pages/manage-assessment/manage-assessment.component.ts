import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from '@ionic/angular/standalone';

import { IAssessmentModel } from '../../core/model/assessment-model';
import { AssessmentRepository } from '../../core/repository/assessment-repository';

@Component({
  selector: 'app-manage-assessment',
  standalone: true,
  templateUrl: './manage-assessment.component.html',
  styleUrls: ['./manage-assessment.component.scss'],
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
  ],
})
export class ManageAssessmentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly assessmentRepository = inject(AssessmentRepository);

  assessments: IAssessmentModel[] = [];
  isLoading = true;
  loadError = '';

  toggleStatus(assessment: IAssessmentModel): void {
    const newEnabled = !assessment.enabled;
    assessment.enabled = newEnabled;
    this.assessmentRepository.updateAssessment(assessment.id, { enabled: newEnabled });
  }

  ngOnInit(): void {
    this.assessmentRepository.getAllAssessments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assessments) => {
          this.assessments = assessments;
          this.isLoading = false;
        },
        error: () => {
          this.loadError = 'Failed to load assessments.';
          this.isLoading = false;
        },
      });
  }
}
