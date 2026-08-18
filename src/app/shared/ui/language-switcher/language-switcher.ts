import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.html',
  styleUrls: ['./language-switcher.scss']
})
export class LanguageSwitcher {
  private readonly languageService = inject(LanguageService);

  readonly activeLanguage = this.languageService.activeLanguage;

  switchLanguage(): void {
    this.languageService.toggleLanguage();
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
