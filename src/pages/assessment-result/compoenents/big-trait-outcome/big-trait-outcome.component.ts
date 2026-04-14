import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChart,
  bulb,
  people,
  calculator,
  heart,
  batteryHalf,
  shield,
  handLeft,
  warning,
  checkmarkCircle,
  informationCircle,
  flash,
  sparkles,
} from 'ionicons/icons';
import { IBigFivePersonalityTraitOutcomeModel } from '../../../../core/model/big-five-outcomes-model';
import { IBigFivePersonalityTraitOutcomeModel as IBigFiveLayerOutcome } from '../../../../core/model/assessment-outcome-model';

@Component({
  selector: 'app-big-trait-outcome',
  templateUrl: './big-trait-outcome.component.html',
  styleUrls: ['./big-trait-outcome.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class BigTraitOutcomeComponent {
  @Input() outcome: IBigFivePersonalityTraitOutcomeModel | null = null;
  @Input() layerOutcome: IBigFiveLayerOutcome | null = null;

  constructor() {
    addIcons({
      barChart,
      bulb,
      people,
      calculator,
      heart,
      batteryHalf,
      shield,
      handLeft,
      warning,
      checkmarkCircle,
      informationCircle,
      flash,
      sparkles,
    });
  }
}
