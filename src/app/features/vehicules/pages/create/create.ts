import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VehiculesService } from '../../services/vehicules.service';

const GENERIC_ERROR_MESSAGE = 'La création du véhicule a échoué. Vérifiez les informations et réessayez.';
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
  selector: 'app-vehicule-create-page',
  imports: [ReactiveFormsModule],
  templateUrl: './create.html',
  styleUrl: './create.scss'
})
export class VehiculeCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly vehiculesService = inject(VehiculesService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly maxYear = new Date().getFullYear() + 1;

  readonly form = this.formBuilder.nonNullable.group({
    immatriculationFictive: ['', [Validators.required]],
    marque: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    modele: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    annee: [null as number | null, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    kilometrage: [null as number | null, [Validators.required, Validators.min(0), Validators.max(9999999)]],
    clientFictif: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.vehiculesService.create(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/vehicules']),
      error: (err: HttpErrorResponse) => {
        this.error.set(backendMessage(err) ?? GENERIC_ERROR_MESSAGE);
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/vehicules']);
  }

  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }
}
