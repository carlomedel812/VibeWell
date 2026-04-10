import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  imageOutline,
  listOutline,
  sparklesOutline,
  timeOutline,
} from 'ionicons/icons';
import { forkJoin, from, map, of, switchMap } from 'rxjs';

import {
  IAssessmentAnswerModel,
  IAssessmentLayerAnswerBigFivePersonalityModel,
  IAssessmentLayerAnswerModel,
  IAssessmentLayerAnswerTraitListModel,
} from '../../core/model/assessment-answer-model';
import { IAssessmentModel } from '../../core/model/assessment-model';
import { IAssessmentLayerModel } from '../../core/model/assessment-layer-model';
import { AssessmentLayerType } from '../../core/enum/assessment-layer-type';
import { AssessmentAnswerRepository } from '../../core/repository/assessment-answer-repository';
import { AssessmentLayerRepository } from '../../core/repository/assessment-layer-repository';
import { AssessmentRepository } from '../../core/repository/assessment-repository';
import { DashboardRefreshService } from '../../core/service/dashboard-refresh.service';
import { TokenStorageService } from '../../core/service/token-storage.service';
import { DateValue, formatDate } from '../../core/utils/date.util';
import { BigFivePersonalityLayerComponent } from './components/big-five-personality-layer/big-five-personality-layer.component';
import { TraitListLayerComponent } from './components/trait-list-layer/trait-list-layer.component';

type LayerViewState = 'intro' | 'question' | 'complete';
type AssessmentLayerRecord = IAssessmentLayerModel;

