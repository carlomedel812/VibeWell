
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, clipboardOutline, personOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonIcon, IonRouterOutlet],
})
export class HomeComponent {
  public currentUser = {
    name: 'Jane Doe',
    role: 'Member',
  };

  public appPages = [
    { title: 'Dashboard',       url: '/home/dashboard',       icon: 'grid-outline' },
    { title: 'Past Assessment', url: '/home/past-assessment', icon: 'clipboard-outline' },
    { title: 'Profile',         url: '/home/profile',         icon: 'person-outline' },
  ];

  constructor() {
    addIcons({ gridOutline, clipboardOutline, personOutline, logOutOutline });
  }

  logout() {
    // TODO: implement logout logic
    console.log('Logging out...');
  }
}
