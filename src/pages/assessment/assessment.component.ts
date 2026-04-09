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
import { forkJoin, of, switchMap } from 'rxjs';

import { IAssessmentModel } from '../../core/model/assessment-model';
import { IAssessmentLayerModel } from '../../core/model/assessment-layer-model';
import { AssessmentLayerType } from '../../core/enum/assessment-layer-type';
import { AssessmentLayerRepository } from '../../core/repository/assessment-layer-repository';
import { AssessmentRepository } from '../../core/repository/assessment-repository';
import { DateValue, formatDate } from '../../core/utils/date.util';
import { BigFivePersonalityLayerComponent } from './components/big-five-personality-layer/big-five-personality-layer.component';
import { TraitListLayerComponent } from './components/trait-list-layer/trait-list-layer.component';

type LayerViewState = 'intro' | 'question' | 'complete';
type AssessmentLayerRecord = IAssessmentLayerModel & { id?: string };

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
  activeLayer: AssessmentLayerRecord | null = null;
  layerView: LayerViewState = 'intro';
  isLoading = true;
  loadError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
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

  get isLastLayer(): boolean {
    return this.getActiveLayerIndex() >= this.assessmentLayers.length - 1;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const assessmentId = params.get('id');

          if (!assessmentId) {
            this.resetAssessmentState('Assessment not found.');
            return of(undefined);
          }

          this.isLoading = true;
          this.loadError = '';
          return forkJoin({
            assessment: this.assessmentRepository.getAssessmentById(assessmentId),
            layers: this.assessmentLayerRepository.getAssessmentLayersByAssessmentId(assessmentId),
          });
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.resetAssessmentState('Assessment not found.');
            return;
          }

          this.assessment = result.assessment ?? null;
          this.assessmentLayers = (result.layers ?? []) as AssessmentLayerRecord[];
          this.activeLayer = this.assessmentLayers[0] ?? null;
          this.layerView = 'intro';
          this.isLoading = false;
          this.loadError = result.assessment ? '' : 'Assessment not found.';
        },
        error: (error) => {
          console.log('Error loading assessment:', error);
          this.resetAssessmentState('Unable to load this assessment right now.');
        },
      });
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

    return this.assessmentLayers.findIndex((layer) => layer.layer === this.activeLayer?.layer);
  }

  private resetAssessmentState(message: string): void {
    this.assessment = null;
    this.assessmentLayers = [];
    this.activeLayer = null;
    this.isLoading = false;
    this.loadError = message;
    this.layerView = 'intro';
  }
}
