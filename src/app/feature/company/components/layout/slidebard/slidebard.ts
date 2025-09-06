import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../../../core/service/session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-slidebard',
  imports: [CommonModule],
  templateUrl: './slidebard.html',
})
export class Slidebard {
  @Input() isOpen = true;
  @Output() logout = new EventEmitter<void>();
  private router = inject(Router);
  private sessionService = inject(SessionService);

  menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'home', path: '/company/dashboard' },
    { id: 'users', name: 'Usuarios', icon: 'users', path: '/company/users' },

    {
      id: 'settings',
      name: 'Configuración',
      icon: 'settings',
      path: '/company/settings',
    },
  ];

  activeItem = 'dashboard';
  onItemClick(itemId: string): void {
    const item = this.menuItems.find((menu) => menu.id === itemId);
    if (item) {
      this.activeItem = itemId;
      this.router.navigate([item.path]);
    }
  }

  onLogout(): void {
    this.sessionService.logout();
    this.logout.emit();
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }
}
