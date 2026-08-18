import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { LanguageService } from '../../services/language-service';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasRoleDirective, UserMenu],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  readonly reduced = signal(false);

  constructor(private readonly languageService: LanguageService) {}

  toggleReduced(): void {
    this.reduced.update((state) => !state);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
