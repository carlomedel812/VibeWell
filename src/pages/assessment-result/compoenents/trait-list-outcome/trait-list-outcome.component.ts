import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, checkmarkCircle, warning, business, construct, people, flash, personCircle } from 'ionicons/icons';
import { ITraitListOutcomesModel } from '../../../../core/model/trait-list-outcomes-model';

@Component({
  selector: 'app-trait-list-outcome',
  templateUrl: './trait-list-outcome.component.html',
  styleUrls: ['./trait-list-outcome.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class TraitListOutcomeComponent implements OnChanges {
  @Input() outcome: ITraitListOutcomesModel | null = null;

  dynamicsCards: { icon: string; tag: string; title: string; value: string }[] = [];
  frictionPoint: { title: string; value: string } | null = null;

  private readonly fieldConfig: Record<string, { icon: string; tag: string; title: string }> = {
    optimalWorkEnvironment: { icon: 'business', tag: 'ENVIRONMENT', title: 'Optimal Work Environment' },
    conflictAndMeetingStyle: { icon: 'construct', tag: '', title: 'Conflict Style' },
    delegationProfile: { icon: 'people', tag: '', title: 'Delegation' },
  };

  constructor() {
    addIcons({ shieldCheckmark, checkmarkCircle, warning, business, construct, people, flash, personCircle });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outcome'] && this.outcome?.operationalDynamics) {
      const dyn = this.outcome.operationalDynamics;
      this.dynamicsCards = Object.keys(this.fieldConfig).filter(k => (dyn as any)[k]).map(k => ({
        ...this.fieldConfig[k],
        value: (dyn as any)[k] as string
      }));
      this.frictionPoint = dyn.frictionPoint
        ? { title: 'Friction Point', value: dyn.frictionPoint }
        : null;
    }
  }

  toArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }
}
