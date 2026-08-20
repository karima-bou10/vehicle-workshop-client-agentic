import { MecanicienAffectationRequest } from '../../interventions/models/intervention-view.model';
export interface MecanicienListItem {
        id: number;
        nom: string;
        specialite: Specialite;
        disponible: boolean;
        actif: boolean;
}

export type Specialite =
    'MOTEUR'
    | 'DIAGNOSTIC'
    | 'FREINAGE'
    | 'CARROSSERIE'
    | 'ELECTRONIQUE'
    | 'ELECTRICITE'
    | 'PNEUMATIQUES'
    | 'CLIMATISATION';
        
export const SPECIALITE_LIBELLES: Record<Specialite, string> = {
        MOTEUR: 'Moteur',
        CARROSSERIE: 'Carrosserie',
        ELECTRONIQUE: 'Électronique',
        DIAGNOSTIC: 'Diagnostic',
        FREINAGE: 'Freinage',
        PNEUMATIQUES: 'Pneumatiques',
        CLIMATISATION: 'Climatisation',
        ELECTRICITE: 'Électricité',
};
