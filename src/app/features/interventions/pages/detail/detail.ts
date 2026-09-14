import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { PaginatedTable } from '../../../../shared/ui/paginated-table/paginated-table';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { WorkflowStepper } from '../../../../shared/ui/workflow-stepper/workflow-stepper';
import { HasRoleDirective } from '../../../../shared/directives/has-role.directive';
import { NotificationService } from '../../../../core/services/notification.service';
import { Page } from '../../../../core/models/page.model';
import {
  HistoriqueInterventionResponse,
  Intervention,
  PRIORITE_LIBELLES,
  STATUT_LIBELLES,
  StatutIntervention,
  TYPE_LIBELLES,
  TransitionRequest,
} from '../../models/intervention-view.model';
import { AiDiagnosticProposition } from '../../models/ai-diagnostic-proposition.model';
import { InterventionsService } from '../../services/interventions.service';
import { SPECIALITE_LIBELLES } from '../../../mecaniciens/models/mecanicien.model';
import { timeout } from 'rxjs';

type DialogState = {
  kind: 'transition' | 'archive';
  title: string;
  message: string;
  variant: 'info' | 'alert';
  confirmLabel: string;
  cancelLabel: string;
  requireReason: boolean;
  reasonPlaceholder?: string;
  targetStatus?: StatutIntervention;
};

