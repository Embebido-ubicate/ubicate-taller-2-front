import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bus } from '../../../models/buses.model';

@Component({
  selector: 'app-bus-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bus-list.html',
})
export class BusListComponent {
  @Input() buses: Bus[] = [];
  @Input() isVisible: boolean = false;
  @Output() selectBus = new EventEmitter<Bus>();
  @Output() close = new EventEmitter<void>();

  onSelectBus(bus: Bus) {
    this.selectBus.emit(bus);
  }

  onClose() {
    this.close.emit();
  }

  // Método para trackBy usando el ID real del bus
  trackByBus(index: number, bus: Bus): number {
    return bus.id;
  }

  getStatusColor(estado: string): string {
    const colors = {
      activo: 'bg-green-400',
      en_ruta: 'bg-blue-400',
      parado: 'bg-yellow-400',
      mantenimiento: 'bg-orange-400',
      inactivo: 'bg-red-400',
      offline: 'bg-gray-400',
    };
    return colors[estado.toLowerCase() as keyof typeof colors] || 'bg-gray-400';
  }

  getStatusText(estado: string): string {
    const texts = {
      activo: 'Activo',
      en_ruta: 'En Ruta',
      parado: 'Parado',
      mantenimiento: 'Mantenimiento',
      inactivo: 'Inactivo',
      offline: 'Offline',
    };
    return texts[estado.toLowerCase() as keyof typeof texts] || estado;
  }

  // Método para obtener el título del bus
  getBusTitle(bus: Bus): string {
    return `${bus.modelo} - ${bus.placa}`;
  }

  // Método para obtener información adicional
  getBusInfo(bus: Bus): string {
    return `Capacidad: ${bus.capacidad} | ${bus.anio}`;
  }
}
