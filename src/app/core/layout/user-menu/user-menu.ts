import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language-service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.html',
  styleUrls: ['./user-menu.scss']
})
export class UserMenu {
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  readonly reduit = input(false);
  readonly ouvert = signal(false);

  readonly user = this.authService.user;
  readonly nom = computed(() => this.user()?.username ?? '-');
  readonly initiales = computed(() => {
    const name = this.nom().trim();
    if (!name || name === '-') {
      return '?';
    }

    const parts = name.split(/[ ._-]+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
    return initials || name.slice(0, 2).toUpperCase();
  });

  roleLibelle(): string {
    const role = this.user()?.role;
    return role ? this.languageService.t(`role.${role}`) : '-';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  basculer(event: Event): void {
    event.stopPropagation();
    this.ouvert.update((state) => !state);
  }

  deconnexion(): void {
    this.ouvert.set(false);
    this.authService.logout(true, true);
  }

  @HostListener('document:click')
  closeOnOutsideClick(): void {
    this.ouvert.set(false);
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.ouvert.set(false);
  }
}