@Component({
  selector: 'app-interventions-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoadingSpinner,
    StatusTag,
    ConfirmationDialog,
    WorkflowStepper,
    PaginatedTable,
    EmptyState,
    HasRoleDirective,
  ],
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss']
})
export class InterventionsDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(InterventionsService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly intervention = signal<Intervention | null>(null);
  readonly history = signal<Page<HistoriqueInterventionResponse> | null>(null);
  readonly related = signal<Page<Intervention> | null>(null);
  readonly historyLoading = signal(false);
  readonly relatedLoading = signal(false);
  readonly actionBusy = signal(false);
  readonly dialogState = signal<DialogState | null>(null);
  readonly aiLoading = signal(false);
  readonly aiPanelOpen = signal(false);
  readonly aiProposal = signal<AiDiagnosticProposition | null>(null);
  readonly aiDiagnosticDraft = signal('');
  readonly aiEditing = signal(false);

  readonly specialiteLibelles = SPECIALITE_LIBELLES;

  readonly currentStepIndex = computed(() => {
    const status = this.intervention()?.statut;
    console.log('Current status:', status);
    switch (status) {
      case 'RECUE':
        return 0;
      case 'DIAGNOSTIC_EN_COURS':
        return 1;
      case 'DEVIS_A_VALIDER':
        return 2;
      case 'EN_REPARATION':
        return 3;
      case 'TERMINEE':
        return 4;
      case 'RESTITUEE':
        return 6;
      case 'ANNULEE':
        return -1;
      default:
        return 0;
    }
  });

  readonly workflowStepsLabel = computed(() => {
    const iv = this.intervention();
    const daigLabel = iv?.diagnostic?.trim()  ? 'Diagnostiquée' : 'Diagnostic en cours';
    const devisLabel = iv?.coutEstime !== null ? 'Devis établi' : 'Devis à valider';
    return [
      'Reçue',
      daigLabel,
      devisLabel,
      'En réparation',
      'Terminée',
      'Restituée',
    ];
  });

  readonly isCancelled = computed(() => this.intervention()?.statut === 'ANNULEE');

  readonly historyPageRange = computed(() => {
    const totalPages = this.history()?.totalPages ?? 0;
    return Array.from({ length: totalPages }, (_, index) => index);
  });

  readonly relatedPageRange = computed(() => {
    const totalPages = this.related()?.totalPages ?? 0;
    return Array.from({ length: totalPages }, (_, index) => index);
  });

  readonly canUseAiAssistant = computed(() => {
    const statut = this.intervention()?.statut;
    return statut === 'RECUE' || statut === 'DIAGNOSTIC_EN_COURS';
  });
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const numero: string = params['numero'];
      console.log('Route params:', numero);
      if (!numero) return;
      this.loadIntervention(numero);
    });
  }

  private loadIntervention(numero: string): void {
    this.aiPanelOpen.set(false);
    this.aiProposal.set(null);
    this.aiDiagnosticDraft.set('');
    this.aiEditing.set(false);
    this.loading.set(true);
    this.service.getByNumero(numero).subscribe({
      next: (data) => {
        this.intervention.set(data);
        this.loading.set(false);
        this.loadHistory(numero);
        this.loadRelated(numero);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/interventions');
      },
    });
  }

  private loadHistory(numero: string, page = 0): void {
    this.historyLoading.set(true);
    this.service.historique(numero, page).subscribe({
      next: (data) => {
        this.history.set(data);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  private loadRelated(numero: string, page = 0): void {
    this.relatedLoading.set(true);
    this.service.autresInterventionsVehicule(numero, page).subscribe({
      next: (data) => {
        this.related.set(data);
        this.relatedLoading.set(false);
      },
      error: () => this.relatedLoading.set(false),
    });
  }

  openTransitionDialog(targetStatus: StatutIntervention): void {
    const iv = this.intervention();
    if (!iv) return;

    if (targetStatus === 'ANNULEE') {
      this.dialogState.set({
        kind: 'transition',
        title: 'Annuler l\'intervention ?',
        message: `L\'annulation de ${iv.numero} est définitive. L\'intervention passera en état terminal Annulée.`,
        variant: 'alert',
        confirmLabel: 'Confirmer l\'annulation',
        cancelLabel: 'Retour',
        requireReason: true,
        reasonPlaceholder: 'Motif obligatoire',
        targetStatus,
      });
      return;
    }

    if (targetStatus === 'RESTITUEE') {
      this.dialogState.set({
        kind: 'transition',
        title: 'Restituer l\'intervention ?',
        message: `Confirmer la restitution de ${iv.numero} ? L\'intervention doit être terminée avant restitution.`,
        variant: 'info',
        confirmLabel: 'Restituer',
        cancelLabel: 'Retour',
        requireReason: false,
        targetStatus,
      });
      return;
    }

    this.dialogState.set({
      kind: 'transition',
      title: this.transitionTitle(targetStatus),
      message: this.transitionMessage(iv.numero, targetStatus),
      variant: 'info',
      confirmLabel: 'Confirmer',
      cancelLabel: 'Retour',
      requireReason: false,
      targetStatus,
    });
  }

  openArchiveDialog(): void {
    const iv = this.intervention();
    if (!iv) return;

    this.dialogState.set({
      kind: 'archive',
      title: 'Archiver l\'intervention ?',
      message: `Archiver ${iv.numero} sur ${iv.vehicule.marque} ${iv.vehicule.modele} (${iv.vehicule.immatriculationFictive}) ? Aucune donnée n\'est supprimée, l\'intervention sort seulement des listes actives.`,
      variant: 'info',
      confirmLabel: 'Archiver',
      cancelLabel: 'Retour',
      requireReason: false,
    });
  }

  closeDialog(): void {
    if (this.actionBusy()) return;
    this.dialogState.set(null);
  }

  confirmDialog(reason: string): void {
    const iv = this.intervention();
    const dialog = this.dialogState();
    if (!iv || !dialog || this.actionBusy()) return;

    if (dialog.kind === 'archive') {
      this.actionBusy.set(true);
      this.service.archive(iv.numero).subscribe({
        next: () => {
          this.notification.success(`Intervention ${iv.numero} archivée.`);
          this.router.navigateByUrl('/interventions');
        },
        error: () => {
          this.actionBusy.set(false);
          this.dialogState.set(null);
        },
      });
      return;
    }

    if (!dialog.targetStatus) return;

    const request: TransitionRequest = { statutCible: dialog.targetStatus };
    if (dialog.targetStatus === 'ANNULEE') {
      request.motifAnnulation = reason;
    }

    this.actionBusy.set(true);
    this.service.transition(iv.numero, request).subscribe({
      next: () => {
        const nextStatus = dialog.targetStatus as StatutIntervention;
        if (nextStatus === 'ANNULEE') {
          this.notification.success(`Intervention ${iv.numero} annulée.`);
        } else if (nextStatus === 'RESTITUEE') {
          this.notification.success(`Intervention ${iv.numero} restituée.`);
        } else {
          this.notification.success(`Intervention ${iv.numero} mise à jour.`);
        }

        this.dialogState.set(null);
        this.actionBusy.set(false);
        this.loadIntervention(iv.numero);
      },
      error: () => {
        this.actionBusy.set(false);
        this.dialogState.set(null);
      },
    });
  }

  goToHistoryPage(page: number): void {
    const numero = this.intervention()?.numero;
    if (!numero) return;
    this.loadHistory(numero, page);
  }

  goToRelatedPage(page: number): void {
    const numero = this.intervention()?.numero;
    if (!numero) return;
    this.loadRelated(numero, page);
  }

  canAnnuler(statut: StatutIntervention): boolean {
    return statut === 'RECUE' || statut === 'DIAGNOSTIC_EN_COURS' || statut === 'DEVIS_A_VALIDER';
  }

  canArchive(statut: StatutIntervention): boolean {
    return statut === 'RESTITUEE' || statut === 'ANNULEE';
  }

  canModify(statut: StatutIntervention): boolean {
    return statut !== 'TERMINEE' && statut !== 'RESTITUEE' && statut !== 'ANNULEE';
  }

  launchAiAssistant(): void {
    const iv = this.intervention();
    console.log('Launching AI assistant for intervention:', iv?.numero);
    if (!iv || !iv.numero || this.aiLoading()) return;

    this.aiLoading.set(true);
    this.service.assistantDiagnostic(iv.numero).subscribe({
      next: (proposal) => {
        this.aiLoading.set(false);
        this.aiProposal.set(proposal);
        this.aiDiagnosticDraft.set(this.buildDiagnosticDraft(proposal));
        this.aiEditing.set(false);
        this.aiPanelOpen.set(true);

        if (this.isFallbackProposal(proposal)) {
          this.notification.warning('Assistant indisponible, réessayez plus tard.');
        }
        this.cdr.detectChanges;
      },
      error: () => {
        this.aiLoading.set(false);
        this.notification.error('Impossible de recuperer la proposition IA pour le moment.');
        this.cdr.detectChanges;
      },
    });
  }

  onAiDraftInput(value: string): void {
    this.aiDiagnosticDraft.set(value);
  }

  enableAiEdit(): void {
    this.aiEditing.set(true);
    this.notification.info('Vous pouvez modifier la suggestion IA avant utilisation.');
  }

  acceptAiSuggestion(): void {
    const iv = this.intervention();
    if (!iv) return;

    const draftDiagnostic = this.aiDiagnosticDraft().trim();
    if (!draftDiagnostic) {
      this.notification.warning('Le texte propose est vide. Modifiez la proposition avant de l\'utiliser.');
      return;
    }

    this.aiPanelOpen.set(false);

    if (iv.statut === 'RECUE') {
      this.router.navigate(['/interventions/diagnostic'], {
        queryParams: {
          numero: iv.numero,
          draftDiagnostic,
        },
      });
      return;
    }

    this.router.navigate(['/interventions', iv.numero, 'modifier'], {
      queryParams: {
        draftDiagnostic,
      },
    });
    this.notification.info('Suggestion IA pre-remplie. Enregistrez ensuite via le formulaire standard.');
  }

  ignoreAiSuggestion(): void {
    this.aiPanelOpen.set(false);
    this.aiProposal.set(null);
    this.aiDiagnosticDraft.set('');
    this.aiEditing.set(false);
  }

  formatWorkflowDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  statutLibelle(s: string): string {
    return STATUT_LIBELLES[s as keyof typeof STATUT_LIBELLES] ?? s;
  }

  typeLibelle(t: string): string {
    return TYPE_LIBELLES[t as keyof typeof TYPE_LIBELLES] ?? t;
  }

  prioriteLibelle(p: string): string {
    return PRIORITE_LIBELLES[p as keyof typeof PRIORITE_LIBELLES] ?? p;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatMontant(v: number | null): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
  }

  private transitionTitle(targetStatus: StatutIntervention): string {
    switch (targetStatus) {
      case 'TERMINEE':
        return 'Marquer l\'intervention terminée ?';
      case 'RESTITUEE':
        return 'Restituer l\'intervention ?';
      default:
        return 'Confirmer la transition ?';
    }
  }

  private transitionMessage(numero: string, targetStatus: StatutIntervention): string {
    switch (targetStatus) {
      case 'TERMINEE':
        return `Confirmer le passage de ${numero} au statut Terminée ?`;
      default:
        return `Confirmer le passage de ${numero} au statut ${this.statutLibelle(targetStatus)} ?`;
    }
  }

  private isFallbackProposal(proposal: AiDiagnosticProposition): boolean {
    const message = proposal.reformulation?.toLowerCase() ?? '';
    return message.includes('indisponible') || message.includes('reessayez plus tard');
  }

  private buildDiagnosticDraft(proposal: AiDiagnosticProposition): string {
    const hypotheses = proposal.hypotheses.map((item, index) => `${index + 1}. ${item}`).join('\n');
    const pointsControle = proposal.pointsControle.map((item, index) => `${index + 1}. ${item}`).join('\n');

    return [
      `Reformulation: ${proposal.reformulation}`,
      '',
      'Hypotheses de diagnostic:',
      hypotheses,
      '',
      'Points de controle:',
      pointsControle,
      '',
      `Priorite suggeree: ${this.prioriteLibelle(proposal.prioriteSuggeree)}`,
    ].join('\n');
  }
}

