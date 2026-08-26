import type { PrioriteIntervention } from './intervention-view.model';

export interface AiDiagnosticProposition {
  reformulation: string;
  hypotheses: string[];
  pointsControle: string[];
  prioriteSuggeree: PrioriteIntervention;
}
