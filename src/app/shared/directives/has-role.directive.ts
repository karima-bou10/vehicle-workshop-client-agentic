import { Directive, effect, TemplateRef, ViewContainerRef, inject, input } from '@angular/core';
import { Role } from '../../core/models/role.model';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly appHasRole = input.required<Role | Role[]>();

  constructor() {
    effect(() => {
      const expectedRoles = this.appHasRole();
      const roles = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
      const hasRole = this.authService.hasAnyRole(roles);

      this.viewContainerRef.clear();
      if (hasRole) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      }
    });
  }
}
