import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginCredentials, LoginResponse } from '../models/auth.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  private readonly apiBaseUrl = `${environment.apiUrl}/auth`;
  private readonly tokenStorageKey = 'vw.token';

  private readonly tokenState = signal<string | null>(this.storage.get(this.tokenStorageKey));
  private readonly userState = signal<User | null>(null);
  private readonly loadingState = signal(false);

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.hasValidToken() && this.userState() !== null);

  login(credentials: LoginCredentials): Observable<User> {
    this.loadingState.set(true);

    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/login`, credentials).pipe(
      tap((response) => this.setToken(response.token)),
      switchMap(() => this.refreshCurrentUser()),
      tap((user) => this.userState.set(user)),
      tap(() => this.loadingState.set(false)),
      catchError((error) => {
        this.loadingState.set(false);
        this.clearSession();
        throw error;
      })
    );
  }

  initializeSession(): Observable<User | null> {
    if (!this.hasValidToken()) {
      this.clearSession();
      return of(null);
    }

    return this.refreshCurrentUser().pipe(
      tap((user) => this.userState.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  refreshCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiBaseUrl}/me`).pipe(
      map((user) => ({ username: user.username, role: user.role }))
    );
  }

  logout(redirect = true, notify = false): void {
    if (notify) {
      this.notification.success('Déconnexion réussie.');
    }
    this.clearSession();
    if (redirect) {
      this.router.navigateByUrl('/login');
    }
  }

  hasRole(role: Role): boolean {
    return this.userState()?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const currentRole = this.userState()?.role;
    return Boolean(currentRole && roles.includes(currentRole));
  }

  hasValidToken(): boolean {
    const token = this.tokenState();
    if (!token) {
      return false;
    }

    const payload = this.readJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  }

  private setToken(token: string): void {
    this.tokenState.set(token);
    this.storage.set(this.tokenStorageKey, token);
  }

  private clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.storage.remove(this.tokenStorageKey);
  }

  private readJwtPayload(token: string): { exp?: number } | null {
    const chunks = token.split('.');
    if (chunks.length !== 3) {
      return null;
    }

    try {
      const base64 = chunks[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = atob(padded);
      return JSON.parse(json) as { exp?: number };
    } catch {
      return null;
    }
  }
}
