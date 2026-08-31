import type { StatutIntervention } from '../../../core/models/statut-intervention.model';
import type { MecanicienListItem } from '../../mecaniciens/models/mecanicien.model';

export type { StatutIntervention };

export type TypeIntervention =
  | 'DIAGNOSTIC'
  | 'REVISION'
  | 'REPARATION'
  | 'CONTROLE'
  | 'PNEUMATIQUES'
  | 'AUTRE';

export type PrioriteIntervention = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
export interface VehiculeResume {
  immatriculationFictive: string;
  marque: string;
  modele: string;
  annee: number;
}

export interface Intervention {
  numero: string;
  vehicule: VehiculeResume;
  type: TypeIntervention;
  descriptionClient: string;
  diagnostic: string | null;
  statut: StatutIntervention;
  priorite: PrioriteIntervention;
  coutEstime: number | null;
  dateDepot: string;
  dateRestitutionPrevue: string | null;
  dateCloture: string | null;
  mecanicien: MecanicienListItem | null;
  actif: boolean;
  enRetard: boolean;
}

export interface InterventionListFilters {
  statut?: StatutIntervention | null;
  mecanicienId?: number | null;
  immatriculation?: string | null;
  q?: string | null;
  enRetard?: boolean | null;
}

export interface TransitionRequest {
  statutCible: StatutIntervention;
  diagnostic?: string | null;
  coutEstime?: number | null;
  dateRestitutionPrevue?: string | null;
  motifAnnulation?: string | null;
}

export interface MecanicienAffectationRequest {
  mecanicienId: number;
}

export interface HistoriqueInterventionResponse {
  ancienStatut: StatutIntervention;
  nouveauStatut: StatutIntervention;
  auteur: string;
  date: string;
  commentaire: string | null;
}

export interface InterventionCreateRequest {
  vehiculeId: number;
  type: TypeIntervention;
  descriptionClient: string;
  priorite: PrioriteIntervention;
  dateDepot?: string | null;
}

export interface InterventionUpdateRequest {
  type: TypeIntervention;
  descriptionClient: string;
  priorite: PrioriteIntervention;
  dateDepot: string;
  diagnostic: string | null;
  coutEstime: number | null;
  dateRestitutionPrevue: string | null;
}

// Libellés FR pour affichage
export const TYPE_LIBELLES: Record<TypeIntervention, string> = {
  DIAGNOSTIC: 'Diagnostic',
  REVISION: 'Révision',
  REPARATION: 'Réparation',
  CONTROLE: 'Contrôle',
  PNEUMATIQUES: 'Pneumatiques',
  AUTRE: 'Autre',
};

export const PRIORITE_LIBELLES: Record<PrioriteIntervention, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

export const STATUT_LIBELLES: Record<StatutIntervention, string> = {
  RECUE: 'Reçue',
  DIAGNOSTIC_EN_COURS: 'Diagnostiquée',
  DEVIS_A_VALIDER: 'Devis établi',
  EN_REPARATION: 'En réparation',
  TERMINEE: 'Terminée',
  RESTITUEE: 'Restituée',
  ANNULEE: 'Annulée',
};

