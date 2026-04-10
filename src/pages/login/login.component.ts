import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { TokenStorageService } from '../../core/service/token-storage.service';
import { UserRepository } from '../../core/repository/user-repository';

const SIGNUP_SUCCESS_FLAG_KEY = 'vw_signup_success';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonIcon, IonSpinner],
})
export class LoginComponent implements ViewWillEnter {
  private readonly toastController = inject(ToastController);

  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly userRepository: UserRepository,
    private readonly tokenStorageService: TokenStorageService,
  ) {
    addIcons({ eyeOutline, eyeOffOutline, lockClosedOutline, mailOutline });
  }

  ionViewWillEnter(): void {
    this.clearInputs();
    this.showSignupSuccessToastIfNeeded();
  }

  clearInputs(): void {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      const trimmedEmail = this.email.trim();
      const credential = await signInWithEmailAndPassword(
        this.auth,
        trimmedEmail,
        this.password,
      );

      const user = await firstValueFrom(this.userRepository.getUserById(credential.user.uid));

      if (!user) {
        this.errorMessage = 'User profile not found. Please contact support.';
        return;
      }

      this.tokenStorageService.createToken(credential.user.uid, user);
      this.router.navigateByUrl('/home');
    } catch (error: unknown) {
      console.log('Login error:', error);  
      this.errorMessage = this.parseAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private parseAuthError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'permission-denied':
        return 'Access denied while loading your profile.';
      default:
        return 'Login failed. Please try again.';
    }
  }

  private async showSignupSuccessToastIfNeeded(): Promise<void> {
    console.log('Checking for signup success flag in sessionStorage');
    if (sessionStorage.getItem(SIGNUP_SUCCESS_FLAG_KEY) !== '1') {
      return;
    }

    sessionStorage.removeItem(SIGNUP_SUCCESS_FLAG_KEY);

    const toast = await this.toastController.create({
      message: 'Please login using your newly created account',
      duration: 4000,
      position: 'top',
      color: 'success',
    });

    await toast.present();
  }
}
