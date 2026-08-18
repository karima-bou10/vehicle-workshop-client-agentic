import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: '<span class="spinner" aria-label="Loading"></span>',
  styleUrls: ['./loading-spinner.scss']
})
export class LoadingSpinner {}
