import { Component, DestroyRef, OnInit, ViewChild, inject, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AssessmentAnswerRepository } from '../../core/repository/assessment-answer-repository';
import { AssessmentOutcomeRepository } from '../../core/repository/assessment-outcome-repository';
import { TraitListOutcomeRepository } from '../../core/repository/trait-list-outcome-repository';
import { BigFiveOutcomeRepository } from '../../core/repository/big-five-outcome-repository';
import { TokenStorageService } from '../../core/service/token-storage.service';
import { IAssessmentAnswerModel } from '../../core/model/assessment-answer-model';
import { IAssessmentOutcomeModel, ITraitListOutcomeModel as ITraitListLayerOutcome, IBigFivePersonalityTraitOutcomeModel as IBigFiveLayerOutcome } from '../../core/model/assessment-outcome-model';
import { ITraitListOutcomesModel } from '../../core/model/trait-list-outcomes-model';
import { IBigFivePersonalityTraitOutcomeModel } from '../../core/model/big-five-outcomes-model';
import { AssessmentLayerType } from '../../core/enum/assessment-layer-type';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { TraitListOutcomeComponent } from './compoenents/trait-list-outcome/trait-list-outcome.component';
import { BigTraitOutcomeComponent } from './compoenents/big-trait-outcome/big-trait-outcome.component';

@Component({
  selector: 'app-assessment-result',
  templateUrl: './assessment-result.page.html',
  styleUrls: ['./assessment-result.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, RouterLink, CommonModule, FormsModule, TraitListOutcomeComponent, BigTraitOutcomeComponent]
})

export class AssessmentResultPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);
  private readonly assessmentAnswerRepository = inject(AssessmentAnswerRepository);
  private readonly assessmentOutcomeRepository = inject(AssessmentOutcomeRepository);
  private readonly traitListOutcomeRepository = inject(TraitListOutcomeRepository);
  private readonly bigFiveOutcomeRepository = inject(BigFiveOutcomeRepository);
  private readonly tokenStorageService = inject(TokenStorageService);
  readonly AssessmentLayerType = AssessmentLayerType;
  assessmentAnswer: IAssessmentAnswerModel | null = null;
  assessmentOutcome: IAssessmentOutcomeModel | null = null;
  traitListOutcome: ITraitListOutcomesModel | null = null;
  bigFiveOutcome: IBigFivePersonalityTraitOutcomeModel | null = null;
  bigFiveLayerOutcome: IBigFiveLayerOutcome | null = null;
  isLoading = true;
  loadError = '';
  activeTabIndex = 0;

  @ViewChild('resultContent', { static: false }) resultContent!: IonContent;

  constructor() {
    addIcons({ arrowBack });
  }

  scrollToLayer(index: number): void {
    this.activeTabIndex = index;
    const target = document.getElementById('layer-' + index);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onContentScroll(): void {
    const layerCount = this.assessmentOutcome?.layerOutcomes?.length ?? 0;
    if (layerCount === 0) return;

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < layerCount; i++) {
      const el = document.getElementById('layer-' + i);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    if (this.activeTabIndex !== closestIndex) {
      this.ngZone.run(() => {
        this.activeTabIndex = closestIndex;
      });
    }
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(params => {
        const assessmentId = params.get('id');
        const userId = this.tokenStorageService.getCurrentUserUid();
        if (!assessmentId || !userId) {
          this.loadError = 'Assessment or user not found.';
          this.isLoading = false;
          return;
        }
        this.isLoading = true;
        this.loadError = '';
        this.assessmentAnswerRepository.getAssessmentAnswersByUserIdAndAssessmentId(userId, assessmentId)
          .pipe(
            switchMap((answers: IAssessmentAnswerModel[]) => {
              this.assessmentAnswer = answers[0] ?? null;
              if (!this.assessmentAnswer?.id) {
                return of(null);
              }
              return this.assessmentOutcomeRepository.getAssessmentOutcomesByAnswerId(this.assessmentAnswer.id);
            }),
            switchMap((outcomes: IAssessmentOutcomeModel[] | null) => {
              this.assessmentOutcome = outcomes?.[0] ?? null;
              if (!this.assessmentOutcome) {
                return of([]);
              }
              const layerOutcomes = this.assessmentOutcome.layerOutcomes ?? [];
              const fetches: Record<string, Observable<any>> = {};

              for (const layer of layerOutcomes) {
                if (layer.layerType === AssessmentLayerType.TRAIT_LIST) {
                  const traitOutcome = layer.outcome as ITraitListLayerOutcome;
                  if (traitOutcome.traitListOutcomeId) {
                    fetches['traitList'] = this.traitListOutcomeRepository.getTraitListOutcomeById(traitOutcome.traitListOutcomeId);
                  }
                } else if (layer.layerType === AssessmentLayerType.BIG_FIVE_PERSONALITY_TRAIT) {
                  const bigFiveOutcome = layer.outcome as IBigFiveLayerOutcome;
                  this.bigFiveLayerOutcome = bigFiveOutcome;
                  if (bigFiveOutcome.bigFiveTraitOutcomeId) {
                    fetches['bigFive'] = this.bigFiveOutcomeRepository.getBigFiveOutcomeById(bigFiveOutcome.bigFiveTraitOutcomeId);
                  }
                }
              }

              if (Object.keys(fetches).length === 0) {
                return of({});
              }
              return forkJoin(fetches);
            }),
          )
          .subscribe({
            next: (results: any) => {
              if (results?.['traitList']) {
                this.traitListOutcome = results['traitList'] as ITraitListOutcomesModel;
              }
              if (results?.['bigFive']) {
                this.bigFiveOutcome = results['bigFive'] as IBigFivePersonalityTraitOutcomeModel;
              }
              this.isLoading = false;
            },
            error: () => {
              this.loadError = 'Failed to load assessment results.';
              this.isLoading = false;
            }
          });
      });
  }
}
