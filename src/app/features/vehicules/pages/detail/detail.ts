import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiculeIntervention, VehiculeListItem } from '../../models/vehicule.model';
import { VehiculesService } from '../../services/vehicules.service';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';

@Component({
  selector: 'app-vehicule-detail-page',
  imports: [DatePipe, RouterLink, HasRoleDirective, StatusTag],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class VehiculeDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehiculesService = inject(VehiculesService);

  readonly vehicle = signal<VehiculeListItem | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly interventions = signal<VehiculeIntervention[]>([]);
  readonly interventionsLoading = signal(true);
  readonly interventionsError = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.vehiculesService.getById(id).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
        this.loadInterventions(id);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadInterventions(vehicleId: number): void {
    this.vehiculesService.interventions(vehicleId).subscribe({
      next: (page) => {
        this.interventions.set(page.content);
        this.interventionsLoading.set(false);
      },
      error: () => {
        this.interventionsError.set(true);
        this.interventionsLoading.set(false);
      }
    });
  }

  deleteVehicle(): void {
    const currentVehicle = this.vehicle();
    if (!currentVehicle || !window.confirm(`Archiver le véhicule ${currentVehicle.immatriculationFictive} ?`)) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(false);
    this.vehiculesService.delete(currentVehicle.id).subscribe({
      next: () => this.router.navigate(['/vehicules']),
      error: () => {
        this.deleteError.set(true);
        this.deleting.set(false);
      }
    });
  }
}
