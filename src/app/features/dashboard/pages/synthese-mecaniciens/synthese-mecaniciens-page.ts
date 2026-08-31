import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Page } from '../../../../core/models/page.model';
import { LanguageService } from '../../../../core/services/language-service';
import { DashboardService } from '../../services/dashboard-service';
import { MecanicienSynthese } from '../../models/dashboard-view.model';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { SPECIALITE_LIBELLES } from '../../../mecaniciens/models/mecanicien.model';

@Component({
  selector: 'app-synthese-mecaniciens-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginatedTable, EmptyState, LoadingSpinner],
  templateUrl: './synthese-mecaniciens-page.html',
  styleUrls: ['./synthese-mecaniciens-page.scss']
})
export class SyntheseMecaniciensPage implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly languageService = inject(LanguageService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal<Page<MecanicienSynthese> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);

  readonly tableHeaders = [
    'Nom',
    'Spécialité',
    'Disponibilité',
    'En cours',
    'En réparation',
    'Terminées',
    'En retard',
    'Délai moyen',
    'Actions',
  ];

  t(key: string): string {
    return this.languageService.t(key);
  }

  specialiteLibelle(specialite: string): string {
    return SPECIALITE_LIBELLES[specialite as keyof typeof SPECIALITE_LIBELLES] ?? specialite;
  }

  formatDelai(delaiHours: number | null): string {
    if (delaiHours === null || delaiHours === undefined) {
      return this.t('dashboard.synthese.notAvailable');
    }
    const totalHours = Math.round(delaiHours);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) {
      const fmt = this.t('dashboard.synthese.duration.format');
      return fmt.replace('{days}', String(days)).replace('{hours}', String(hours));
    }
    const fmtH = this.t('dashboard.synthese.duration.hoursOnly');
    return fmtH.replace('{hours}', String(hours));
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const p = Number(params['page'] ?? 0);
      const s = Number(params['size'] ?? 10);
      this.currentPage.set(p);
      this.pageSize.set(s);
      this.load(p, s);
    });
  }

  load(page = this.currentPage(), size = this.pageSize()): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.syntheseMecaniciens(page, size).subscribe({
      next: (data) => {
        this.page.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  goToPage(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p, size: this.pageSize() },
      queryParamsHandling: 'merge',
    });
  }

  detail(id: number): void {
    this.router.navigateByUrl(`/mecaniciens/${id}`);
  }

  get totalPages(): number {
    return this.page()?.totalPages ?? 0;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
