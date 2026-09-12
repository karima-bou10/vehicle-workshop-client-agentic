import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehiculesService } from '../../services/vehicules.service';

const GENERIC_ERROR_MESSAGE = 'La modification a échoué. Vérifiez les informations et réessayez.';
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;


/** Extrait le message d'erreur métier renvoyé par le backend (BusinessException). */
function backendMessage(err: HttpErrorResponse): string | null {
  if (err.status < 400 || err.status >= 500) return null;
  const body = err.error;
  if (!body) return null;
  if (typeof body === 'string') return body;
  return body.message ?? body.detail ?? body.error ?? null;
}

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

  private initialValue: any;

  readonly form = this.formBuilder.nonNullable.group({
    immatriculationFictive: ['', [Validators.required]],
    marque: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    modele: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    annee: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    kilometrage: [null as number | null, [Validators.required, Validators.min(0), Validators.max(9999999)]],
    clientFictif: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
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
        this.initialValue = this.form.getRawValue();
        this.form.markAsPristine();
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  hasChanges(): boolean {
  return JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialValue);
  }
  
submit(): void {
  this.submitted.set(true);
  this.error.set(null);

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  if (!this.hasChanges()) {
    return;
  }

  this.saving.set(true);

  this.vehiculesService.update(this.vehicleId, this.form.getRawValue()).subscribe({
    next: () => this.router.navigate(['/vehicules', this.vehicleId]),
    error: (err: HttpErrorResponse) => {
      this.error.set(backendMessage(err) ?? GENERIC_ERROR_MESSAGE);
      this.saving.set(false);
    }
  });
}
  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }
}
