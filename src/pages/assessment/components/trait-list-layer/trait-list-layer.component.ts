import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';

import { IAssessmentLayerModel } from '../../../../core/model/assessment-layer-model';
import { IAssessmentLayerAnswerTraitListModel } from '../../../../core/model/assessment-answer-model';
import { ITraitListAdjectiveModel } from '../../../../core/model/trait-list-adjective-model';
import { ITraitListConfigModel } from '../../../../core/model/trait-list-config-model';
import { TraitListAdjectiveRepository } from '../../../../core/repository/trait-list-adjective-repository';

type AssessmentLayerRecord = IAssessmentLayerModel & { id?: string };

@Component({
  selector: 'app-trait-list-layer',
  standalone: true,
  templateUrl: './trait-list-layer.component.html',
  styleUrls: ['./trait-list-layer.component.scss'],
  imports: [IonIcon, IonSpinner],
})
export class TraitListLayerComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) layer!: AssessmentLayerRecord;
  @Input() initialSelectedTraits: ITraitListAdjectiveModel[] = [];
  @Input() displayTitle = 'Layer';
  @Output() back = new EventEmitter<void>();
  @Output() answerChange = new EventEmitter<IAssessmentLayerAnswerTraitListModel>();
  @Output() next = new EventEmitter<IAssessmentLayerAnswerTraitListModel>();

  traitListOptions: ITraitListAdjectiveModel[] = [];
  selectedTraitIds = new Set<string>();
  isLoading = false;
  loadError = '';

  constructor(private readonly traitListAdjectiveRepository: TraitListAdjectiveRepository) {
    addIcons({ arrowForwardOutline });
  }

  get config(): ITraitListConfigModel {
    return this.layer.config as ITraitListConfigModel;
  }

  get selectedTraitCount(): number {
    return this.selectedTraitIds.size;
  }

  get selectionTarget(): number {
    return this.config?.selectionCount ?? 0;
  }

  get canProceed(): boolean {
    return this.selectionTarget > 0 && this.selectedTraitCount === this.selectionTarget;
  }

  get displayLayerNumber(): number {
    const parsedLayer = Number(this.layer?.layer);
    return Number.isFinite(parsedLayer) && parsedLayer > 0 ? parsedLayer : 1;
  }

  canSelectMore(option: ITraitListAdjectiveModel): boolean {
    if (this.isTraitSelected(option)) {
      return true;
    }

    if (this.selectionTarget <= 0) {
      return true;
    }

    return this.selectedTraitCount < this.selectionTarget;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['layer']?.currentValue) {
      this.loadTraitOptions();
      return;
    }

    if (changes['initialSelectedTraits']) {
      this.applyInitialSelections();
    }
  }

  toggleTraitSelection(option: ITraitListAdjectiveModel): void {
    const nextSelections = new Set(this.selectedTraitIds);
    const selectionKey = this.getOptionKey(option);

    if (nextSelections.has(selectionKey)) {
      nextSelections.delete(selectionKey);
    } else {
      if (!this.canSelectMore(option)) {
        return;
      }

      nextSelections.add(selectionKey);
    }

    this.selectedTraitIds = nextSelections;
    this.answerChange.emit(this.buildAnswerPayload());
  }

  isTraitSelected(option: ITraitListAdjectiveModel): boolean {
    return this.selectedTraitIds.has(this.getOptionKey(option));
  }

  onBack(): void {
    this.back.emit();
  }

  onNext(): void {
    if (!this.canProceed) {
      return;
    }

    this.next.emit(this.buildAnswerPayload());
  }

  private loadTraitOptions(): void {
    this.traitListOptions = [];
    this.selectedTraitIds = new Set<string>();
    this.loadError = '';

    const layerId = this.layer?.id;
    if (!layerId) {
      this.isLoading = false;
      this.loadError = 'Unable to load this layer choices right now.';
      return;
    }

    this.isLoading = true;
    this.traitListAdjectiveRepository.getTraitListAdjectivesByLayerId(layerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.traitListOptions = [...options].sort((left, right) => left.adjective.localeCompare(right.adjective));
          this.applyInitialSelections();
          this.isLoading = false;
        },
        error: (error) => {
          console.log('Error loading layer choices:', error);
          this.traitListOptions = [];
          this.isLoading = false;
          this.loadError = 'Unable to load this layer choices right now.';
        },
      });
  }

  private applyInitialSelections(): void {
    if (this.traitListOptions.length === 0) {
      return;
    }

    const nextSelections = new Set(
      this.initialSelectedTraits
        .map((trait) => this.getOptionKey(trait))
        .filter((selectionKey) => !!selectionKey),
    );

    this.selectedTraitIds = nextSelections;
  }

  private buildAnswerPayload(): IAssessmentLayerAnswerTraitListModel {
    return {
      selectedTraits: this.traitListOptions.filter((option) => this.selectedTraitIds.has(this.getOptionKey(option))),
    };
  }

  private getOptionKey(option: ITraitListAdjectiveModel): string {
    return option.id || option.adjective;
  }
}
