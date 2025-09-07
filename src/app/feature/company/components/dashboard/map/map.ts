// map.component.ts
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule, CommonModule],
  templateUrl: './map.html',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  center: google.maps.LatLngLiteral = { lat: -8.1116, lng: -79.0288 };
  zoom = 13;

  // Estado de geolocalización
  isLocating = false;
  currentLocation: google.maps.LatLngLiteral | null = null;

  // Advanced Markers
  private advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private currentLocationMarker: google.maps.marker.AdvancedMarkerElement | null =
    null;

  // Dimensiones del mapa
  mapWidth = '100%';
  mapHeight = '100%';

  private resizeObserver?: ResizeObserver;

  // Opciones profesionales para monitoreo con Map ID
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',
    mapId: 'DEMO_MAP_ID', // Map ID requerido para AdvancedMarkerElement
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };

  // Buses en diferentes estados
  buses = [
    {
      position: { lat: -8.1116, lng: -79.0288 },
      title: 'Bus #001 - En Ruta',
      status: 'activo',
      route: 'Ruta A',
    },
    {
      position: { lat: -8.108, lng: -79.024 },
      title: 'Bus #002 - Plaza de Armas',
      status: 'parado',
      route: 'Ruta B',
    },
    {
      position: { lat: -8.115, lng: -79.03 },
      title: 'Bus #003 - Sin Conexión',
      status: 'offline',
      route: 'Ruta C',
    },
  ];

  async ngAfterViewInit() {
    this.resizeMap();
    this.setupResizeObserver();

    // Esperar a que el mapa esté listo y crear los marcadores avanzados
    setTimeout(async () => {
      await this.createAdvancedMarkers();
    }, 500);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.clearMarkers();
  }

  async createAdvancedMarkers() {
    try {
      // Importar la librería de marcadores avanzados
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (!this.map.googleMap) return;

      // Limpiar marcadores existentes
      this.clearMarkers();

      // Crear marcadores para cada bus
      for (const bus of this.buses) {
        const pinElement = new PinElement({
          background: this.getBusColor(bus.status),
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          scale: 1.2,
        });

        const marker = new AdvancedMarkerElement({
          map: this.map.googleMap,
          position: bus.position,
          title: bus.title,
          content: pinElement.element,
        });

        this.advancedMarkers.push(marker);
      }
    } catch (error) {
      console.error('Error creating advanced markers:', error);
    }
  }

  clearMarkers() {
    this.advancedMarkers.forEach((marker) => {
      if (marker.map) {
        marker.map = null;
      }
    });
    this.advancedMarkers = [];

    if (this.currentLocationMarker) {
      this.currentLocationMarker.map = null;
      this.currentLocationMarker = null;
    }
  }

  getBusColor(status: string): string {
    const colors = {
      activo: '#10B981',
      parado: '#F59E0B',
      offline: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }

  setupResizeObserver() {
    if (this.mapContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeMap();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  resizeMap() {
    if (this.mapContainer && this.map) {
      setTimeout(() => {
        const containerWidth = this.mapContainer.nativeElement.offsetWidth;
        const containerHeight = this.mapContainer.nativeElement.offsetHeight;

        this.mapWidth = containerWidth + 'px';
        this.mapHeight = containerHeight + 'px';

        // Trigger resize en Google Maps
        if (this.map.googleMap) {
          google.maps.event.trigger(this.map.googleMap, 'resize');
          this.map.googleMap.setCenter(this.center);
        }
      }, 100);
    }
  }

  // Obtener ubicación actual con AdvancedMarkerElement
  async getCurrentLocation() {
    this.isLocating = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Centrar el mapa en la ubicación actual
          this.center = this.currentLocation;
          this.zoom = 16;

          if (this.map && this.map.googleMap) {
            this.map.googleMap.setCenter(this.currentLocation);
            this.map.googleMap.setZoom(16);

            // Crear marcador de ubicación actual con AdvancedMarkerElement
            await this.createCurrentLocationMarker();
          }

          this.isLocating = false;
        },
        (error) => {
          console.error('Error getting location:', error);
          this.isLocating = false;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert(
                'Acceso a ubicación denegado. Permite el acceso para usar esta función.'
              );
              break;
            case error.POSITION_UNAVAILABLE:
              alert('Ubicación no disponible. Verifica tu conexión GPS.');
              break;
            case error.TIMEOUT:
              alert('Tiempo de espera agotado. Intenta nuevamente.');
              break;
            default:
              alert('Error desconocido al obtener ubicación.');
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      alert('Geolocalización no es compatible con este navegador.');
      this.isLocating = false;
    }
  }

  async createCurrentLocationMarker() {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (!this.map.googleMap || !this.currentLocation) return;

      // Remover marcador anterior si existe
      if (this.currentLocationMarker) {
        this.currentLocationMarker.map = null;
      }

      // Crear pin especial para ubicación actual
      const pinElement = new PinElement({
        background: '#3B82F6',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.5,
        glyph: '📍',
      });

      this.currentLocationMarker = new AdvancedMarkerElement({
        map: this.map.googleMap,
        position: this.currentLocation,
        title: 'Tu ubicación actual',
        content: pinElement.element,
      });
    } catch (error) {
      console.error('Error creating current location marker:', error);
    }
  }
}
