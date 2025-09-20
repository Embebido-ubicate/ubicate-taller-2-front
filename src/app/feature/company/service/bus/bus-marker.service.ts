import { Injectable } from '@angular/core';
import { Bus } from '../../models/buses.model';

export interface BusWithPosition extends Bus {
  position: { lat: number; lng: number };
}

@Injectable({ providedIn: 'root' })
export class BusMarkerService {
  private advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

  getBusStatusColor(estado: string): string {
    const colors = {
      activo: '#10B981',
      en_ruta: '#3B82F6',
      parado: '#F59E0B',
      mantenimiento: '#F97316',
      inactivo: '#EF4444',
      offline: '#6B7280',
    };
    return colors[estado.toLowerCase() as keyof typeof colors] || '#6B7280';
  }

  async createBusMarkers(buses: BusWithPosition[], map: google.maps.Map) {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      this.clearMarkers();

      for (const bus of buses) {
        // Solo crear marcador si el bus está activo y tiene posición
        if (!bus.activo || !bus.position) continue;

        const pinElement = new PinElement({
          background: bus.color || this.getBusStatusColor(bus.estado),
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: bus.activo ? 1.2 : 0.8,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position: bus.position,
          title: `${bus.modelo} - ${bus.placa}`,
          content: pinElement.element,
        });

        this.advancedMarkers.push(marker);
      }
    } catch (error) {
      console.error('Error creating bus markers:', error);
    }
  }

  clearMarkers() {
    this.advancedMarkers.forEach((marker) => {
      if (marker.map) {
        marker.map = null;
      }
    });
    this.advancedMarkers = [];
  }

  getMarkers() {
    return this.advancedMarkers;
  }
}
