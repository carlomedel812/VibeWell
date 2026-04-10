import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { IonContent, IonIcon, IonSpinner, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../../core/repository/user-repository';
import { UserRole } from '../../core/enum/user-role';
import { TokenStorageService } from '../../core/service/token-storage.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: 'signup.component.html',
  styleUrls: ['signup.component.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonIcon, IonSpinner],
})
export class SignupComponent implements ViewWillEnter {
  private readonly auth = inject(Auth);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly userRepository: UserRepository,
    private readonly tokenStorageService: TokenStorageService,
  ) {
    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
    });
  }
  
  ionViewWillEnter(): void {
    this.clearInputs();
  }

  clearInputs(): void {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.isLoading = false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit(): Promise<void> {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password,
      );

      const now = new Date();
      await this.userRepository.setUser(credential.user.uid, {
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        isActive: true,
        role: UserRole.USER,
        createdAt: now,
        updatedAt: now,
      });

      const user = await firstValueFrom(this.userRepository.getUserById(credential.user.uid));

      if (!user) {
        this.errorMessage = 'User profile not found. Please contact support.';
        return;
      }

      this.tokenStorageService.createToken(credential.user.uid, user);
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: unknown) {
      this.errorMessage = this.parseAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private parseAuthError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      default:
        return 'Registration failed. Please try again.';
    }
  }
}
