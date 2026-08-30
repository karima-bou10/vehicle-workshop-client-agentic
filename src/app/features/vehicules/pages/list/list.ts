import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../../core/services/language-service';
import { VehiculesService, VehiculeSearchCriteria } from '../../services/vehicules.service';
import { VehiculeListItem } from '../../models/vehicule.model';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';

@Component({
  selector: 'app-vehicules-list-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, HasRoleDirective],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class VehiculesListPage {
  private readonly languageService = inject(LanguageService);
  private readonly vehiculesService = inject(VehiculesService);

  readonly vehicles = signal<VehiculeListItem[]>([]);
  readonly filters = signal<VehiculeSearchCriteria>({});
  readonly filterDraft = signal<VehiculeSearchCriteria>({});
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly archivingId = signal<number | null>(null);
  readonly archiveError = signal<string | null>(null);
  readonly hasVehicles = computed(() => this.vehicles().length > 0);

  constructor() {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.error.set(false);
    this.vehiculesService.list(this.filters(), this.currentPage()).subscribe({
      next: (page) => {
        this.vehicles.set(page.content);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.vehicles.set([]);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  applySearch(): void {
    this.filters.set(this.filterDraft());
    this.currentPage.set(0);
    this.loadVehicles();
  }

  resetSearch(): void {
    this.filters.set({});
    this.filterDraft.set({});
    this.currentPage.set(0);
    this.loadVehicles();
  }

  updateFilter(key: keyof VehiculeSearchCriteria, value: string): void {
    const next = { ...this.filterDraft() };
    if (key === 'annee') {
      next.annee = value ? Number(value) : null;
    } else if (key === 'actif') {
      next.actif = value === '' ? null : value === 'true';
    } else {
      next[key] = value;
    }
    this.filterDraft.set(next);
  }

  onStatusChange(value: string): void {
    this.updateFilter('actif', value);
    this.applySearch();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filterDraft()).some((value) => value !== null && value !== undefined && value !== '');
  }

  archiveVehicle(vehicle: VehiculeListItem): void {
    if (this.archivingId() !== null || !vehicle.actif) {
      return;
    }

    if (!window.confirm(`Archiver le véhicule ${vehicle.immatriculationFictive} ?`)) {
      return;
    }

    this.archivingId.set(vehicle.id);
    this.archiveError.set(null);
    this.vehiculesService.delete(vehicle.id).subscribe({
      next: () => {
        this.archivingId.set(null);
        this.loadVehicles();
      },
      error: () => {
        this.archivingId.set(null);
        this.archiveError.set("L'archivage est refusé ou a échoué.");
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadVehicles();
    }
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index);
  }

  exportCsv(): void {
    const headers = ['ID', 'Immatriculation', 'Marque', 'Modele', 'Annee', 'Kilometrage', 'Client', 'Statut'];
    const rows = this.vehicles().map((vehicle) => [
      vehicle.id, vehicle.immatriculationFictive, vehicle.marque, vehicle.modele,
      vehicle.annee, vehicle.kilometrage, vehicle.clientFictif, vehicle.actif ? 'Actif' : 'Inactif'
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vehicules.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
