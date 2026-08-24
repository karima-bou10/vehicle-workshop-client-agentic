import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Page } from '../../../../core/models/page.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import {
  Intervention,
  PRIORITE_LIBELLES,
  TYPE_LIBELLES,
} from '../../../interventions/models/intervention-view.model';
import { InterventionsService } from '../../../interventions/services/interventions.service';
import { Mecanicien, SPECIALITE_LIBELLES } from '../../models/mecanicien-view.model';
import { MecaniciensService } from '../../services/mecaniciens.service';

@Component({
  selector: 'app-mecaniciens-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinner,
    ConfirmationDialog,
    HasRoleDirective,
    PaginatedTable,
    EmptyState,
    StatusTag,
  ],
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss']
})
export class MecaniciensDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MecaniciensService);
  private readonly interventionsService = inject(InterventionsService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly mecanicien = signal<Mecanicien | null>(null);
  readonly actionBusy = signal(false);
  readonly deactivateDialogOpen = signal(false);
  readonly blocked = signal(false);

  readonly interventionsPage = signal<Page<Intervention> | null>(null);
  readonly interventionsLoading = signal(false);
  readonly interventionsError = signal(false);

  private interventionsRequestSeq = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.loadInterventions(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.getById(id).subscribe({
      next: (data) => {
        this.mecanicien.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private loadInterventions(id: number, page = 0): void {
    this.interventionsLoading.set(true);
    this.interventionsError.set(false);
    const seq = ++this.interventionsRequestSeq;
    this.interventionsService.parMecanicien(id, page).subscribe({
      next: (data) => {
        if (seq !== this.interventionsRequestSeq) return;
        this.interventionsPage.set(data);
        this.interventionsLoading.set(false);
      },
      error: () => {
        if (seq !== this.interventionsRequestSeq) return;
        this.interventionsLoading.set(false);
        this.interventionsError.set(true);
      },
    });
  }

  goToInterventionsPage(page: number): void {
    const m = this.mecanicien();
    if (!m) return;
    this.loadInterventions(m.id, page);
  }

  get interventionsTotalPages(): number {
    return this.interventionsPage()?.totalPages ?? 0;
  }

  get interventionsPageRange(): number[] {
    return Array.from({ length: this.interventionsTotalPages }, (_, i) => i);
  }

  toggleDisponibilite(): void {
    const m = this.mecanicien();
    if (!m || !m.actif) return;
    this.actionBusy.set(true);
    this.service.updateDisponibilite(m.id, { disponible: !m.disponible }).subscribe({
      next: (updated) => {
        this.mecanicien.set(updated);
        this.notification.success(
          `${updated.nom} est maintenant ${updated.disponible ? 'disponible' : 'indisponible'}.`
        );
        this.actionBusy.set(false);
      },
      error: () => this.actionBusy.set(false),
    });
  }

  openDeactivateDialog(): void {
    this.deactivateDialogOpen.set(true);
  }

  cancelDeactivate(): void {
    if (this.actionBusy()) return;
    this.deactivateDialogOpen.set(false);
  }

  doDeactivate(): void {
    const m = this.mecanicien();
    if (!m || this.actionBusy()) return;
    this.actionBusy.set(true);
    this.service.desactiver(m.id).subscribe({
      next: () => {
        this.notification.success(`${m.nom} a été archivé.`);
        this.deactivateDialogOpen.set(false);
        this.actionBusy.set(false);
        this.load(m.id);
      },
      error: (err: HttpErrorResponse) => {
        this.actionBusy.set(false);
        this.deactivateDialogOpen.set(false);
        if (err.status === 409) {
          this.blocked.set(true);
        }
      },
    });
  }

  closeBlockedDialog(): void {
    this.blocked.set(false);
  }

  blockedMessage(item: Mecanicien): string {
    return `${item.nom} est actuellement affecté à des interventions en cours. Veuillez le déaffecter de ces interventions avant de le retirer de l'équipe.`;
  }

  deactivateMessage(item: Mecanicien): string {
    return `Archiver ${item.nom} ? Il n'apparaîtra plus dans la liste mais ses interventions passées restent inchangées.`;
  }

  specialiteLibelle(specialite: string): string {
    return SPECIALITE_LIBELLES[specialite as keyof typeof SPECIALITE_LIBELLES] ?? specialite;
  }

  typeLibelle(type: string): string {
    return TYPE_LIBELLES[type as keyof typeof TYPE_LIBELLES] ?? type;
  }

  prioriteLibelle(priorite: string): string {
    return PRIORITE_LIBELLES[priorite as keyof typeof PRIORITE_LIBELLES] ?? priorite;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  retour(): void {
    this.router.navigateByUrl('/mecaniciens');
  }
}

