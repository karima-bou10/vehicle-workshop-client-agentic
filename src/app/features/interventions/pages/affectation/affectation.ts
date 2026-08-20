import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MecaniciensService } from '../../../mecaniciens/services/mecanicien.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import { Intervention, MecanicienAffectationRequest } from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service'
import { MecanicienListItem, SPECIALITE_LIBELLES } from '../../../mecaniciens/models/mecanicien.model';

@Component({
	selector: 'app-interventions-affectation-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinner, ConfirmationDialog],
	templateUrl: './affectation.html',
	styleUrls: ['./affectation.scss']
})
export class InterventionsAffectationPage implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);
	private readonly service = inject(InterventionsService);
    private readonly notification = inject(NotificationService);
    private readonly mecaniciensService = inject(MecaniciensService);

	readonly loading = signal(true);
	readonly saving = signal(false);
	readonly dialogOpen = signal(false);
	readonly intervention = signal<Intervention | null>(null);

    readonly mecaniciens = signal<MecanicienListItem[]>([]);
    readonly specialite = SPECIALITE_LIBELLES;

	readonly form = this.fb.group({
		mecanicienId: [null as number | null, [Validators.required, Validators.min(1)]],
	});

	ngOnInit(): void {
		const numero = this.route.snapshot.queryParamMap.get('numero') ?? '';
		if (!numero) {
			this.router.navigateByUrl('/interventions');
			return;
		}

		this.service.getByNumero(numero).subscribe({
			next: (iv) => {
				this.intervention.set(iv);
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
				this.router.navigateByUrl('/interventions');
			},
		});

        this.loadMecaniciens();
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

		const mecanicienId = this.form.value.mecanicienId;
		if (!mecanicienId) return;

		const request: MecanicienAffectationRequest = { mecanicienId };

		this.saving.set(true);
		this.service.affecterMecanicien(iv.numero, request).subscribe({
			next: (updated) => {
				this.service.transition(updated.numero, { statutCible: 'EN_REPARATION' }).subscribe({
					next: () => {
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
			},
			error: () => {
				this.dialogOpen.set(false);
				this.saving.set(false);
			},
		});
	}


	private loadMecaniciens(): void {
		this.mecaniciensService.list(0, 200).subscribe({
			next: (page) => {
                this.mecaniciens.set(page.content);
                console.log('Mécaniciens page', page.content);
			},
			error: () => this.mecaniciens.set([]),
		});
	}
}
