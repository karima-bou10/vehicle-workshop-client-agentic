import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss']
})
export class EmptyState {
  readonly message = input('Aucune donnée');
}
