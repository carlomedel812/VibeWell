import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonMenuButton,
  IonTitle, IonContent, IonIcon, IonProgressBar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline, checkmarkCircleOutline, timeOutline,
  flashOutline, barChartOutline, calendarOutline,
  ribbonOutline, arrowForwardOutline,
} from 'ionicons/icons';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend: 'up' | 'neutral';
}

interface RecentActivity {
  title: string;
  date: string;
  score: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonIcon, IonProgressBar],
})
export class DashboardComponent {
  greeting = this.getGreeting();

  stats: StatCard[] = [
    { label: 'Total Sessions',  value: '24',   sub: '+3 this week',    icon: 'flash-outline',             trend: 'up'     },
    { label: 'Avg. Score',      value: '78%',  sub: '+5% vs last week', icon: 'trending-up-outline',      trend: 'up'     },
    { label: 'Time Spent',      value: '6.4h', sub: 'Past 7 days',     icon: 'time-outline',              trend: 'neutral' },
    { label: 'Streak',          value: '5d',   sub: 'Keep it up!',     icon: 'ribbon-outline',            trend: 'up'     },
  ];

  skills = [
    { label: 'Logic',     progress: 0.82, color: '#50C878' },
    { label: 'Memory',    progress: 0.64, color: '#50C878' },
    { label: 'Focus',     progress: 0.71, color: '#50C878' },
    { label: 'Cognitive', progress: 0.55, color: '#50C878' },
  ];

  recentActivity: RecentActivity[] = [
    { title: 'Pattern Recognition', date: 'Today, 9:14 AM',       score: 91, icon: 'bar-chart-outline'         },
    { title: 'Working Memory Test', date: 'Yesterday, 4:30 PM',   score: 73, icon: 'checkmark-circle-outline'  },
    { title: 'Focus Challenge',     date: 'Apr 6, 11:00 AM',      score: 68, icon: 'calendar-outline'          },
    { title: 'Logic Puzzle',        date: 'Apr 5, 8:45 AM',       score: 85, icon: 'flash-outline'             },
  ];

  constructor() {
    addIcons({
      trendingUpOutline, checkmarkCircleOutline, timeOutline,
      flashOutline, barChartOutline, calendarOutline,
      ribbonOutline, arrowForwardOutline,
    });
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#50C878';
    if (score >= 60) return '#f4d47c';
    return '#e87070';
  }

  private getGreeting(date = new Date()): string {
    const hour = date.getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }
}
