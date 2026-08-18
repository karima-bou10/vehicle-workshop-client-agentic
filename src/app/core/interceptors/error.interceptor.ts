import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notif = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // La page de login gère elle-même ses erreurs (identifiants invalides).
      const estLogin = req.url.includes('/auth/login');

      switch (err.status) {
        case 0:
          notif.error('Serveur injoignable. Vérifiez votre connexion.');
          break;

        case 401:
          if (!estLogin) {
            notif.warning('Session expirée, veuillez vous reconnecter.');
            auth.logout(true);
          }
          break;

        case 403:
          notif.warning("Vous n'avez pas les droits pour cette action.");
          router.navigate(['/dashboard']);
          break;

        case 404:
          if (!estLogin) notif.error('Ressource introuvable.');
          break;

        case 409:
          notif.error(messageBackend(err) ?? 'Conflit avec une donnée existante.');
          break;

        case 422:
        case 400:
          notif.error(messageBackend(err) ?? 'Données invalides.');
          break;

        default:
          if (err.status >= 500) {
            notif.error('Erreur serveur. Réessayez dans un instant.');
          }
      }

      return throwError(() => err);
    }),
  );
};

/** Extrait le message d'un ErrorResponse Spring (@RestControllerAdvice). */
function messageBackend(err: HttpErrorResponse): string | null {
  const body = err.error;
  if (!body) return null;
  if (typeof body === 'string') return body;
  return body.message ?? body.error ?? null;
}