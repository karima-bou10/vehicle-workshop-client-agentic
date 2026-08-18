import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Page } from '../../../../core/models/page.model';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { Intervention, STATUT_LIBELLES, TYPE_LIBELLES } from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service';

@Component({
  selector: 'app-interventions-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginatedTable, StatusTag, LoadingSpinner, EmptyState, ConfirmationDialog],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class InterventionsListPage implements OnInit {
  private readonly service = inject(InterventionsService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly page = signal<Page<Intervention> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);

  readonly archiveTarget = signal<Intervention | null>(null);
  readonly archiving = signal(false);

  readonly tableHeaders = ['Numéro', 'Véhicule', 'Type', 'Statut', 'Date dépôt', 'Actions'];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const p = Number(params['page'] ?? 0);
      const s = Number(params['size'] ?? 20);
      this.currentPage.set(p);
      this.pageSize.set(s);
      this.load(p, s);
    });
  }

  load(page = 0, size = 20): void {
    this.loading.set(true);
    this.service.list(page, size).subscribe({
      next: (data) => {
        this.page.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p, size: this.pageSize() },
      queryParamsHandling: 'merge',
    });
  }

  confirmArchive(item: Intervention): void {
    this.archiveTarget.set(item);
  }

  cancelArchive(): void {
    this.archiveTarget.set(null);
  }

  doArchive(): void {
    const target = this.archiveTarget();
    if (!target) return;
    this.archiving.set(true);
    this.service.archive(target.numero).subscribe({
      next: () => {
        this.notification.success(`Intervention ${target.numero} archivée.`);
        this.archiveTarget.set(null);
        this.archiving.set(false);
        this.load(this.currentPage(), this.pageSize());
      },
      error: () => {
        this.archiving.set(false);
        this.archiveTarget.set(null);
      },
    });
  }

  archiveDialogMessage(item: Intervention): string {
    return `Archiver ${item.numero} sur ${item.vehicule.marque} ${item.vehicule.modele} (${item.vehicule.immatriculationFictive}) ? L\'intervention sort des listes actives sans suppression de données.`;
  }

  canArchive(statut: Intervention['statut']): boolean {
    return statut === 'RESTITUEE' || statut === 'ANNULEE';
  }

  canModify(statut: Intervention['statut']): boolean {
    return statut !== 'TERMINEE' && statut !== 'RESTITUEE' && statut !== 'ANNULEE';
  }

  statutLibelle(statut: string): string {
    return STATUT_LIBELLES[statut as keyof typeof STATUT_LIBELLES] ?? statut;
  }

  typeLibelle(type: string): string {
    return TYPE_LIBELLES[type as keyof typeof TYPE_LIBELLES] ?? type;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get totalPages(): number {
    return this.page()?.totalPages ?? 0;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}

