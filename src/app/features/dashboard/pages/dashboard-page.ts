import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language-service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.scss']
})
export class DashboardPage {
  private readonly languageService = inject(LanguageService);

  t(key: string): string {
    return this.languageService.t(key);
  }
}
