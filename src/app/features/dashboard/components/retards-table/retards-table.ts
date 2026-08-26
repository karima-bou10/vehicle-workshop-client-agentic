import { Component, inject, input, output } from '@angular/core';
import { LanguageService } from '../../../../core/services/language-service';
import { Page } from '../../../../core/models/page.model';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { Intervention } from '../../../interventions/models/intervention-view.model';

@Component({
  selector: 'app-retards-table',
  standalone: true,
  imports: [LoadingSpinner, EmptyState, PaginatedTable, StatusTag],
  templateUrl: './retards-table.html',
  styleUrls: ['./retards-table.scss']
})
export class RetardsTable {
  private readonly languageService = inject(LanguageService);

  readonly page = input<Page<Intervention> | null>(null);
  readonly loading = input(false);

  readonly pageChange = output<number>();

  readonly tableHeaders = ['Numéro', 'Véhicule', 'Statut', 'Date restitution prévue'];

  get totalPages(): number {
    return this.page()?.totalPages ?? 0;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) {
      return;
    }
    this.pageChange.emit(p);
  }
}
