import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private currentLocationSubject =
    new BehaviorSubject<google.maps.LatLngLiteral | null>(null);
  private isLocatingSubject = new BehaviorSubject<boolean>(false);

  currentLocation$ = this.currentLocationSubject.asObservable();
  isLocating$ = this.isLocatingSubject.asObservable();

  private currentLocationMarker: google.maps.marker.AdvancedMarkerElement | null =
    null;

  getCurrentLocation(): Promise<google.maps.LatLngLiteral> {
    return new Promise((resolve, reject) => {
      this.isLocatingSubject.next(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.currentLocationSubject.next(location);
            this.isLocatingSubject.next(false);
            resolve(location);
          },
          (error) => {
            console.error('Error getting location:', error);
            this.isLocatingSubject.next(false);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        this.isLocatingSubject.next(false);
        reject(new Error('Geolocalización no compatible'));
      }
    });
  }

  async createLocationMarker(
    map: google.maps.Map,
    location: google.maps.LatLngLiteral
  ) {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (this.currentLocationMarker) {
        this.currentLocationMarker.map = null;
      }

      const pinElement = new PinElement({
        background: '#3B82F6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.5,
        glyph: '📍',
      });

      this.currentLocationMarker = new AdvancedMarkerElement({
        map,
        position: location,
        title: 'Tu ubicación actual',
        content: pinElement.element,
      });
    } catch (error) {
      console.error('Error creating location marker:', error);
    }
  }

  clearLocationMarker() {
    if (this.currentLocationMarker) {
      this.currentLocationMarker.map = null;
      this.currentLocationMarker = null;
    }
  }
}
