import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  readonly layers = [
    {
      icon: '⬡',
      badge: 'SYNTHESIZED FOUNDATION',
      title: 'Layer 1: The Core Matrix',
      description:
        'Discover the raw architecture of your behavioral identity. We map your primary psychometric traits into one of 64 distinct, multi-faceted gemstone hybrids—unearthing your defining professional strengths and exposing hidden operational blindspots.',
    },
    {
      icon: '◎',
      badge: 'STRESS-TEST MAPPING',
      title: 'Layer 2: The Behavioral Baseline',
      description:
        'Map your operational baselines. Reveal the invisible behavioral patterns that dictate how you handle stress, assess risk, and execute under pressure in high-stakes environments.',
    },
  ];
}
