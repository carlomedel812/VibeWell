import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, checkmarkCircle, warning, business, gitMerge, people, flash, personCircle } from 'ionicons/icons';
import { ITraitListOutcomesModel } from '../../../../core/model/trait-list-outcomes-model';

@Component({
  selector: 'app-trait-list-outcome',
  templateUrl: './trait-list-outcome.component.html',
  styleUrls: ['./trait-list-outcome.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class TraitListOutcomeComponent {
  @Input() outcome: ITraitListOutcomesModel | null = null;

  constructor() {
    addIcons({ shieldCheckmark, checkmarkCircle, warning, business, gitMerge, people, flash, personCircle });
  }

  toArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }
}
