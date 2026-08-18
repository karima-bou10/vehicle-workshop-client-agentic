import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-paginated-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginated-table.html',
  styleUrls: ['./paginated-table.scss']
})
export class PaginatedTable {
  readonly headers = input<string[]>([]);
}
