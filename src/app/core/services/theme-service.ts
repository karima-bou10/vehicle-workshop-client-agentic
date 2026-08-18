import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'vw.theme';
  private readonly activeThemeState = signal<ThemeMode>('light');

  readonly activeTheme = this.activeThemeState.asReadonly();

  constructor() {
    const storedTheme = localStorage.getItem(this.storageKey) as ThemeMode | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      this.setTheme(storedTheme);
      return;
    }

    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(preferDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.setTheme(this.activeThemeState() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.activeThemeState.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
  }
}
