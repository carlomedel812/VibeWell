import { Component, DestroyRef, OnInit, ViewChild, inject, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AssessmentAnswerRepository } from '../../core/repository/assessment-answer-repository';
import { UserRepository } from '../../core/repository/user-repository';
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
import { Observable, forkJoin, from, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { TraitListOutcomeComponent } from './compoenents/trait-list-outcome/trait-list-outcome.component';
import { BigTraitOutcomeComponent } from './compoenents/big-trait-outcome/big-trait-outcome.component';
import { AssessmentOutcomeGeneratorService } from '../../core/service/assessment-score-generator.service';
import { AssessmentPdfService } from '../../core/service/assessment-pdf.service';
import { MatchingService, ArchLite, Band } from '../../core/service/matching.service';
import { GdriveImgPipe } from '../../core/utils/gdrive-img.pipe';
import { downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-assessment-result',
  templateUrl: './assessment-result.page.html',
  styleUrls: ['./assessment-result.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, RouterLink, CommonModule, FormsModule, GdriveImgPipe, TraitListOutcomeComponent, BigTraitOutcomeComponent]
})

export class AssessmentResultPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly assessmentAnswerRepository = inject(AssessmentAnswerRepository);
  private readonly assessmentOutcomeRepository = inject(AssessmentOutcomeRepository);
  private readonly traitListOutcomeRepository = inject(TraitListOutcomeRepository);
  private readonly bigFiveOutcomeRepository = inject(BigFiveOutcomeRepository);
  private readonly tokenStorageService = inject(TokenStorageService);
  private readonly assessmentOutcomeGeneratorService = inject(AssessmentOutcomeGeneratorService);
  private readonly assessmentPdfService = inject(AssessmentPdfService);
  private readonly userRepository = inject(UserRepository);
  private readonly matchService = inject(MatchingService);
  readonly AssessmentLayerType = AssessmentLayerType;
  assessmentAnswer: IAssessmentAnswerModel | null = null;
  assessmentOutcome: IAssessmentOutcomeModel | null = null;
  traitListOutcome: ITraitListOutcomesModel | null = null;
  bigFiveOutcome: IBigFivePersonalityTraitOutcomeModel | null = null;
  bigFiveLayerOutcome: IBigFiveLayerOutcome | null = null;
  isLoading = true;
  loadError = '';
  activeTabIndex = 0;

  // --- Matches tab ---
  readonly match = this.matchService;
  allArches: ArchLite[] = [];
  matchRole: 'client' | 'assistant' = 'client';
  matches: { a: ArchLite; band: Band; reason: string }[] = [];
  matchBandFilter: Band | 'all' = 'all';

  @ViewChild('resultContent', { static: false }) resultContent!: IonContent;

  constructor() {
    addIcons({ arrowBack, downloadOutline });
  }

  downloadPdf(): void {
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const buildName = (firstName: string, lastName: string) =>
      `${capitalize(firstName)} ${capitalize(lastName)}`.trim();

    const userIdFromParam = this.route.snapshot.queryParamMap.get('userId');
    if (userIdFromParam) {
      this.userRepository.getUserById(userIdFromParam).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(user => {
        const userName = user ? buildName(user.firstName, user.lastName) : undefined;
        this.assessmentPdfService.generate(this.traitListOutcome, this.bigFiveOutcome, this.bigFiveLayerOutcome, userName);
      });
    } else {
      const tokenUser = this.tokenStorageService.decodeToken();
      const userName = tokenUser ? buildName(tokenUser.firstName, tokenUser.lastName) : undefined;
      this.assessmentPdfService.generate(this.traitListOutcome, this.bigFiveOutcome, this.bigFiveLayerOutcome, userName);
    }
  }

  goBack(): void {    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref === 'admin') {
      this.location.back();
    } else {
      this.router.navigate(['/home/dashboard']);
    }
  }

  scrollToLayer(index: number): void {
    this.activeTabIndex = index;
    const target = document.getElementById('layer-' + index);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onContentScroll(): void {
    const ids = this.sectionIds();
    if (ids.length === 0) return;

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
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

  // --- Matches tab ---
  /** Ordered list of scrollable section element ids (layers, then Matches). */
  sectionIds(): string[] {
    const n = this.assessmentOutcome?.layerOutcomes?.length ?? 0;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) ids.push('layer-' + i);
    if (this.showMatches) ids.push('section-matches');
    return ids;
  }
  get matchesTabIndex(): number { return this.assessmentOutcome?.layerOutcomes?.length ?? 0; }
  get showMatches(): boolean { return !!this.me && this.allArches.length > 0; }
  get me(): ArchLite | null {
    const t = this.traitListOutcome;
    if (!t || !t.primaryTrait) return null;
    return {
      name: t.archetypeName,
      p: t.primaryTrait as unknown as string,
      s: (t.secondaryTrait as unknown as string) || 'NONE',
      imageUrl: t.animalPictureUrl || '',
    };
  }
  scrollToMatches(): void {
    this.activeTabIndex = this.matchesTabIndex;
    document.getElementById('section-matches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setMatchRole(role: 'client' | 'assistant'): void {
    if (this.matchRole === role) return;
    this.matchRole = role;
    this.computeMatches();
  }
  computeMatches(): void {
    const me = this.me;
    this.matchBandFilter = 'all';
    if (!me || this.allArches.length === 0) { this.matches = []; return; }
    this.matches = this.match.rank(me, this.allArches, this.matchRole === 'client');
  }
  get matchCounts(): Record<string, number> {
    const c: Record<string, number> = { ideal: 0, strong: 0, workable: 0, friction: 0 };
    for (const r of this.matches) c[r.band]++;
    return c;
  }
  get filteredMatches(): { a: ArchLite; band: Band; reason: string }[] {
    return this.matchBandFilter === 'all'
      ? this.matches
      : this.matches.filter((r) => r.band === this.matchBandFilter);
  }
  setMatchBand(b: Band): void {
    this.matchBandFilter = this.matchBandFilter === b ? 'all' : b;
  }
  /** OCEAN "what to look for" tips, personalised to the viewer's own Big Five when available. */
  get oceanTips(): { code: string; text: string }[] {
    const ts = this.bigFiveOutcome?.traitScores;
    const e = ts?.extraversion, a = ts?.agreeableness, o = ts?.openness;
    return [
      { code: 'C', text: 'Runs High-Conscientiousness — the structural integrator who ships reliable work.' },
      { code: 'N', text: 'Runs Low-Neuroticism — a calm anchor under pressure.' },
      { code: 'E', text: e ? `Matches your ${e} Extraversion, so your energy syncs.` : 'Matches your Extraversion, so your energy syncs.' },
      { code: 'A', text: a ? `Matches your ${a} Agreeableness, so your conflict styles align.` : 'Matches your Agreeableness, so your conflict styles align.' },
      { code: 'O', text: o ? `Sits within one band of your ${o} Openness.` : 'Sits within one band of your Openness.' },
    ];
  }

  ngOnInit() {
    // Load all archetypes once for the Matches tab
    this.traitListOutcomeRepository.getAllTraitListOutcomes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((all) => {
        this.allArches = all
          .filter((o) => o.archetypeName && o.primaryTrait)
          .map((o) => ({
            name: o.archetypeName,
            p: o.primaryTrait as unknown as string,
            s: (o.secondaryTrait as unknown as string) || 'NONE',
            imageUrl: o.animalPictureUrl || '',
          }));
        this.computeMatches();
      });

    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(params => {
        const assessmentId = params.get('id');
        const userId = this.route.snapshot.queryParamMap.get('userId') || this.tokenStorageService.getCurrentUserUid();
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
              console.log("outcomes")
              console.log(outcomes)
              this.assessmentOutcome = outcomes?.[0] ?? null;
              
              if (!this.assessmentOutcome && this.assessmentAnswer?.completed) {
                return from(
                  this.assessmentOutcomeGeneratorService.generateOutcomesForAssessment(this.assessmentAnswer),
                ).pipe(
                  switchMap((generated) => {
                    this.assessmentOutcome = generated;
                    return this.fetchLayerOutcomes();
                  }),
                );
              }

              return this.fetchLayerOutcomes();
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
              this.computeMatches();
              this.isLoading = false;
            },
            error: () => {
              this.loadError = 'Failed to load assessment results.';
              this.isLoading = false;
            }
          });
      });
  }

  private fetchLayerOutcomes(): Observable<Record<string, any>> {
    if (!this.assessmentOutcome) {
      return of({});
    }

    const layerOutcomes = this.assessmentOutcome.layerOutcomes ?? [];
    const fetches: Record<string, Observable<any>> = {};

    for (const layer of layerOutcomes) {
      if (layer.layerType === AssessmentLayerType.TRAIT_LIST) {
        const traitOutcome = layer.outcome as ITraitListLayerOutcome;
        if (traitOutcome.traitListOutcomeId) {
          console.log("fetching trait list outcome with id: " + traitOutcome.traitListOutcomeId);
          fetches['traitList'] = this.traitListOutcomeRepository.getTraitListOutcomeById(traitOutcome.traitListOutcomeId);
        }
      } else if (layer.layerType === AssessmentLayerType.BIG_FIVE_PERSONALITY_TRAIT) {
        const bigFiveOutcome = layer.outcome as IBigFiveLayerOutcome;
        this.bigFiveLayerOutcome = bigFiveOutcome;
        if (bigFiveOutcome.bigFiveTraitOutcomeId) {
          console.log("fetching big five outcome with id: " + bigFiveOutcome.bigFiveTraitOutcomeId);
          fetches['bigFive'] = this.bigFiveOutcomeRepository.getBigFiveOutcomeById(bigFiveOutcome.bigFiveTraitOutcomeId);
        }
      }
    }

    if (Object.keys(fetches).length === 0) {
      return of({});
    }
    return forkJoin(fetches);
  }
}
