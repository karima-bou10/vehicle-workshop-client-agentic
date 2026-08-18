import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../../core/services/language-service';

@Component({
  selector: 'app-vehicules-list-page',
  standalone: true,
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class VehiculesListPage {
  private readonly languageService = inject(LanguageService);

  t(key: string): string {
    return this.languageService.t(key);
  }
}
