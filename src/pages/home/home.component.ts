

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, clipboardOutline, personOutline, logOutOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { TokenStorageService } from '../../core/service/token-storage.service';
import { Auth, signOut } from '@angular/fire/auth';
import { ViewWillEnter } from '@ionic/angular';
import { UserRole } from '../../core/enum/user-role';
import { IUserModel } from '../../core/model/user-model';


@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonIcon, IonRouterOutlet],

})

export class HomeComponent implements ViewWillEnter {
  public currentUser: Partial<IUserModel> = {
    firstName: 'Jane',
    lastName: 'Doe',
    profilePictureUrl: null,
    role: undefined,
  };
  public hasProfileImageError = false;

  public appPages: Array<{ title: string; url: string; icon: string }> = [];

  private readonly userRolePages = [
    { title: 'Dashboard',       url: '/home/dashboard',       icon: 'grid-outline' },
    { title: 'Profile',         url: '/home/profile',         icon: 'person-outline' },
  ];

  private readonly adminRolePages = [
    { title: 'Dashboard',       url: '/home/dashboard',       icon: 'grid-outline' },
    { title: 'Admin',           url: '/home/admin',           icon: 'shield-checkmark-outline' },
    { title: 'Profile',         url: '/home/profile',         icon: 'person-outline' },
  ];

  constructor(
    private readonly router: Router,
    private readonly tokenStorageService: TokenStorageService,
    private readonly auth: Auth,
  ) {
    addIcons({ gridOutline, shieldCheckmarkOutline, clipboardOutline, personOutline, logOutOutline });
  }

  ionViewWillEnter() {
    this.setMenuByRole();
  }

  private setMenuByRole(): void {
    const user = this.tokenStorageService.decodeToken();
   
    if (user) {
      this.currentUser.firstName = user.firstName;
      this.currentUser.lastName = user.lastName;
      this.currentUser.profilePictureUrl = user.profilePictureUrl ?? null;
      this.currentUser.role = user.role;
      this.hasProfileImageError = false;
      if (user.role === UserRole.ADMIN) {
        this.appPages = this.adminRolePages;
      } else {
        this.appPages = this.userRolePages;
      }
    } else {
      // Default to user pages if not logged in
      this.appPages = this.userRolePages;
    }
  }

  async logout() {
    this.tokenStorageService.clearAll();
    await signOut(this.auth);
    this.router.navigateByUrl('/login');
  }

  onProfileImageError(): void {
    this.hasProfileImageError = true;
  }
}
