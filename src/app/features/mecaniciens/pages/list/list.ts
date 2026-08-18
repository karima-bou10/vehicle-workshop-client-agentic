import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../../core/services/language-service';

@Component({
  selector: 'app-mecaniciens-list-page',
  standalone: true,
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class MecaniciensListPage {
  private readonly languageService = inject(LanguageService);

  t(key: string): string {
    return this.languageService.t(key);
  }
}
