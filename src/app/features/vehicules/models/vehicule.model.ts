import { StatutIntervention } from '../../../core/models/statut-intervention.model';

export interface VehiculeListItem {
  id: number;
  immatriculationFictive: string;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  clientFictif: string;
  actif: boolean;
}

export interface VehiculeRequest {
  immatriculationFictive: string;
  marque: string;
  modele: string;
  annee: number | null;
  kilometrage: number | null;
  clientFictif: string;
}

export interface VehiculeIntervention {
  numero: string;
  descriptionClient: string;
  statut: StatutIntervention;
  dateDepot: string;
}
