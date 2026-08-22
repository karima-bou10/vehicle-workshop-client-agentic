export type Specialite =
  | 'MOTEUR'
  | 'DIAGNOSTIC'
  | 'FREINAGE'
  | 'CARROSSERIE'
  | 'ELECTRONIQUE'
  | 'ELECTRICITE'
  | 'PNEUMATIQUES'
  | 'CLIMATISATION';

export interface Mecanicien {
  id: number;
  nom: string;
  specialite: Specialite;
  disponible: boolean;
  actif: boolean;
}

export interface MecanicienCreateRequest {
  nom: string;
  specialite: Specialite;
}

export interface MecanicienUpdateRequest {
  nom: string;
  specialite: Specialite;
}

export interface MecanicienDisponibiliteRequest {
  disponible: boolean;
}

// Libellés FR pour affichage (cohérent avec le module interventions)
export const SPECIALITE_LIBELLES: Record<Specialite, string> = {
  MOTEUR: 'Moteur',
  DIAGNOSTIC: 'Diagnostic',
  FREINAGE: 'Freinage',
  CARROSSERIE: 'Carrosserie',
  ELECTRONIQUE: 'Électronique',
  ELECTRICITE: 'Électricité',
  PNEUMATIQUES: 'Pneumatiques',
  CLIMATISATION: 'Climatisation',
};

export const SPECIALITES: { value: Specialite; label: string }[] = (
  Object.keys(SPECIALITE_LIBELLES) as Specialite[]
).map((value) => ({ value, label: SPECIALITE_LIBELLES[value] }));
