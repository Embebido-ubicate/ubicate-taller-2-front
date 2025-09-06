import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Slidebard } from '../components/layout/slidebard/slidebard';
import { Navbard } from '../components/layout/navbard/navbard';


@Component({
  selector: 'app-main-layout',
  standalone:true,
  imports: [CommonModule, RouterOutlet, Slidebard, Navbard],
  templateUrl: './main-layout.html'
})
export class MainLayout {
  sidebarOpen = true;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onLogout(): void {
    // El logout se maneja en el SessionService del Slidebard
    console.log('Logout event received');
  }
}
