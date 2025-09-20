import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import {
  CreateRouteRequest,
  RouteService,
} from '../../../service/route.service';
import {
  RouteCreatorComponent,
  RouteFormData,
} from '../route-creator/route-creator';
import { MapControlsComponent } from '../map-controls/map-controls';
import { RouteInstructionsComponent } from '../route-instructions/route-instructions';

@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [
    GoogleMapsModule,
    CommonModule,
    RouteCreatorComponent,
    MapControlsComponent,
    RouteInstructionsComponent,
  ],
  templateUrl: './map-container.html',
})
export class MapContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  private routeService = inject(RouteService);

  // Estados del mapa
  center: google.maps.LatLngLiteral = { lat: -8.1116, lng: -79.0288 };
  zoom = 13;
  mapWidth = '100%';
  mapHeight = '100%';

  // Estados de ubicación
  isLocating = false;
  currentLocation: google.maps.LatLngLiteral | null = null;

  // Estados de rutas
  isCreatingRoute = false;
  hasOrigin = false;
  hasDestination = false;
  isAddingWaypoints = false;
  newRoute: RouteFormData = { nombre: '', codigo: '', colorHex: '#FF0000' };

  // Google Maps internos
  private advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private currentLocationMarker: google.maps.marker.AdvancedMarkerElement | null =
    null;
  private originMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  private destinationMarker: google.maps.marker.AdvancedMarkerElement | null =
    null;
  private waypointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private directionsService = new google.maps.DirectionsService();
  private directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#2563eb',
      strokeWeight: 5,
      strokeOpacity: 0.8,
    },
  });
  private waypoints: google.maps.LatLng[] = [];
  private resizeObserver?: ResizeObserver;

  // Opciones del mapa
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',
    mapId: 'DEMO_MAP_ID',
  };

  // Datos de buses
  buses = [
    {
      position: { lat: -8.1116, lng: -79.0288 },
      title: 'Bus #001',
      status: 'activo',
      route: 'Ruta A',
    },
    {
      position: { lat: -8.108, lng: -79.024 },
      title: 'Bus #002',
      status: 'parado',
      route: 'Ruta B',
    },
    {
      position: { lat: -8.115, lng: -79.03 },
      title: 'Bus #003',
      status: 'offline',
      route: 'Ruta C',
    },
  ];

  async ngAfterViewInit() {
    this.resizeMap();
    this.setupResizeObserver();
    setTimeout(async () => {
      await this.createAdvancedMarkers();
      this.setupMapClickListener();
    }, 500);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.clearMarkers();
    this.clearRouteMarkers();
  }

  async getCurrentLocation() {
    this.isLocating = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.center = this.currentLocation;
          this.zoom = 16;
          if (this.map && this.map.googleMap) {
            this.map.googleMap.setCenter(this.currentLocation);
            this.map.googleMap.setZoom(16);
            await this.createCurrentLocationMarker();
          }
          this.isLocating = false;
        },
        (error) => {
          console.error('Error getting location:', error);
          this.isLocating = false;
          alert('Error al obtener ubicación');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocalización no es compatible con este navegador.');
      this.isLocating = false;
    }
  }

  startCreatingRoute() {
    this.isCreatingRoute = true;
    this.hasOrigin = false;
    this.hasDestination = false;
    this.isAddingWaypoints = false;
    this.clearRouteMarkers();
    this.newRoute = {
      nombre: '',
      codigo: '',
      colorHex: this.generateRandomColor(),
    };
  }

  cancelRouteCreation() {
    this.isCreatingRoute = false;
    this.hasOrigin = false;
    this.hasDestination = false;
    this.isAddingWaypoints = false;
    this.clearRouteMarkers();
  }

  saveRoute() {
    if (!this.newRoute.nombre || !this.newRoute.codigo) {
      alert('Completa nombre y código');
      return;
    }

    const directions = this.directionsRenderer.getDirections();
    if (!directions || !directions.routes || directions.routes.length === 0) {
      alert('Crea una ruta primero - debe tener origen y destino');
      return;
    }

    if (!this.originMarker || !this.destinationMarker) {
      alert('Debe marcar origen y destino en el mapa');
      return;
    }

    const route = directions.routes[0];
    const polyline = route.overview_polyline;

    // CORRECCIÓN: Obtener coordenadas correctamente
    const originPos = this.originMarker.position as google.maps.LatLng;
    const destinationPos = this.destinationMarker
      .position as google.maps.LatLng;

    // Verificar si tiene métodos o propiedades
    let originLat, originLng, destLat, destLng;

    if (typeof originPos.lat === 'function') {
      originLat = originPos.lat();
      originLng = originPos.lng();
    } else {
      // Si es un objeto con propiedades lat/lng
      originLat = (originPos as any).lat;
      originLng = (originPos as any).lng;
    }

    if (typeof destinationPos.lat === 'function') {
      destLat = destinationPos.lat();
      destLng = destinationPos.lng();
    } else {
      // Si es un objeto con propiedades lat/lng
      destLat = (destinationPos as any).lat;
      destLng = (destinationPos as any).lng;
    }

    const routeData: CreateRouteRequest = {
      nombre: this.newRoute.nombre,
      codigo: this.newRoute.codigo,
      colorHex: this.newRoute.colorHex,
      polyline: polyline,
      origen: `${originLat},${originLng}`,
      destino: `${destLat},${destLng}`,
      empresaId: 1, // CORREGIDO: mantener como number simple
      descripcion: `Ruta desde ${this.originMarker.title} hasta ${this.destinationMarker.title}`,
    };

    console.log('Enviando datos de ruta:', routeData);

    // DEBUG: Agregar log adicional para ver exactamente qué se está enviando
    console.log(
      'EmpresaId enviado:',
      routeData.empresaId,
      'tipo:',
      typeof routeData.empresaId
    );

    this.routeService.createRoute(routeData).subscribe({
      next: (response) => {
        console.log('Ruta creada exitosamente:', response);
        alert('Ruta guardada exitosamente');
        this.cancelRouteCreation();
      },
      error: (error) => {
        console.error('Error creando ruta:', error);
        let errorMessage = 'Error desconocido';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        alert(`Error al guardar la ruta: ${errorMessage}`);
      },
    });
  }

  updateRouteColor() {
    if (this.hasDestination && this.directionsRenderer) {
      try {
        const directions = this.directionsRenderer.getDirections();
        if (directions && directions.routes && directions.routes.length > 0) {
          this.directionsRenderer.setOptions({
            draggable: true,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: this.newRoute.colorHex,
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          });
          const currentDirections = directions;
          this.directionsRenderer.setDirections(currentDirections);
        }
      } catch (error) {
        console.log('Error actualizando color:', error);
      }
    }
  }

  clearRouteMarkers() {
    if (this.originMarker) {
      this.originMarker.map = null;
      this.originMarker = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.map = null;
      this.destinationMarker = null;
    }
    this.waypointMarkers.forEach((marker) => {
      if (marker.map) {
        marker.map = null;
      }
    });
    this.waypointMarkers = [];
    this.waypoints = [];
    if (this.directionsRenderer) {
      try {
        this.directionsRenderer.setMap(null);
        this.directionsRenderer = new google.maps.DirectionsRenderer({
          draggable: true,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: this.newRoute.colorHex || '#2563eb',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
        if (this.map?.googleMap) {
          this.directionsRenderer.setMap(this.map.googleMap);
        }
      } catch (error) {
        console.log('Error limpiando DirectionsRenderer:', error);
      }
    }
    this.hasOrigin = false;
    this.hasDestination = false;
  }

  toggleWaypointMode() {
    this.isAddingWaypoints = !this.isAddingWaypoints;
    console.log(
      'Modo waypoints:',
      this.isAddingWaypoints ? 'ACTIVADO' : 'DESACTIVADO'
    );
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FFFF00',
      '#FF00FF',
      '#00FFFF',
      '#800080',
      '#FFA500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getBusColor(status: string): string {
    const colors = {
      activo: '#10B981',
      parado: '#F59E0B',
      offline: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }

  private async createAdvancedMarkers() {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (!this.map.googleMap) return;

      this.clearMarkers();

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

  private clearMarkers() {
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

  private setupResizeObserver() {
    if (this.mapContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeMap();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  private resizeMap() {
    if (this.mapContainer && this.map) {
      setTimeout(() => {
        const containerWidth = this.mapContainer.nativeElement.offsetWidth;
        const containerHeight = this.mapContainer.nativeElement.offsetHeight;

        this.mapWidth = containerWidth + 'px';
        this.mapHeight = containerHeight + 'px';

        if (this.map.googleMap) {
          google.maps.event.trigger(this.map.googleMap, 'resize');
        }
      }, 100);
    }
  }

  private async createCurrentLocationMarker() {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (!this.map.googleMap || !this.currentLocation) return;

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
        map: this.map.googleMap,
        position: this.currentLocation,
        title: 'Tu ubicación actual',
        content: pinElement.element,
      });
    } catch (error) {
      console.error('Error creating current location marker:', error);
    }
  }

  private setupMapClickListener() {
    if (this.map.googleMap) {
      this.directionsRenderer.setMap(this.map.googleMap);

      this.directionsRenderer.addListener('directions_changed', () => {
        console.log('Ruta modificada por arrastre');
      });

      this.map.googleMap.addListener('click', (event: any) => {
        if (this.isCreatingRoute && event.latLng) {
          this.handleRouteClick(event.latLng);
        } else if (
          this.isAddingWaypoints &&
          event.latLng &&
          this.hasDestination
        ) {
          this.addWaypoint(event.latLng);
        }
      });
    }
  }

  private async handleRouteClick(latLng: google.maps.LatLng) {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      if (!this.hasOrigin) {
        const pin = new PinElement({
          background: '#10B981',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          glyph: 'A',
          scale: 1.5,
        });

        this.originMarker = new AdvancedMarkerElement({
          map: this.map.googleMap,
          position: latLng,
          title: 'Origen',
          content: pin.element,
          gmpDraggable: true,
        });

        this.originMarker.addListener('dragend', () => {
          if (this.hasDestination) {
            this.calculateSimpleRoute();
          }
        });

        this.hasOrigin = true;
        console.log('Origen establecido:', latLng.toString());
      } else if (!this.hasDestination) {
        const pin = new PinElement({
          background: '#EF4444',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          glyph: 'B',
          scale: 1.5,
        });

        this.destinationMarker = new AdvancedMarkerElement({
          map: this.map.googleMap,
          position: latLng,
          title: 'Destino',
          content: pin.element,
          gmpDraggable: true,
        });

        this.destinationMarker.addListener('dragend', () => {
          this.calculateSimpleRoute();
        });

        this.hasDestination = true;
        console.log('Destino establecido:', latLng.toString());
        this.calculateSimpleRoute();
      }
    } catch (error) {
      console.error('Error creando marcadores de ruta:', error);
    }
  }

  private calculateSimpleRoute() {
    if (!this.originMarker || !this.destinationMarker) {
      console.error('Faltan marcadores de origen o destino');
      return;
    }

    const waypointsForRoute = this.waypoints.map(
      (point: google.maps.LatLng) => ({
        location: point,
        stopover: true,
      })
    );

    const request: google.maps.DirectionsRequest = {
      origin: this.originMarker.position as google.maps.LatLng,
      destination: this.destinationMarker.position as google.maps.LatLng,
      waypoints: waypointsForRoute,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };

    console.log('Calculando ruta con request:', request);

    this.directionsService.route(request, (result, status) => {
      if (
        status === google.maps.DirectionsStatus.OK &&
        result &&
        this.map?.googleMap
      ) {
        this.directionsRenderer.setOptions({
          draggable: true,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: this.newRoute.colorHex,
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        this.directionsRenderer.setMap(this.map.googleMap);
        this.directionsRenderer.setDirections(result);
        console.log('Ruta calculada exitosamente');
      } else {
        console.error('Error calculando ruta:', status, result);
        alert(`Error al calcular la ruta: ${status}`);
      }
    });
  }

  private async addWaypoint(latLng: google.maps.LatLng) {
    try {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;

      this.waypoints.push(latLng);

      const pin = new PinElement({
        background: '#FFAA00',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        glyph: this.waypoints.length.toString(),
        scale: 1.2,
      });

      const waypointMarker = new AdvancedMarkerElement({
        map: this.map.googleMap,
        position: latLng,
        title: `Punto intermedio ${this.waypoints.length}`,
        content: pin.element,
        gmpDraggable: true,
      });

      waypointMarker.addListener('dragend', () => {
        const index = this.waypointMarkers.indexOf(waypointMarker);
        if (index !== -1) {
          this.waypoints[index] = waypointMarker.position as google.maps.LatLng;
          this.calculateSimpleRoute();
        }
      });

      this.waypointMarkers.push(waypointMarker);
      this.calculateSimpleRoute();
      console.log(
        `Waypoint ${this.waypoints.length} agregado:`,
        latLng.toString()
      );
    } catch (error) {
      console.error('Error agregando waypoint:', error);
    }
  }
}
