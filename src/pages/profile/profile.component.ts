import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Auth,
  EmailAuthProvider,
  authState,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
} from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, createOutline, eyeOffOutline, eyeOutline, mailOutline, personCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { of, switchMap } from 'rxjs';

import { IUserModel } from '../../core/model/user-model';
import { UserRepository } from '../../core/repository/user-repository';
import { TokenStorageService } from '../../core/service/token-storage.service';
import { DateValue, formatDate } from '../../core/utils/date.util';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonIcon, IonSpinner],
})
export class ProfileComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private currentUserId: string | null = null;

  profile: Partial<IUserModel> | null = null;
  hasProfileImageError = false;
  isLoading = true;
  isSaving = false;
  isEditing = false;
  saveError = '';
  saveSuccess = '';
  isPasswordSaving = false;
  passwordError = '';
  passwordSuccess = '';
  editForm = {
    firstName: '',
    lastName: '',
    profilePictureUrl: '',
  };
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  passwordVisibility = {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  };

  constructor(
    private readonly auth: Auth,
    private readonly userRepository: UserRepository,
    private readonly tokenStorageService: TokenStorageService,
  ) {
    this.profile = this.tokenStorageService.decodeToken();
    this.syncEditForm();
    addIcons({
      calendarOutline,
      createOutline,
      eyeOffOutline,
      eyeOutline,
      mailOutline,
      personCircleOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    authState(this.auth)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((firebaseUser) => {
          this.currentUserId = firebaseUser?.uid ?? null;

          if (!firebaseUser) {
            return of(undefined);
          }

          return this.userRepository.getUserById(firebaseUser.uid);
        }),
      )
      .subscribe({
        next: (user) => {
          if (user) {
            this.profile = user;
            this.hasProfileImageError = false;
            this.syncEditForm();
          }

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  startEditing(): void {
    this.isEditing = true;
    this.saveError = '';
    this.saveSuccess = '';
    this.syncEditForm();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.isSaving = false;
    this.saveError = '';
    this.syncEditForm();
  }

  async saveProfile(): Promise<void> {
    if (!this.currentUserId) {
      this.saveError = 'Unable to identify the current user.';
      return;
    }

    const firstName = this.editForm.firstName.trim();
    const lastName = this.editForm.lastName.trim();

    if (!firstName || !lastName) {
      this.saveError = 'First name and last name are required.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = '';

    const profilePictureUrl = this.editForm.profilePictureUrl.trim();

    const updates: Partial<IUserModel> = {
      firstName,
      lastName,
    };

    if (profilePictureUrl) {
      updates.profilePictureUrl = profilePictureUrl;
    }

    try {
      await this.userRepository.updateUser(this.currentUserId, updates);

      this.profile = {
        ...this.profile,
        ...updates,
        profilePictureUrl: profilePictureUrl || null,
      };
      this.hasProfileImageError = false;

      if (this.profile?.email && this.profile.firstName && this.profile.lastName && this.profile.role) {
        this.tokenStorageService.createToken(this.currentUserId, {
          email: this.profile.email,
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
          profilePictureUrl: this.profile.profilePictureUrl,
          createdAt: this.profile.createdAt ?? new Date(),
          updatedAt: new Date(),
          isActive: this.profile.isActive ?? true,
          role: this.profile.role,
        });
      }

      this.isEditing = false;
      this.saveSuccess = 'Profile updated successfully.';
    } catch(error: unknown) {
      console.log('Profile update error:', error);
      this.saveError = 'Unable to save your profile right now.';
    } finally {
      this.isSaving = false;
    }
  }

  async savePassword(): Promise<void> {
    const currentUser = this.auth.currentUser;
    const currentPassword = this.passwordForm.currentPassword.trim();
    const newPassword = this.passwordForm.newPassword.trim();
    const confirmPassword = this.passwordForm.confirmPassword.trim();

    this.passwordError = '';
    this.passwordSuccess = '';

    if (!currentUser || !currentUser.email) {
      this.passwordError = 'Unable to identify the current Firebase user.';
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }

    if (newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    if (currentPassword === newPassword) {
      this.passwordError = 'New password must be different from the current password.';
      return;
    }

    this.isPasswordSaving = true;

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await firebaseUpdatePassword(currentUser, newPassword);

      this.passwordSuccess = 'Password updated successfully.';
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      this.passwordVisibility = {
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? '';
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          this.passwordError = 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          this.passwordError = 'Please choose a stronger password.';
          break;
        case 'auth/too-many-requests':
          this.passwordError = 'Too many attempts. Please try again later.';
          break;
        case 'auth/requires-recent-login':
          this.passwordError = 'Please log in again before changing your password.';
          break;
        default:
          this.passwordError = 'Unable to update your password right now.';
          break;
      }
    } finally {
      this.isPasswordSaving = false;
    }
  }

  get fullName(): string {
    if (!this.profile) {
      return 'User';
    }

    return [this.profile.firstName, this.profile.lastName]
      .filter(Boolean)
      .join(' ') || 'User';
  }

  get isPasswordFormValid(): boolean {
    const currentPassword = this.passwordForm.currentPassword.trim();
    const newPassword = this.passwordForm.newPassword.trim();
    const confirmPassword = this.passwordForm.confirmPassword.trim();

    return !!currentPassword && !!newPassword && !!confirmPassword;
  }

  formatDate(value?: DateValue): string {
    return formatDate(value);
  }

  onProfileImageError(): void {
    this.hasProfileImageError = true;
  }

  togglePasswordVisibility(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): void {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  private syncEditForm(): void {
    this.editForm = {
      firstName: this.profile?.firstName ?? '',
      lastName: this.profile?.lastName ?? '',
      profilePictureUrl: this.profile?.profilePictureUrl ?? '',
    };
  }
}
