import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Page } from '../../../../core/models/page.model';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Intervention,
  InterventionListFilters,
  PRIORITE_LIBELLES,
  PrioriteIntervention,
  STATUT_LIBELLES,
  StatutIntervention,
  TYPE_LIBELLES,
} from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service';
import { MecaniciensService } from '../../../mecaniciens/services/mecaniciens.service';
import { MecanicienListItem } from '../../../mecaniciens/models/mecanicien.model';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';

type VueInterventions = 'liste' | 'board';

interface BoardColumn {
  statut: StatutIntervention;
  label: string;
  interventions: Intervention[];
}

@Component({
  selector: 'app-interventions-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginatedTable, StatusTag, LoadingSpinner, EmptyState, ConfirmationDialog, HasRoleDirective],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class InterventionsListPage implements OnInit {
  private readonly service = inject(InterventionsService);
  private readonly mecaniciensService = inject(MecaniciensService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly page = signal<Page<Intervention> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly currentSort = signal('dateDepot,DESC');
  readonly vueActive = signal<VueInterventions>('liste');
  readonly mecaniciens = signal<MecanicienListItem[]>([]);
  readonly filters = signal<InterventionListFilters>({
    statut: null,
    mecanicienId: null,
    immatriculation: '',
    q: '',
    enRetard: false,
  });

  readonly archiveTarget = signal<Intervention | null>(null);
  readonly archiving = signal(false);

  readonly tableHeaders = ['Numéro', 'Véhicule', 'Type', 'Statut', 'Etat', 'Date dépôt', 'Actions'];
  readonly statuts = Object.entries(STATUT_LIBELLES).map(([value, label]) => ({
    value: value as StatutIntervention,
    label,
  }));
  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();
    return Boolean(filters.statut || filters.mecanicienId || filters.immatriculation || filters.q || filters.enRetard);
  });
  readonly boardColumns = computed<BoardColumn[]>(() => {
    const interventions = this.page()?.content ?? [];
    const orderedStatuts: StatutIntervention[] = [
      'RECUE',
      'DIAGNOSTIC_EN_COURS',
      'DEVIS_A_VALIDER',
      'EN_REPARATION',
      'TERMINEE',
      'RESTITUEE',
    ];

    return orderedStatuts.map((statut) => ({
      statut,
      label: STATUT_LIBELLES[statut],
      interventions: interventions.filter((item) => item.statut === statut),
    }));
  });

  ngOnInit(): void {
    this.loadMecaniciens();
    this.route.queryParams.subscribe((params) => {
      const p = Number(params['page'] ?? 0);
      const s = Number(params['size'] ?? 10);
      const sort = String(params['sort'] ?? 'dateDepot,DESC');
      this.currentPage.set(p);
      this.pageSize.set(s);
      this.currentSort.set(sort);
      this.filters.set({
        statut: (params['statut'] as StatutIntervention | undefined) ?? null,
        mecanicienId: params['mecanicienId'] ? Number(params['mecanicienId']) : null,
        immatriculation: String(params['immatriculation'] ?? ''),
        q: String(params['q'] ?? ''),
        enRetard: params['enRetard'] === 'true',
      });
      this.load(p, s, sort);
    });
  }

  load(page = 0, size = 10, sort = this.currentSort()): void {
    this.loading.set(true);
    this.service.list(this.filters(), page, size, sort).subscribe({
      next: (data) => {
        this.page.set({ ...data, content: data.content.sort((a, b) => b.numero.localeCompare(a.numero)) });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.toQueryParams(this.filters()), page: p, size: this.pageSize(), sort: this.currentSort() },
      queryParamsHandling: 'merge',
    });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.toQueryParams(this.filters()), page: 0, size: this.pageSize(), sort: this.currentSort() },
      queryParamsHandling: '',
    });
  }

  resetFilters(): void {
    this.filters.set({ statut: null, mecanicienId: null, immatriculation: '', q: '', enRetard: false });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 0, size: this.pageSize(), sort: this.currentSort() },
      queryParamsHandling: '',
    });
  }

  updateFilter<K extends keyof InterventionListFilters>(key: K, value: InterventionListFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  setVueActive(vue: VueInterventions): void {
    this.vueActive.set(vue);
  }

  exportCsv(): void {
    if (this.exporting()) {
      return;
    }

    this.exporting.set(true);
    this.service.exportCsv(this.filters()).subscribe({
      next: (response) => {
        this.downloadCsv(response);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
      },
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
        this.load(this.currentPage(), this.pageSize(), this.currentSort());
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

  prioriteLibelle(priorite: PrioriteIntervention): string {
    return PRIORITE_LIBELLES[priorite] ?? priorite;
  }

  prioriteClass(priorite: PrioriteIntervention): string {
    return `priority-badge--${priorite.toLowerCase()}`;
  }

  isEnRetard(item: Intervention): boolean {
    return item.enRetard;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  mecanicienLabel(item: MecanicienListItem): string {
    return `${item.nom} — ${item.specialite}`;
  }

  get totalPages(): number {
    return this.page()?.totalPages ?? 0;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  private loadMecaniciens(): void {
    this.mecaniciensService.list().subscribe({
      next: (page) => this.mecaniciens.set(page.content.filter((item) => item.actif)),
      error: () => this.mecaniciens.set([]),
    });
  }

  private toQueryParams(filters: InterventionListFilters): Record<string, string | number | boolean | null> {
    return {
      statut: filters.statut ?? null,
      mecanicienId: filters.mecanicienId ?? null,
      immatriculation: filters.immatriculation?.trim() ? filters.immatriculation.trim() : null,
      q: filters.q?.trim() ? filters.q.trim() : null,
      enRetard: filters.enRetard ? true : null,
    };
  }

  private downloadCsv(response: HttpResponse<Blob>): void {
    const blob = response.body;
    if (!blob) {
      this.notification.error('Export CSV vide ou indisponible.');
      return;
    }

    const contentDisposition = response.headers.get('Content-Disposition') ?? '';
    const fileName = this.extractFilename(contentDisposition) ?? 'interventions.csv';
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notification.success('Export CSV généré.');
  }

  private extractFilename(contentDisposition: string): string | null {
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] ?? null;
  }
}

