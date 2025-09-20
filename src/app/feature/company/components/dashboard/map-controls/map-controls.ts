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

  @Output() getLocation = new EventEmitter<void>();
  @Output() startRoute = new EventEmitter<void>();

  onGetLocation() {
    this.getLocation.emit();
  }

  onStartRoute() {
    this.startRoute.emit();
  }
}
