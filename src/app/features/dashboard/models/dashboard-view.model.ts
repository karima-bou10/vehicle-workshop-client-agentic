import type { StatutIntervention } from '../../../core/models/statut-intervention.model';
import type { TypeIntervention } from '../../interventions/models/intervention-view.model';
import type { Specialite } from '../../mecaniciens/models/mecanicien.model';

export interface DashboardKpis {
  recuesAujourdHui: number;
  enDiagnosticEnCours: number;
  enReparation: number;
  terminees: number;
  retardsRestitution: number;
}

export interface MecanicienChargeItem {
  id: number;
  nom: string;
  specialite: Specialite;
  disponible: boolean;
  chargeActive: number;
}

export interface StatutRepartitionItem {
  statut: StatutIntervention;
  total: number;
}

export interface TypeRepartitionItem {
  type: TypeIntervention;
  total: number;
}

export interface VolumeJournalierItem {
  date: string;
  recues: number;
  terminees: number;
}
