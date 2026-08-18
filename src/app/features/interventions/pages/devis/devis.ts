import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import { Intervention } from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service';
import { not } from 'rxjs/internal/util/not';

@Component({
	selector: 'app-interventions-devis-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinner, ConfirmationDialog],
	templateUrl: './devis.html',
	styleUrls: ['./devis.scss']
})
export class InterventionsDevisPage implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);
	private readonly service = inject(InterventionsService);
	private readonly notification = inject(NotificationService);

	readonly loading = signal(true);
	readonly saving = signal(false);
	readonly dialogOpen = signal(false);
	readonly intervention = signal<Intervention | null>(null);

	readonly form = this.fb.group({
		coutEstime: [null as number | null, [Validators.required, Validators.min(0.01)]],
		dateRestitutionPrevue: ['', [Validators.required, this.notInPastDateValidator]],
	});

	ngOnInit(): void {
		const numero = this.route.snapshot.queryParamMap.get('numero') ?? '';
		if (!numero) {
			this.router.navigateByUrl('/interventions');
			return;
		}

		this.service.getByNumero(numero).subscribe({
			next: (iv) => {
				if (iv.statut !== 'DIAGNOSTIC_EN_COURS') {
					this.notification.warning('Le devis ne peut être saisi que depuis Diagnostic en cours.');
					this.router.navigateByUrl(`/interventions/${iv.numero}`);
					return;
				}
				this.intervention.set(iv);
				this.form.patchValue({
					coutEstime: iv.coutEstime,
					dateRestitutionPrevue: iv.dateRestitutionPrevue ? this.toDatetimeLocal(iv.dateRestitutionPrevue) : '',
				});
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
				this.router.navigateByUrl('/interventions');
			},
		});
	}

	submit(): void {
		this.form.markAllAsTouched();
		if (this.form.invalid || this.saving()) return;
		this.dialogOpen.set(true);
	}

	cancel(): void {
		if (this.saving()) return;
		this.dialogOpen.set(false);
	}

	confirm(): void {
		const iv = this.intervention();
		if (!iv) return;

		const raw = this.form.getRawValue();
		const dateRestitutionPrevue = raw.dateRestitutionPrevue ? new Date(raw.dateRestitutionPrevue) : null;
		if (!dateRestitutionPrevue || Number.isNaN(dateRestitutionPrevue.getTime())) {
			this.notification.error('La date de restitution prévue est obligatoire.');
			return;
		}
		if (dateRestitutionPrevue.getTime() < Date.now()) {
			this.notification.error('La date de restitution prévue ne peut pas être dans le passé.');
			return;
		}

		this.saving.set(true);
		this.service.transition(iv.numero, {
			statutCible: 'DEVIS_A_VALIDER',
			coutEstime: raw.coutEstime ?? null,
			dateRestitutionPrevue: this.toApiDateTime(raw.dateRestitutionPrevue ?? ''),
		}).subscribe({
			next: (updated) => {
				this.notification.success(`Intervention ${updated.numero} mise à jour.`);
				this.dialogOpen.set(false);
				this.saving.set(false);
				this.router.navigateByUrl(`/interventions/${updated.numero}`);
			},
			error: () => {
				this.dialogOpen.set(false);
				this.saving.set(false);
			},
		});
	}

	private toDatetimeLocal(iso: string): string {
		return iso.slice(0, 16);
	}

	private toApiDateTime(value: string): string {
		return `${value}T00:00:00`;
    }
    
    private notInPastDateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }

    const selected = new Date(`${value}T00:00:00`);
    if (Number.isNaN(selected.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected.getTime() < today.getTime() ? { pastDate: true } : null;
  }

    allowOnlyNumber(event: KeyboardEvent): void {

        if (!this.isValidNumberKey(event.key)) {

            event.preventDefault();

        }
    }

    isValidNumberKey(key: string): boolean {

     return /^[0-9.]$/.test(key);

        }
}
