import { Component, computed, input } from '@angular/core';
import { StatutIntervention } from '../../../core/models/statut-intervention.model';

const STATUT_LIBELLES: Record<StatutIntervention, string> = {
  RECUE: 'Reçue',
  DIAGNOSTIC_EN_COURS: 'Diagnostiquée',
  DEVIS_A_VALIDER: 'Devis établi',
  EN_REPARATION: 'En réparation',
  TERMINEE: 'Terminée',
  RESTITUEE: 'Restituée',
  ANNULEE: 'Annulée',
};

@Component({
  selector: 'app-status-tag',
  standalone: true,
  template: `<span class="status" [class]="'status status--' + statut().toLowerCase()">{{ displayLabel() }}</span>`,
  styleUrls: ['./status-tag.scss']
})
export class StatusTag {
  readonly statut = input<StatutIntervention>('RECUE');
  readonly label = input<string | null>(null);

  readonly displayLabel = computed(() => this.label() ?? STATUT_LIBELLES[this.statut()] ?? this.statut());
}
