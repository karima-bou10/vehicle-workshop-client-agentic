import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, debounceTime, map } from 'rxjs';
import { Page } from '../../../../core/models/page.model';
import { LanguageService } from '../../../../core/services/language-service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { Mecanicien, Specialite, SPECIALITE_LIBELLES, SPECIALITES } from '../../models/mecanicien-view.model';
import { MecaniciensService } from '../../services/mecaniciens.service';

type DisponibiliteFilter = 'TOUS' | 'DISPONIBLE' | 'INDISPONIBLE';
type SpecialiteFilter = Specialite | '';

@Component({
  selector: 'app-mecaniciens-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PaginatedTable,
    EmptyState,
    LoadingSpinner,
    ConfirmationDialog,
    HasRoleDirective,
  ],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class MecaniciensListPage implements OnInit {
  private readonly service = inject(MecaniciensService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly languageService = inject(LanguageService);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal<Page<Mecanicien> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);

  readonly disponibiliteFilter = signal<DisponibiliteFilter>('TOUS');

  readonly nomInputValue = signal('');
  readonly nomQuery = signal('');
  readonly specialiteQuery = signal<SpecialiteFilter>('');
  readonly specialites = SPECIALITES;

  readonly deactivateTarget = signal<Mecanicien | null>(null);
  readonly deactivating = signal(false);
  readonly blockedMecanicien = signal<Mecanicien | null>(null);
  readonly togglingId = signal<number | null>(null);

  readonly tableHeaders = ['Nom', 'Spécialité', 'Disponibilité', 'Actions'];

  readonly isSearchActive = computed(
    () => this.nomQuery().trim().length > 0 || this.specialiteQuery() !== ''
  );

  private readonly nomInput$ = new Subject<string>();
  private lastAppliedNom = '';
  private requestSeq = 0;

  constructor() {
    this.nomInput$
      .pipe(
        debounceTime(350),
        map((value) => value.trim()),
        takeUntilDestroyed()
      )
      .subscribe((nom) => {
        if (nom === this.lastAppliedNom) return;
        this.lastAppliedNom = nom;
        this.nomQuery.set(nom);
        if (nom || this.specialiteQuery()) {
          this.disponibiliteFilter.set('TOUS');
        }
        this.resetToFirstPageAndLoad();
      });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const p = Number(params['page'] ?? 0);
      const s = Number(params['size'] ?? 20);
      this.currentPage.set(p);
      this.pageSize.set(s);
      this.load(p, s);
    });
  }

  private buildRequest(page: number, size: number): Observable<Page<Mecanicien>> {
    const nom = this.nomQuery().trim();
    const specialite = this.specialiteQuery();
    if (nom || specialite) {
      return this.service.search(nom || null, specialite || null, page, size);
    }
    switch (this.disponibiliteFilter()) {
      case 'DISPONIBLE':
        return this.service.listDisponibles(page, size);
      case 'INDISPONIBLE':
        return this.service.listIndisponibles(page, size);
      default:
        return this.service.list(page, size);
    }
  }

  load(page = this.currentPage(), size = this.pageSize()): void {
    this.loading.set(true);
    this.loadError.set(false);
    const seq = ++this.requestSeq;
    this.buildRequest(page, size).subscribe({
      next: (data) => {
        if (seq !== this.requestSeq) return;
        this.page.set(data);
        this.loading.set(false);
      },
      error: () => {
        if (seq !== this.requestSeq) return;
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  /** Recharge la page courante en respectant le filtre/recherche actif ; revient à la page précédente si elle devient vide. */
  private reloadRespectingContext(): void {
    const p = this.currentPage();
    const s = this.pageSize();
    this.loading.set(true);
    this.loadError.set(false);
    const seq = ++this.requestSeq;
    this.buildRequest(p, s).subscribe({
      next: (data) => {
        if (seq !== this.requestSeq) return;
        if (data.content.length === 0 && p > 0) {
          this.goToPage(p - 1);
          return;
        }
        this.page.set(data);
        this.loading.set(false);
      },
      error: () => {
        if (seq !== this.requestSeq) return;
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private resetToFirstPageAndLoad(): void {
    const alreadyFirstPage = this.currentPage() === 0;
    this.currentPage.set(0);
    if (alreadyFirstPage) {
      this.load(0, this.pageSize());
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: 0, size: this.pageSize() },
        queryParamsHandling: 'merge',
      });
    }
  }

  goToPage(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p, size: this.pageSize() },
      queryParamsHandling: 'merge',
    });
  }

  setDisponibiliteFilter(filter: DisponibiliteFilter): void {
    if (this.isSearchActive() || this.disponibiliteFilter() === filter) return;
    this.disponibiliteFilter.set(filter);
    this.resetToFirstPageAndLoad();
  }

  onNomInput(value: string): void {
    this.nomInputValue.set(value);
    this.nomInput$.next(value);
  }

  onSpecialiteChange(value: string): void {
    this.specialiteQuery.set(value as SpecialiteFilter);
    if (value) {
      this.disponibiliteFilter.set('TOUS');
    }
    this.resetToFirstPageAndLoad();
  }

  resetSearch(): void {
    this.nomInputValue.set('');
    this.nomQuery.set('');
    this.lastAppliedNom = '';
    this.specialiteQuery.set('');
    this.disponibiliteFilter.set('TOUS');
    this.resetToFirstPageAndLoad();
  }

  toggleDisponibilite(item: Mecanicien): void {
    this.togglingId.set(item.id);
    this.service.updateDisponibilite(item.id, { disponible: !item.disponible }).subscribe({
      next: (updated) => {
        this.notification.success(
          `${updated.nom} est maintenant ${updated.disponible ? 'disponible' : 'indisponible'}.`
        );
        this.togglingId.set(null);
        this.load(this.currentPage(), this.pageSize());
      },
      error: () => this.togglingId.set(null),
    });
  }

  confirmDeactivate(item: Mecanicien): void {
    this.deactivateTarget.set(item);
  }

  cancelDeactivate(): void {
    if (this.deactivating()) return;
    this.deactivateTarget.set(null);
  }

  doDeactivate(): void {
    const target = this.deactivateTarget();
    if (!target || this.deactivating()) return;
    this.deactivating.set(true);
    this.service.desactiver(target.id).subscribe({
      next: () => {
        this.notification.success(`${target.nom} a été archivé.`);
        this.deactivateTarget.set(null);
        this.deactivating.set(false);
        this.reloadRespectingContext();
      },
      error: (err: HttpErrorResponse) => {
        this.deactivating.set(false);
        this.deactivateTarget.set(null);
        if (err.status === 409) {
          this.blockedMecanicien.set(target);
        }
      },
    });
  }

  closeBlockedDialog(): void {
    this.blockedMecanicien.set(null);
  }

  blockedMessage(item: Mecanicien): string {
    return `${item.nom} est actuellement affecté à des interventions en cours. Veuillez le déaffecter de ces interventions avant de le retirer de l'équipe.`;
  }

  deactivateDialogMessage(item: Mecanicien): string {
    return `Archiver ${item.nom} ? Il n'apparaîtra plus dans la liste mais ses interventions passées restent inchangées.`;
  }

  specialiteLibelle(specialite: string): string {
    return SPECIALITE_LIBELLES[specialite as keyof typeof SPECIALITE_LIBELLES] ?? specialite;
  }

  get totalPages(): number {
    return this.page()?.totalPages ?? 0;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}

