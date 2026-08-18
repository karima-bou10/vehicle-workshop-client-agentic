import { Injectable, signal } from '@angular/core';

type LanguageCode = 'fr' | 'en';

type Dictionary = Record<string, string>;

const translations: Record<LanguageCode, Dictionary> = {
  fr: {
    'app.title': 'Atelier',
    'menu.dashboard': 'Dashboard',
    'menu.interventions': 'Interventions',
    'menu.vehicules': 'Vehicules',
    'menu.mecaniciens': 'Mecaniciens',
    'sidebar.user': 'Connecte',
    'sidebar.logout': 'Déconnexion',
    'sidebar.toggle': 'Basculer la sidebar',
    'toolbar.language': 'Langue',
    'toolbar.theme': 'Theme',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'role.ROLE_USER': 'Conseiller',
    'role.ROLE_MANAGER': 'Responsable',
    'login.title': 'Connexion atelier',
    'login.subtitle': 'Acces au shell applicatif',
    'login.username': 'Nom utilisateur',
    'login.password': 'Mot de passe',
    'login.role': 'Role',
    'login.submit': 'Se connecter',
    'login.error.generic': 'Identifiants invalides',
    'errors.401': 'Session invalide. Veuillez vous reconnecter.',
    'errors.403': 'Action non autorisee.',
    'errors.404': 'Ressource introuvable.',
    'errors.500': 'Erreur serveur. Reessayez plus tard.',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Vue globale de latelier',
    'interventions.title': 'Interventions',
    'interventions.subtitle': 'Pilotage des interventions',
    'vehicules.title': 'Vehicules',
    'vehicules.subtitle': 'Parc et dossiers clients',
    'mecaniciens.title': 'Mecaniciens',
    'mecaniciens.subtitle': 'Charge atelier et affectations'
  },
  en: {
    'app.title': 'Workshop',
    'menu.dashboard': 'Dashboard',
    'menu.interventions': 'Interventions',
    'menu.vehicules': 'Vehicles',
    'menu.mecaniciens': 'Mechanics',
    'sidebar.user': 'Signed in',
    'sidebar.logout': 'Sign out',
    'sidebar.toggle': 'Toggle sidebar',
    'toolbar.language': 'Language',
    'toolbar.theme': 'Theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'role.ROLE_USER': 'Advisor',
    'role.ROLE_MANAGER': 'Manager',
    'login.title': 'Workshop sign in',
    'login.subtitle': 'Access the application shell',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.role': 'Role',
    'login.submit': 'Sign in',
    'login.error.generic': 'Invalid credentials',
    'errors.401': 'Session expired. Please sign in again.',
    'errors.403': 'You are not allowed to do this action.',
    'errors.404': 'Resource not found.',
    'errors.500': 'Server error. Please try again later.',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Global workshop overview',
    'interventions.title': 'Interventions',
    'interventions.subtitle': 'Intervention lifecycle view',
    'vehicules.title': 'Vehicles',
    'vehicules.subtitle': 'Fleet and customer files',
    'mecaniciens.title': 'Mechanics',
    'mecaniciens.subtitle': 'Workshop load and assignments'
  }
};

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly storageKey = 'vw.language';
  private readonly languageState = signal<LanguageCode>(this.resolveInitialLanguage());

  readonly activeLanguage = this.languageState.asReadonly();

  setLanguage(language: LanguageCode): void {
    this.languageState.set(language);
    localStorage.setItem(this.storageKey, language);
    document.documentElement.lang = language;
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageState() === 'fr' ? 'en' : 'fr');
  }

  t(key: string): string {
    const lang = this.languageState();
    return translations[lang][key] ?? key;
  }

  private resolveInitialLanguage(): LanguageCode {
    const storedLanguage = localStorage.getItem(this.storageKey);
    if (storedLanguage === 'fr' || storedLanguage === 'en') {
      document.documentElement.lang = storedLanguage;
      return storedLanguage;
    }

    document.documentElement.lang = 'fr';
    return 'fr';
  }
}
