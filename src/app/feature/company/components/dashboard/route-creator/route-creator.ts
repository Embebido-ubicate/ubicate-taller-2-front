import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RouteFormData {
  nombre: string;
  codigo: string;
  colorHex: string;
}

@Component({
  selector: 'app-route-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-creator.html',
})
export class RouteCreatorComponent {
  @Input() routeData: RouteFormData = {
    nombre: '',
    codigo: '',
    colorHex: '#FF0000',
  };
  @Input() hasDestination = false;
  @Input() isAddingWaypoints = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() colorChange = new EventEmitter<void>();
  @Output() toggleWaypoints = new EventEmitter<void>();

  get isFormValid(): boolean {
    return !!(
      this.routeData.nombre &&
      this.routeData.codigo &&
      this.hasDestination
    );
  }

  onCancel() {
    this.cancel.emit();
  }

  onSave() {
    if (this.isFormValid) {
      this.save.emit();
    }
  }

  onClear() {
    this.clear.emit();
  }

  onColorChange() {
    this.colorChange.emit();
  }

  onToggleWaypoints() {
    this.toggleWaypoints.emit();
  }
}
