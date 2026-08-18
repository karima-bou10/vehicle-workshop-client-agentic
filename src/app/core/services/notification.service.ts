import { Injectable, signal } from '@angular/core';

export type NotificationTon = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  ton: NotificationTon;
  message: string;
}

const DUREE_MS = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private compteur = 0;
  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  success(message: string) { this.push('success', message); }
  error(message: string)   { this.push('error', message); }
  warning(message: string) { this.push('warning', message); }
  info(message: string)    { this.push('info', message); }

  dismiss(id: number): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  private push(ton: NotificationTon, message: string): void {
    const id = ++this.compteur;
    this._notifications.update(list => [...list, { id, ton, message }]);
    setTimeout(() => this.dismiss(id), DUREE_MS);
  }
}