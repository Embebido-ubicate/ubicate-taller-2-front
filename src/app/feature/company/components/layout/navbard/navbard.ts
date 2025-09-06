import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbard.html',
})
export class Navbard {
  @Output() menuToggle = new EventEmitter<void>();
  @Output() themeToggle = new EventEmitter<void>();

  notifications = 3;
  isDarkMode = false;

  onMenuClick(): void {
    this.menuToggle.emit();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeToggle.emit();

    // Aplicar tema al documento
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
