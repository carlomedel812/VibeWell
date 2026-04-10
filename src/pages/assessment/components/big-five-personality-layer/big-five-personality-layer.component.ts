import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonSpinner } from '@ionic/angular/standalone';

import { IAssessmentLayerModel } from '../../../../core/model/assessment-layer-model';
import {
  IAssessmentLayerAnswerBigFivePersonalityModel,
  IAssessmentLayerAnswerBigFivePersonalityOption,
} from '../../../../core/model/assessment-answer-model';
import { IBigFivePersonalityQuestionModel } from '../../../../core/model/big-five-personality-question';
import { BigFivePersonalityQuestionRepository } from '../../../../core/repository/big-five-personality-question-repository';

type AssessmentLayerRecord = IAssessmentLayerModel & { id?: string };

@Component({
  selector: 'app-big-five-personality-layer',
  standalone: true,
  templateUrl: './big-five-personality-layer.component.html',
  styleUrls: ['./big-five-personality-layer.component.scss'],
  imports: [IonSpinner],
})
export class BigFivePersonalityLayerComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) layer!: AssessmentLayerRecord;
  @Input() initialSelectedOptions: IAssessmentLayerAnswerBigFivePersonalityOption[] = [];
  @Input() displayTitle = 'Layer';
  @Input() layerTypeLabel = 'Big Five Personality Trait';
  @Output() back = new EventEmitter<void>();
  @Output() answerChange = new EventEmitter<IAssessmentLayerAnswerBigFivePersonalityModel>();
  @Output() next = new EventEmitter<IAssessmentLayerAnswerBigFivePersonalityModel>();

  readonly scaleOptions = [1, 2, 3, 4, 5];

  questions: IBigFivePersonalityQuestionModel[] = [];
  questionResponses = new Map<number, number>();
  currentQuestionIndex = 0;
  isLoading = false;
  loadError = '';

  constructor(private readonly bigFivePersonalityQuestionRepository: BigFivePersonalityQuestionRepository) {}

  get totalQuestions(): number {
    return this.questions.length;
  }

  get currentQuestionNumber(): number {
    return this.totalQuestions === 0 ? 0 : this.currentQuestionIndex + 1;
  }

  get currentQuestion(): IBigFivePersonalityQuestionModel | null {
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  get selectedScaleValue(): number | null {
    return this.questionResponses.get(this.currentQuestionIndex) ?? null;
  }

  get canGoPrevious(): boolean {
    return this.currentQuestionIndex > 0;
  }

  get canGoNext(): boolean {
    return this.selectedScaleValue !== null;
  }

  get hasSelectedScale(): boolean {
    return this.selectedScaleValue !== null;
  }

  get nextButtonLabel(): string {
    return this.isLastQuestion ? 'Finish Layer' : 'Next Question';
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex >= this.totalQuestions - 1;
  }

  get selectedProgressWidth(): number {
    if (this.selectedScaleValue === null) {
      return 0;
    }

    return ((this.selectedScaleValue - 1) / (this.scaleOptions.length - 1)) * 100;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['layer']?.currentValue) {
      this.loadQuestions();
      return;
    }

    if (changes['initialSelectedOptions']) {
      this.applyInitialSelections();
    }
  }

  selectScaleValue(value: number): void {
    this.questionResponses.set(this.currentQuestionIndex, value);
    this.questionResponses = new Map(this.questionResponses);
  }

  onBack(): void {
    if (this.canGoPrevious) {
      this.currentQuestionIndex -= 1;
      return;
    }

    this.back.emit();
  }

  onNext(): void {
    if (!this.canGoNext) {
      return;
    }

    const answerPayload = this.buildAnswerPayload();

    if (this.isLastQuestion) {
      this.next.emit(answerPayload);
      return;
    }

    this.answerChange.emit(answerPayload);
    this.currentQuestionIndex += 1;
  }

  trackScaleOption(_: number, option: number): number {
    return option;
  }

  private loadQuestions(): void {
    this.questions = [];
    this.questionResponses = new Map<number, number>();
    this.currentQuestionIndex = 0;
    this.loadError = '';

    const layerId = this.layer?.id;
    if (!layerId) {
      this.isLoading = false;
      this.loadError = 'Unable to load this question set right now.';
      return;
    }

    this.isLoading = true;
    this.bigFivePersonalityQuestionRepository.getBigFivePersonalityQuestionsByLayerId(layerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.questions = [...questions];
          this.applyInitialSelections();
          this.isLoading = false;
          this.loadError = questions.length === 0 ? 'No questions are configured for this layer yet.' : '';
        },
        error: (error) => {
          console.log('Error loading Big Five questions:', error);
          this.questions = [];
          this.isLoading = false;
          this.loadError = 'Unable to load this question set right now.';
        },
      });
  }

  private applyInitialSelections(): void {
    const nextResponses = new Map<number, number>();

    this.questions.forEach((question, index) => {
      const questionId = question.id;
      if (!questionId) {
        return;
      }

      const savedOption = this.initialSelectedOptions.find((option) => option.questionId === questionId);
      if (savedOption) {
        nextResponses.set(index, savedOption.score);
      }
    });

    this.questionResponses = nextResponses;

    const firstUnansweredIndex = this.questions.findIndex((_, index) => !this.questionResponses.has(index));
    this.currentQuestionIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
  }

  private buildAnswerPayload(): IAssessmentLayerAnswerBigFivePersonalityModel {
    return {
      selectedOption: this.questions
        .map((question, index) => {
          const score = this.questionResponses.get(index);
          if (!question.id || score === undefined) {
            return null;
          }

          return {
            questionId: question.id,
            score,
          } satisfies IAssessmentLayerAnswerBigFivePersonalityOption;
        })
        .filter((option): option is IAssessmentLayerAnswerBigFivePersonalityOption => option !== null),
    };
  }
}
