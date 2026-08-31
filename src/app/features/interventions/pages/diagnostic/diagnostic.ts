import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import { Intervention } from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service';

@Component({
	selector: 'app-interventions-diagnostic-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinner, ConfirmationDialog],
	templateUrl: './diagnostic.html',
	styleUrls: ['./diagnostic.scss']
})
export class InterventionsDiagnosticPage implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);
	private readonly service = inject(InterventionsService);
	private readonly notification = inject(NotificationService);

	readonly loading = signal(true);
	readonly saving = signal(false);
	readonly dialogOpen = signal(false);
	readonly numero = signal('');
	readonly intervention = signal<Intervention | null>(null);

	readonly form = this.fb.group({
		diagnostic: ['', [Validators.required, Validators.minLength(25)]],
	});

	ngOnInit(): void {
		const numero = this.route.snapshot.queryParamMap.get('numero') ?? '';
		const draftDiagnostic = this.route.snapshot.queryParamMap.get('draftDiagnostic')?.trim() ?? '';
		if (!numero) {
			this.router.navigateByUrl('/interventions');
			return;
		}

		this.numero.set(numero);
		this.service.getByNumero(numero).subscribe({
			next: (iv) => {
				if (iv.statut !== 'RECUE') {
					this.notification.warning('Le diagnostic ne peut être saisi que pour une intervention Reçue.');
					this.router.navigateByUrl(`/interventions/${iv.numero}`);
					return;
				}
				this.intervention.set(iv);
				const initialDiagnostic = draftDiagnostic || iv.diagnostic || '';
				this.form.patchValue({ diagnostic: initialDiagnostic });
				if (draftDiagnostic) {
					this.notification.info('Suggestion IA pre-remplie. Verifiez puis confirmez manuellement.');
				}
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

		const diagnostic = this.form.value.diagnostic?.trim() ?? '';
		this.saving.set(true);
		this.service.transition(iv.numero, {
			statutCible: 'DIAGNOSTIC_EN_COURS',
			diagnostic,
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
}
