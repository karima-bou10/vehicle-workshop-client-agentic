import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import { Specialite, SPECIALITES } from '../../models/mecanicien-view.model';
import { MecaniciensService } from '../../services/mecaniciens.service';

@Component({
  selector: 'app-mecaniciens-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinner],
  templateUrl: './form.html',
  styleUrls: ['./form.scss']
})
export class MecaniciensFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MecaniciensService);
  private readonly notification = inject(NotificationService);

  readonly specialites = SPECIALITES;

  /** id from route param — present → edit mode, absent → create mode */
  readonly editId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal(false);

  readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    specialite: ['' as Specialite | '', [Validators.required]],
  });

  get isEdit(): boolean {
    return this.editId() !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.loadMecanicien(id);
    }
  }

  private loadMecanicien(id: number): void {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: (m) => {
        if (!m.actif) {
          this.notification.warning('Ce mécanicien est désactivé et ne peut pas être modifié.');
          this.router.navigateByUrl(`/mecaniciens/${id}`);
          return;
        }
        this.form.patchValue({ nom: m.nom, specialite: m.specialite });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    const request = {
      nom: raw.nom!.trim(),
      specialite: raw.specialite as Specialite,
    };

    this.submitting.set(true);

    if (this.isEdit) {
      this.service.update(this.editId()!, request).subscribe({
        next: (m) => {
          this.notification.success(`Mécanicien ${m.nom} mis à jour.`);
          this.router.navigateByUrl(`/mecaniciens/${m.id}`);
        },
        error: () => this.submitting.set(false),
      });
    } else {
      this.service.create(request).subscribe({
        next: (m) => {
          this.notification.success(`Mécanicien ${m.nom} créé.`);
          this.router.navigateByUrl(`/mecaniciens/${m.id}`);
        },
        error: () => this.submitting.set(false),
      });
    }
  }
}
