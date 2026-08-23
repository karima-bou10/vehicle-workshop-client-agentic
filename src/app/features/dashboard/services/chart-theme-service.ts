import { computed, Injectable, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme-service';

export interface ChartPalette {
  action: string;
  wait: string;
  done: string;
  danger: string;
  textMuted: string;
  borderSoft: string;
  surfaceCard: string;
}

function resolveCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

@Injectable({ providedIn: 'root' })
export class ChartThemeService {
  private readonly themeService = inject(ThemeService);

  readonly palette = computed<ChartPalette>(() => {
    // Depend on activeTheme() so the palette recomputes whenever the theme toggles.
    this.themeService.activeTheme();
    return {
      action: resolveCssVar('--color-action'),
      wait: resolveCssVar('--color-wait'),
      done: resolveCssVar('--color-done'),
      danger: resolveCssVar('--color-danger'),
      textMuted: resolveCssVar('--text-muted'),
      borderSoft: resolveCssVar('--border-soft'),
      surfaceCard: resolveCssVar('--surface-card'),
    };
  });
}
