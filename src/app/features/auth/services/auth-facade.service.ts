import { Injectable, inject } from '@angular/core';
import { LoginCredentials } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authService = inject(AuthService);

  login(credentials: LoginCredentials) {
    return this.authService.login(credentials);
  }
}
