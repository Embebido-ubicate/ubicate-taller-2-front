import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-controls.html'
})
export class MapControlsComponent {
  @Input() isLocating = false;
  @Input() isCreatingRoute = false;

  @Output() startRoute = new EventEmitter<void>();

  onStartRoute() {
    this.startRoute.emit();
  }
}
