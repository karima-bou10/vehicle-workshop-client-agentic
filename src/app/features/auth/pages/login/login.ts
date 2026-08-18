import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { NotificationService } from '../../../../core/services/notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly passwordVisible = signal(false);
  readonly isSubmitting = signal(false);
  readonly authError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [false],
  });

  isInvalid(field: 'username' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  togglePassword(): void {
    this.passwordVisible.update(v => !v);
  }

  submit(): void {
    if (this.isSubmitting()) return;

    this.authError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { username, password, rememberMe } = this.form.getRawValue();

    this.authService.login({ username, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          if (rememberMe) {
            localStorage.setItem('remember-login', 'true');
          } else {
            localStorage.removeItem('remember-login');
          }

          this.notificationService.success('Connexion réussie.');
          this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          console.error('Login failed:', error);

          // IMPORTANT : aucune notification pour un mauvais identifiant/mot de passe.
          if (error?.status === 401) {
            this.authError.set('Identifiant ou mot de passe incorrect.');
          } else if (error?.status === 0) {
            this.authError.set('Le serveur est momentanément inaccessible. Réessayez dans quelques instants.');
          } else {
            this.authError.set('Impossible de vous connecter pour le moment. Réessayez dans quelques instants.');
          }
        },
      });
  }

}
