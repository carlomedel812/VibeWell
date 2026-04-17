import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner,
} from '@ionic/angular/standalone';

import { ITraitListOutcomesModel } from '../../core/model/trait-list-outcomes-model';
import { TraitListOutcomeRepository } from '../../core/repository/trait-list-outcome-repository';

@Component({
  selector: 'app-manage-outcomes',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonMenuButton,
    IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner,
  ],
  templateUrl: './manage-outcomes.component.html',
  styleUrls: ['./manage-outcomes.component.scss'],
})
export class ManageOutcomesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly traitListOutcomeRepo = inject(TraitListOutcomeRepository);

  outcomes: ITraitListOutcomesModel[] = [];
  urlMap: Record<string, string> = {};
  loading = true;

  ngOnInit(): void {
    this.traitListOutcomeRepo.getAllTraitListOutcomes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((outcomes) => {
        this.outcomes = outcomes;
        this.urlMap = {};
        for (const o of outcomes) {
          this.urlMap[o.id!] = o.animalPictureUrl ?? '';
        }
        this.loading = false;
      });
  }

  saveUrl(outcome: ITraitListOutcomesModel): void {
    const newUrl = this.urlMap[outcome.id!];
    this.traitListOutcomeRepo.updateTraitListOutcome(outcome.id!, { animalPictureUrl: newUrl });
  }
}
