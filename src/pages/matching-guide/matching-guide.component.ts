import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonSpinner,
} from '@ionic/angular/standalone';

import { TraitListOutcomeRepository } from '../../core/repository/trait-list-outcome-repository';
import { GdriveImgPipe } from '../../core/utils/gdrive-img.pipe';
import { MatchingService, ArchLite, Band, Rec } from '../../core/service/matching.service';

interface Rated { a: ArchLite; band: Band; reason: string; }

@Component({
  selector: 'app-matching-guide',
  standalone: true,
  templateUrl: './matching-guide.component.html',
  imports: [
    CommonModule, FormsModule, GdriveImgPipe,
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonSpinner,
  ],
})
export class MatchingGuideComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly outcomeRepo = inject(TraitListOutcomeRepository);
  private readonly match = inject(MatchingService);

  @ViewChild(IonContent) private content!: IonContent;

  // Expose matching model to the template
  readonly order = this.match.order;
  readonly drivers = this.match.drivers;
  readonly executors = this.match.executors;
  readonly fam = this.match.fam;

  // Live data
  arches: ArchLite[] = [];
  imgByKey: Record<string, string> = {};
  imgByName: Record<string, string> = {};
  loading = true;
  loadError = '';

  // Explorer state
  clientSearch = '';
  resultSearch = '';
  explorerBand: Band | 'all' = 'all';
  selected: ArchLite | null = null;
  results: Rated[] = [];
  gridReason = '';

  ngOnInit(): void {
    this.outcomeRepo.getAllTraitListOutcomes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (outcomes) => {
          const arches: ArchLite[] = outcomes
            .filter((o) => o.archetypeName && o.primaryTrait)
            .map((o) => ({
              name: o.archetypeName,
              p: o.primaryTrait as unknown as string,
              s: (o.secondaryTrait as unknown as string) || 'NONE',
              imageUrl: o.animalPictureUrl || '',
            }));
          const oi = (t: string) => this.order.indexOf(t);
          arches.sort((a, b) => oi(a.p) - oi(b.p) || (a.s === 'NONE' ? -1 : b.s === 'NONE' ? 1 : oi(a.s) - oi(b.s)));
          this.arches = arches;
          for (const a of arches) {
            this.imgByKey[`${a.p}|${a.s}`] = a.imageUrl;
            this.imgByName[a.name] = a.imageUrl;
          }
          this.loading = false;
        },
        error: () => { this.loadError = 'Failed to load archetypes.'; this.loading = false; },
      });
  }

  // Image lookups
  gemFor(trait: string): string { return this.imgByKey[`${trait}|NONE`] || ''; }
  imgFor(name: string): string { return this.imgByName[name] || ''; }

  // Delegate to shared matching logic
  label(b: string): string { return this.match.label(b); }
  stoneStr(a: ArchLite): string { return this.match.stoneStr(a); }
  famRate(ck: string, ak: string): string { return this.match.famRate(ck, ak); }
  setGridReason(ck: string, ak: string): void { this.gridReason = this.match.famReason(ck, ak); }
  recNames(k: string, kind: keyof Rec): string { return this.match.recNames(k, kind); }

  // Explorer interactions
  get filteredClients(): ArchLite[] {
    const f = this.clientSearch.trim().toLowerCase();
    return f ? this.arches.filter((a) => this.hay(a).includes(f)) : this.arches;
  }
  get filteredResults(): Rated[] {
    const f = this.resultSearch.trim().toLowerCase();
    return this.results.filter((r) =>
      (this.explorerBand === 'all' || r.band === this.explorerBand) &&
      (!f || (this.hay(r.a) + ' ' + r.band).includes(f)));
  }
  setExplorerBand(b: Band): void {
    this.explorerBand = this.explorerBand === b ? 'all' : b;
  }
  get counts(): Record<string, number> {
    const c: Record<string, number> = { ideal: 0, strong: 0, workable: 0, friction: 0 };
    for (const r of this.results) c[r.band]++;
    return c;
  }
  private hay(a: ArchLite): string {
    return (a.name + ' ' + this.fam[a.p].stone + ' ' + (a.s !== 'NONE' ? this.fam[a.s].stone : '') + ' ' + this.fam[a.p].name).toLowerCase();
  }
  select(a: ArchLite): void {
    this.selected = a;
    this.resultSearch = '';
    this.explorerBand = 'all';
    this.results = this.match.rank(a, this.arches, true);
  }
  isSelected(a: ArchLite): boolean { return !!this.selected && this.selected.name === a.name; }

  async scrollTo(id: string): Promise<void> {
    const el = document.getElementById(id);
    if (!el || !this.content) return;
    const sc = await this.content.getScrollElement();
    const y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    this.content.scrollToPoint(0, Math.max(0, y - 8), 400);
  }
}
