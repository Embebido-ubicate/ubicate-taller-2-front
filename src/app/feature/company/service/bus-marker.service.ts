import { Injectable } from '@angular/core';

export interface Bus {
  position: { lat: number; lng: number };
  title: string;
  status: 'activo' | 'parado' | 'offline';
  route: string;
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class BusMarkerService {
  private advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

  getBusColor(status: string): string {
    const colors = {
      activo: '#10B981',
      parado: '#F59E0B',
      offline: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }

  async createBusMarkers(buses: Bus[], map: google.maps.Map) {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      this.clearMarkers();

      for (const bus of buses) {
        const pinElement = new PinElement({
          background: this.getBusColor(bus.status),
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 1.2,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position: bus.position,
          title: bus.title,
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
