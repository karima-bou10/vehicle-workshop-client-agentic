import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Intervention,
  STATUT_LIBELLES,
  StatutIntervention,
  TypeIntervention,
  PrioriteIntervention,
} from '../../models/intervention-view.model';
import { InterventionsService } from '../../services/interventions.service';
import { VehiculeListItem } from '../../../vehicules/models/vehicule.model';
import { VehiculesService } from '../../../vehicules/services/vehicules.service';

const TYPES: { value: TypeIntervention; label: string }[] = [
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'REVISION', label: 'Révision' },
  { value: 'REPARATION', label: 'Réparation' },
  { value: 'CONTROLE', label: 'Contrôle' },
  { value: 'PNEUMATIQUES', label: 'Pneumatiques' },
  { value: 'AUTRE', label: 'Autre' },
];

const PRIORITES: { value: PrioriteIntervention; label: string }[] = [
  { value: 'BASSE', label: 'Basse' },
  { value: 'NORMALE', label: 'Normale' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'URGENTE', label: 'Urgente' },
];

@Component({
  selector: 'app-interventions-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinner],
  templateUrl: './form.html',
  styleUrls: ['./form.scss']
})
export class InterventionsFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(InterventionsService);
  private readonly vehiculesService = inject(VehiculesService);
  private readonly notification = inject(NotificationService);

  readonly types = TYPES;
  readonly priorites = PRIORITES;

  /** Numero from route param — present → edit mode, absent → create mode */
  readonly editNumero = signal<string | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly currentStatus = signal<StatutIntervention | null>(null);
  readonly sourceIntervention = signal<Intervention | null>(null);
  readonly vehicules = signal<VehiculeListItem[]>([]);
  readonly draftDiagnostic = signal<string>('');

  readonly form = this.fb.group({
    vehiculeId: [null as number | null, [Validators.required, Validators.min(1)]],
    type: ['' as TypeIntervention | '', [Validators.required]],
    descriptionClient: ['', [Validators.required, Validators.minLength(25)]],
    priorite: ['' as PrioriteIntervention | '', [Validators.required]],
    dateDepot: ['', [Validators.required, this.notInFutureDateValidator]],
		coutEstime: [null as number | null, [Validators.required, Validators.min(0.01)]],
		dateRestitutionPrevue: ['', [Validators.required, this.notInPastDateValidator]],
    diagnostic: ['', [Validators.required, Validators.minLength(25)]],
    
  });

  readonly statusLabel = computed(() => {
    const status = this.currentStatus();
    if (!status) {
      return null;
    }
    return STATUT_LIBELLES[status];
  });

  readonly canEditForm = computed(() => {
    const status = this.currentStatus();
    if (!this.isEdit || !status) {
      return true;
    }
    return status !== 'TERMINEE' && status !== 'RESTITUEE' && status !== 'ANNULEE';
  });

  readonly canEditDevis = computed(() => {
    if (!this.isEdit) {
      return true;
    }
    const status = this.currentStatus();
    return status === 'DEVIS_A_VALIDER';
  });

  readonly canEditDateRestitutionPrevue = computed(() => {
    if (!this.isEdit) {
      return true;
    } 
    const status = this.currentStatus();
    return status === 'DEVIS_A_VALIDER';
  });
  
  readonly canEditDiagnostic = computed(() => {
    if (!this.isEdit) {
      return true;
    }
    const status = this.currentStatus();
    return status === 'DIAGNOSTIC_EN_COURS' || status === 'DEVIS_A_VALIDER';
  });

  readonly canEditVehicule = computed(() => this.isEdit && this.currentStatus() === 'RECUE');
  readonly canEditType = computed(() => !this.isEdit || this.currentStatus() === 'RECUE');
  readonly canEditDateDepot = computed(() => !this.isEdit || this.currentStatus() === 'RECUE');
  readonly canEditDescription = computed(() => {
    if (!this.isEdit) {
      return true;
    }
    const status = this.currentStatus();
    return status === 'DIAGNOSTIC_EN_COURS' || status === 'DEVIS_A_VALIDER' || status === 'RECUE';
  });
  readonly canEditPriorite = computed(() => {
    if (!this.isEdit) {
      return true;
    }
    const status = this.currentStatus();
    return status === 'RECUE' || status === 'DIAGNOSTIC_EN_COURS' || status === 'DEVIS_A_VALIDER' || status === 'EN_REPARATION';
  });

  get isEdit(): boolean {
    return !!this.editNumero();
  }

  ngOnInit(): void {
    this.form.patchValue({ dateDepot: this.todayDateValue() });
    this.draftDiagnostic.set(this.route.snapshot.queryParamMap.get('draftDiagnostic')?.trim() ?? '');

    const numero = this.route.snapshot.paramMap.get('numero');
    if (numero) {
      this.editNumero.set(numero);
      this.loadIntervention(numero);
      this.loadVehicules();
      return;
    }

    // Create mode: these fields are edit-only — disable to skip their validators
    this.form.controls.diagnostic.disable();
    this.form.controls.coutEstime.disable();
    this.form.controls.dateRestitutionPrevue.disable();

    this.loadVehicules();
  }

  private loadVehicules(): void {
    this.vehiculesService.list({}, 0, 200).subscribe({
      next: (page) => {
        this.vehicules.set(page.content.filter((v) => v.actif));
        this.syncVehiculeId();
      },
      error: () => this.vehicules.set([]),
    });
  }


  private loadIntervention(numero: string): void {
    this.loading.set(true);
    this.service.getByNumero(numero).subscribe({
      next: (iv: Intervention) => {
        this.sourceIntervention.set(iv);
        this.currentStatus.set(iv.statut);
        this.form.patchValue({
          type: iv.type,
          descriptionClient: iv.descriptionClient,
          priorite: iv.priorite,
          dateDepot: iv.dateDepot ? this.toDateInput(iv.dateDepot) : this.todayDateValue(),
          diagnostic: iv.diagnostic ?? '',
          coutEstime: iv.coutEstime,
          dateRestitutionPrevue: iv.dateRestitutionPrevue ? this.toDateInput(iv.dateRestitutionPrevue) : '',
        });
        this.syncVehiculeId();
        this.form.controls.vehiculeId.setValue(null);
        this.applyFieldRules();

        if (this.draftDiagnostic() && this.canEditDiagnostic()) {
          this.form.patchValue({ diagnostic: this.draftDiagnostic() });
          this.notification.info('Suggestion IA pre-remplie. Verifiez puis enregistrez manuellement.');
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/interventions');
      },
    });
  }

  private syncVehiculeId(): void{
    const iv = this.sourceIntervention();
    if (!iv) return;
    const matchVehicule = this.vehicules().find(
      v => v.immatriculationFictive === iv.vehicule.immatriculationFictive);
    if (matchVehicule) {
      this.form.controls.vehiculeId.setValue(matchVehicule.id);
    }
        console.log("v.immatriculationFictive::", this.vehicules())
        console.log("iv.vehicule.immatriculationFictive::", iv.vehicule.immatriculationFictive)
        console.log("match::", matchVehicule)
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  submit(): void {

    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;


    const raw = this.form.getRawValue();
    this.submitting.set(true);

    if (this.isEdit) {
      if (!this.canEditForm()) {
        this.notification.warning('Cette intervention est en lecture seule et ne peut pas être modifiée.');
        this.submitting.set(false);
        return;
      }

      const req = {
        vehiculeId: raw.vehiculeId!,
        type: raw.type as TypeIntervention,
        descriptionClient: raw.descriptionClient!,
        priorite: raw.priorite as PrioriteIntervention,
        dateDepot: raw.dateDepot ? this.toApiDate(raw.dateDepot) : new Date().toISOString(),
        diagnostic: this.canEditDiagnostic() ? (raw.diagnostic || null) : this.sourceIntervention()!.diagnostic,
        coutEstime: this.canEditDevis() ? raw.coutEstime : this.sourceIntervention()!.coutEstime,
        dateRestitutionPrevue: this.canEditDateRestitutionPrevue()
          ? (raw.dateRestitutionPrevue ? this.toApiDate(raw.dateRestitutionPrevue) : null)
          : this.sourceIntervention()!.dateRestitutionPrevue,
      };

      this.service.update(this.editNumero()!, req).subscribe({
        next: (iv) => {
          this.notification.success(`Intervention ${iv.numero} mise à jour.`);
          this.router.navigate(['/interventions', iv.numero]);
        },
        error: () => this.submitting.set(false),
      });
    } else {
      const req = {
        vehiculeId: raw.vehiculeId!,
        type: raw.type as TypeIntervention,
        descriptionClient: raw.descriptionClient!,
        priorite: raw.priorite as PrioriteIntervention,
        dateDepot: raw.dateDepot ? this.toApiDate(raw.dateDepot) : null,
      };

      this.service.create(req).subscribe({
        next: (iv) => {
          this.notification.success(`Intervention ${iv.numero} créée.`);
          this.router.navigate(['/interventions', iv.numero]);
        },
        error: () => this.submitting.set(false),
      });
    }
  }

  private applyFieldRules(): void {

    if (!this.canEditForm()) {
      this.form.disable();
      return;
    }

    this.form.enable();

    this.toggleControl(this.form.controls.vehiculeId, this.canEditVehicule());
    this.toggleControl(this.form.controls.type, this.canEditType());
    this.toggleControl(this.form.controls.dateDepot, this.canEditDateDepot());
    this.toggleControl(this.form.controls.descriptionClient, this.canEditDescription());
    this.toggleControl(this.form.controls.priorite, this.canEditPriorite());
    this.toggleControl(this.form.controls.diagnostic, this.canEditDiagnostic());
    this.toggleControl(this.form.controls.coutEstime, this.canEditDevis());
    this.toggleControl(this.form.controls.dateRestitutionPrevue, this.canEditDateRestitutionPrevue());
  }

  private toggleControl(control: AbstractControl, enabled: boolean): void {
    if (enabled) {
      control.enable();
      return;
    }
    control.disable();
  }

  private todayDateValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toDateInput(iso: string): string {
    return iso.slice(0, 10);
  }

  private toApiDate(value: string): string {
    return `${value}T00:00:00`;
  }

  private notInFutureDateValidator(control: AbstractControl): ValidationErrors | null {
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

    return selected.getTime() > today.getTime() ? { futureDate: true } : null;
  }

      allowOnlyNumber(event: KeyboardEvent): void {

        if (!this.isValidNumberKey(event.key)) {

            event.preventDefault();

        }
  }
  
      isValidNumberKey(key: string): boolean {

     return /^[0-9.]$/.test(key);

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
        

}

