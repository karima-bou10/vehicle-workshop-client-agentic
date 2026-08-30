import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiculesService } from '../../services/vehicules.service';

const DUPLICATE_ERROR_MESSAGE = 'Un véhicule avec cette immatriculation existe déjà.';
const GENERIC_ERROR_MESSAGE = 'La modification a échoué. Vérifiez les informations et réessayez.';
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const IMMATRICULATION_PATTERN = /^[A-Za-z]+-[0-9]+$/;

@Component({
  selector: 'app-vehicule-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class VehiculeEditPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehiculesService = inject(VehiculesService);
  readonly vehicleId = Number(this.route.snapshot.paramMap.get('id'));

  readonly maxYear = new Date().getFullYear() + 1;
  readonly loading = signal(true);
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    immatriculationFictive: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(IMMATRICULATION_PATTERN)]],
    marque: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(NAME_PATTERN)]],
    modele: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(NAME_PATTERN)]],
    annee: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(this.maxYear)]],
    kilometrage: [null as number | null, [Validators.required, Validators.min(0), Validators.max(9999999)]],
    clientFictif: ['', [Validators.maxLength(100)]]
  });

  constructor() {
    if (!Number.isInteger(this.vehicleId) || this.vehicleId <= 0) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.vehiculesService.getById(this.vehicleId).subscribe({
      next: (vehicle) => {
        this.form.patchValue({
          immatriculationFictive: vehicle.immatriculationFictive,
          marque: vehicle.marque,
          modele: vehicle.modele,
          annee: vehicle.annee,
          kilometrage: vehicle.kilometrage,
          clientFictif: vehicle.clientFictif
        });
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.vehiculesService.update(this.vehicleId, this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/vehicules', this.vehicleId]),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 409 ? DUPLICATE_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE);
        this.saving.set(false);
      }
    });
  }

  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }
}
