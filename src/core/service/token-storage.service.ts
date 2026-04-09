import { Injectable } from '@angular/core';
import jwtEncode from 'jwt-encode';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { IUserModel } from '../model/user-model';
import { UserRole } from '../enum/user-role';

const TOKEN_KEY = 'vw_auth_token';
const REFRESH_TOKEN_KEY = 'vw_refresh_token';

export interface JwtPayload {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string | null;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Signs a JWT from the given user model and saves it to localStorage.
   * @param uid   The Firebase Auth UID (used as the JWT subject).
   * @param user  The IUserModel to embed in the token payload.
   * @param expiresIn  Token lifetime (default 7 days).
   * @returns The signed JWT string.
   */
  createToken(uid: string, user: IUserModel, expiresIn = '30d'): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePictureUrl: user.profilePictureUrl ?? null,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + this.resolveExpiresInSeconds(expiresIn),
    };

    const token = jwtEncode(payload, environment.jwtSecret, 'HS256');
    this.saveToken(token);
    return token;
  }

  // ── Decode ────────────────────────────────────────────────────────────────

  /**
   * Decodes and verifies the stored token.
   * Returns the payload or null if invalid/expired.
   */
  decodeToken(): IUserModel | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.decodePayload(token);
    if (!payload || this.isTokenExpired()) {
      return null;
    }

    return {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      profilePictureUrl: payload.profilePictureUrl ?? null,
      role: payload.role as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ── Token ────────────────────────────────────────────────────────────────

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const payload = this.decodePayload(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodePayload(token);
    if (!payload) {
      return false;
    }

    return !this.isTokenExpired();
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ── Refresh Token ─────────────────────────────────────────────────────────

  saveRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // ── Clear All ─────────────────────────────────────────────────────────────

  clearAll(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private decodePayload(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private resolveExpiresInSeconds(expiresIn: string | number): number {
    if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
      return Math.max(0, Math.floor(expiresIn));
    }

    const expiresInText = String(expiresIn).trim();
    const parsed = /^(\d+)([smhd])$/i.exec(expiresInText);
    if (!parsed) {
      return 30 * 24 * 60 * 60;
    }

    const amount = Number(parsed[1]);
    const unit = parsed[2].toLowerCase();

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      default:
        return 30 * 24 * 60 * 60;
    }
  }
}
