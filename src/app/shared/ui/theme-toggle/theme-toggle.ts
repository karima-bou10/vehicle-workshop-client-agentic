import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';
import { ThemeService } from '../../../core/services/theme-service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.scss']
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);

  readonly activeTheme = this.themeService.activeTheme;

  toggle(): void {
    this.themeService.toggleTheme();
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