@Component({
  selector: 'app-assessment',
  standalone: true,
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.scss'],
  imports: [
    RouterLink,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
    BigFivePersonalityLayerComponent,
    TraitListLayerComponent,
  ],
})
export class AssessmentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly assessmentLayerType = AssessmentLayerType;

  assessment: IAssessmentModel | null = null;
  assessmentLayers: AssessmentLayerRecord[] = [];
  currentAssessmentAnswer: IAssessmentAnswerModel | null = null;
  activeLayer: AssessmentLayerRecord | null = null;
  layerView: LayerViewState = 'intro';
  isLoading = true;
  loadError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly assessmentAnswerRepository: AssessmentAnswerRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly dashboardRefreshService: DashboardRefreshService,
    private readonly tokenStorageService: TokenStorageService,
  ) {
    addIcons({
      arrowForwardOutline,
      calendarOutline,
      checkmarkCircleOutline,
      imageOutline,
      listOutline,
      sparklesOutline,
      timeOutline,
    });
  }

  get heroBackground(): string {
    if (!this.assessment?.thumbnailUrl) {
      return 'linear-gradient(135deg, rgba(26, 58, 40, 0.72), rgba(19, 25, 32, 0.98))';
    }

    return `linear-gradient(135deg, rgba(13, 17, 23, 0.24) 0%, rgba(13, 17, 23, 0.88) 72%, rgba(13, 17, 23, 0.98) 100%), url(${this.assessment.thumbnailUrl})`;
  }

  get activeLayerImage(): string | null {
    return this.activeLayer?.imageUrl || this.assessment?.thumbnailUrl || null;
  }

  get activeLayerTitle(): string {
    if (!this.activeLayer) {
      return 'Assessment Layer';
    }

    return this.activeLayer.title || `Layer ${this.displayActiveLayerNumber}`;
  }

  get displayActiveLayerNumber(): number {
    if (!this.activeLayer) {
      return 1;
    }

    const parsedLayer = Number(this.activeLayer.layer);
    if (Number.isFinite(parsedLayer) && parsedLayer > 0) {
      return parsedLayer;
    }

    const activeLayerIndex = this.getActiveLayerIndex();
    return activeLayerIndex >= 0 ? activeLayerIndex + 1 : 1;
  }

  get canStartLayer(): boolean {
    return !!this.activeLayer;
  }

  get startLayerButtonLabel(): string {
    return this.hasSavedProgressForActiveLayer() ? 'Resume Assessment' : 'Start Assessment';
  }

  get layerIntroDescription(): string {
    if (this.activeLayer?.description) {
      return this.activeLayer.description;
    }

    return this.hasSavedProgressForActiveLayer()
      ? 'Continue where you left off and pick up this assessment layer from your saved progress.'
      : 'Prepare to step into the first signal layer of your assessment.';
  }

  get isLastLayer(): boolean {
    return this.getActiveLayerIndex() >= this.assessmentLayers.length - 1;
  }

  get activeTraitListAnswer(): IAssessmentLayerAnswerTraitListModel | null {
    const layerAnswer = this.getLayerAnswer(this.activeLayer);
    if (!layerAnswer || layerAnswer.type !== AssessmentLayerType.TRAIT_LIST) {
      return null;
    }

    return layerAnswer.answer as IAssessmentLayerAnswerTraitListModel;
  }

  get activeBigFiveAnswer(): IAssessmentLayerAnswerBigFivePersonalityModel | null {
    const layerAnswer = this.getLayerAnswer(this.activeLayer);
    if (!layerAnswer || layerAnswer.type !== AssessmentLayerType.BIG_FIVE_PERSONALITY_TRAIT) {
      return null;
    }

    return layerAnswer.answer as IAssessmentLayerAnswerBigFivePersonalityModel;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const assessmentId = params.get('id');
          const userId = this.tokenStorageService.getCurrentUserUid();

          if (!assessmentId || !userId) {
            this.resetAssessmentState('Assessment not found.');
            return of(undefined);
          }

          this.isLoading = true;
          this.loadError = '';
          return forkJoin({
            answers: this.assessmentAnswerRepository.getAssessmentAnswersByUserIdAndAssessmentId(userId, assessmentId),
            assessment: this.assessmentRepository.getAssessmentById(assessmentId),
            layers: this.assessmentLayerRepository.getAssessmentLayersByAssessmentId(assessmentId),
          }).pipe(
            switchMap((result) => {
              const existingAnswer = result.answers[0];
              if (existingAnswer) {
                return of({
                  assessment: result.assessment,
                  assessmentAnswer: existingAnswer,
                  layers: result.layers,
                });
              }

              const newAnswer: Omit<IAssessmentAnswerModel, 'id'> = {
                userId,
                assessmentId,
                completed: false,
                layerAnswers: [],
              };

              return from(this.assessmentAnswerRepository.createAssessmentAnswer(newAnswer)).pipe(
                switchMap((answerId) => this.assessmentAnswerRepository.getAssessmentAnswerById(answerId)),
                map((assessmentAnswer) => ({
                  assessment: result.assessment,
                  assessmentAnswer: assessmentAnswer ?? { ...newAnswer, id: undefined },
                  layers: result.layers,
                })),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.resetAssessmentState('Assessment not found.');
            return;
          }

          this.assessment = result.assessment ?? null;
          this.assessmentLayers = result.layers ?? [];
          this.currentAssessmentAnswer = result.assessmentAnswer ?? null;
          this.configureAssessmentState();
          this.isLoading = false;
          this.loadError = result.assessment ? '' : 'Assessment not found.';
        },
        error: (error) => {
          console.log('Error loading assessment:', error);
          this.resetAssessmentState('Unable to load this assessment right now.');
        },
      });
  }

  ionViewDidLeave(): void {
    this.dashboardRefreshService.requestRefresh();
  }

  formatDate(value?: DateValue): string {
    return formatDate(value);
  }

  formatLayerType(type: IAssessmentLayerModel['type']): string {
    return String(type)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match: string) => match.toUpperCase());
  }

  startLayer(): void {
    if (!this.canStartLayer) {
      return;
    }

    this.layerView = 'question';
  }

  backToLayerIntro(): void {
    this.layerView = 'intro';
  }

  goToNextLayer(): void {
    const nextLayerIndex = this.getActiveLayerIndex() + 1;
    const nextLayer = this.assessmentLayers[nextLayerIndex] ?? null;

    if (nextLayer) {
      this.activeLayer = nextLayer;
      this.layerView = 'intro';
      return;
    }

    this.layerView = 'complete';
  }

  onTraitListAnswerChange(answer: IAssessmentLayerAnswerTraitListModel): void {
    void this.persistCurrentLayerAnswer(answer, false);
  }

  onTraitListNext(answer: IAssessmentLayerAnswerTraitListModel): void {
    void this.completeCurrentLayer(answer);
  }

  onBigFiveAnswerChange(answer: IAssessmentLayerAnswerBigFivePersonalityModel): void {
    void this.persistCurrentLayerAnswer(answer, false);
  }

  onBigFiveNext(answer: IAssessmentLayerAnswerBigFivePersonalityModel): void {
    void this.completeCurrentLayer(answer);
  }

  restartCurrentLayer(): void {
    if (!this.activeLayer) {
      return;
    }

    this.layerView = 'intro';
  }

  private getActiveLayerIndex(): number {
    if (!this.activeLayer) {
      return -1;
    }

    return this.assessmentLayers.findIndex((layer) => layer.id === this.activeLayer?.id);
  }

  private configureAssessmentState(): void {
    if (this.assessmentLayers.length === 0) {
      this.activeLayer = null;
      this.layerView = 'intro';
      return;
    }

    if (this.currentAssessmentAnswer?.completed) {
      this.activeLayer = this.assessmentLayers[this.assessmentLayers.length - 1] ?? null;
      this.layerView = 'complete';
      return;
    }

    const nextLayerToResume = this.findNextIncompleteLayer();
    this.activeLayer = nextLayerToResume ?? this.assessmentLayers[0] ?? null;
    this.layerView = 'intro';
  }

  private findNextIncompleteLayer(): AssessmentLayerRecord | null {
    for (const layer of this.assessmentLayers) {
      const layerAnswer = this.getLayerAnswer(layer);
      if (!layerAnswer || !layerAnswer.completed) {
        return layer;
      }
    }

    return null;
  }

  private getLayerAnswer(layer: AssessmentLayerRecord | null): IAssessmentLayerAnswerModel | null {
    if (!layer) {
      return null;
    }

    return this.currentAssessmentAnswer?.layerAnswers.find((layerAnswer) => this.matchesLayerAnswer(layerAnswer, layer)) ?? null;
  }

  private hasSavedProgressForActiveLayer(): boolean {
    const layerAnswer = this.getLayerAnswer(this.activeLayer);
    if (!layerAnswer) {
      return false;
    }

    if (layerAnswer.completed) {
      return true;
    }

    if (layerAnswer.type === AssessmentLayerType.TRAIT_LIST) {
      const traitListAnswer = layerAnswer.answer as Partial<IAssessmentLayerAnswerTraitListModel> | null;
      return Array.isArray(traitListAnswer?.selectedTraits)
        ? traitListAnswer.selectedTraits.length > 0
        : true;
    }

    if (layerAnswer.type === AssessmentLayerType.BIG_FIVE_PERSONALITY_TRAIT) {
      const bigFiveAnswer = layerAnswer.answer as Partial<IAssessmentLayerAnswerBigFivePersonalityModel> | null;
      return Array.isArray(bigFiveAnswer?.selectedOption)
        ? bigFiveAnswer.selectedOption.length > 0
        : true;
    }

    return true;
  }

  private async completeCurrentLayer(
    answer: IAssessmentLayerAnswerTraitListModel | IAssessmentLayerAnswerBigFivePersonalityModel,
  ): Promise<void> {
    const updatedAssessmentAnswer = await this.persistCurrentLayerAnswer(answer, true);
    if (!updatedAssessmentAnswer) {
      return;
    }

    if (updatedAssessmentAnswer.completed) {
      this.layerView = 'complete';
      return;
    }

    this.goToNextLayer();
  }

  private async persistCurrentLayerAnswer(
    answer: IAssessmentLayerAnswerTraitListModel | IAssessmentLayerAnswerBigFivePersonalityModel,
    completed: boolean,
  ): Promise<IAssessmentAnswerModel | null> {
    if (!this.currentAssessmentAnswer?.id || !this.activeLayer?.id) {
      return null;
    }

    const existingLayerAnswer = this.getLayerAnswer(this.activeLayer);
    const updatedLayerAnswer: IAssessmentLayerAnswerModel = {
      layerId: this.activeLayer.id,
      type: this.activeLayer.type,
      completed,
      completedAt: completed ? new Date() : existingLayerAnswer?.completedAt,
      answer,
    };

    const layerAnswers = this.currentAssessmentAnswer.layerAnswers.filter(
      (layerAnswer) => !this.matchesLayerAnswer(layerAnswer, this.activeLayer),
    );
    layerAnswers.push(updatedLayerAnswer);

    const isAssessmentComplete = this.assessmentLayers.every((layer) => {
      return layerAnswers.some((layerAnswer) => this.matchesLayerAnswer(layerAnswer, layer) && layerAnswer.completed);
    });

    const updates: Partial<IAssessmentAnswerModel> = {
      completed: isAssessmentComplete,
      completedAt: isAssessmentComplete ? new Date() : this.currentAssessmentAnswer.completedAt,
      layerAnswers,
    };

    await this.assessmentAnswerRepository.updateAssessmentAnswer(this.currentAssessmentAnswer.id, updates);

    this.currentAssessmentAnswer = {
      ...this.currentAssessmentAnswer,
      ...updates,
    };

    return this.currentAssessmentAnswer;
  }

  private resetAssessmentState(message: string): void {
    this.assessment = null;
    this.currentAssessmentAnswer = null;
    this.assessmentLayers = [];
    this.activeLayer = null;
    this.isLoading = false;
    this.loadError = message;
    this.layerView = 'intro';
  }

  private matchesLayerAnswer(layerAnswer: IAssessmentLayerAnswerModel, layer: AssessmentLayerRecord | null): boolean {
    if (!layer) {
      return false;
    }

    const answerLayerId = String(layerAnswer.layerId);
    const layerDocumentId = layer.id ? String(layer.id) : '';
    const layerNumber = String(layer.layer);

    return answerLayerId === layerDocumentId || answerLayerId === layerNumber;
  }
}
