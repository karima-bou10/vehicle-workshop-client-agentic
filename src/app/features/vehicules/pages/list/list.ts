import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../../core/services/language-service';
import { VehiculesService } from '../../services/vehicules.service';
import { VehiculeListItem } from '../../models/vehicule.model';

@Component({
  selector: 'app-vehicules-list-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class VehiculesListPage {
  private readonly languageService = inject(LanguageService);
  private readonly vehiculesService = inject(VehiculesService);

  readonly vehicles = signal<VehiculeListItem[]>([]);
  readonly search = signal('');
  readonly searchDraft = signal('');
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly hasVehicles = computed(() => this.vehicles().length > 0);

  constructor() {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.error.set(false);
    this.vehiculesService.list(this.search(), this.currentPage()).subscribe({
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
    this.search.set(this.searchDraft());
    this.currentPage.set(0);
    this.loadVehicles();
  }

  resetSearch(): void {
    this.searchDraft.set('');
    this.search.set('');
    this.currentPage.set(0);
    this.loadVehicles();
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
