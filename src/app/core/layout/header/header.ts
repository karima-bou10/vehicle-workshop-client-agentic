import { Component } from '@angular/core';
import { LanguageSwitcher } from '../../../shared/ui/language-switcher/language-switcher';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggle],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
}
