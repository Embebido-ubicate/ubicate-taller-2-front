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
import { Subject, takeUntil } from 'rxjs';
import {
  RouteService,
  CreateRouteRequest,
} from '../../../service/route/route.service';

import {
  RouteCreatorComponent,
  RouteFormData,
} from '../route-creator/route-creator';
import { MapControlsComponent } from '../map-controls/map-controls';
import { RouteInstructionsComponent } from '../route-instructions/route-instructions';
import { BusListComponent } from '../../bus-mapa/bus-list/bus-list';

import { LocationService } from '../../../service/location/location.service';
import { RouteMapService } from '../../../service/route/route-map.service';
import { Bus } from '../../../models/buses.model';
import { Route } from '../../../models/route.model';
import { RouteListComponent } from '../route-list/route-list';
import { BusMarkerService } from '../../../service/bus/bus-marker.service';


@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [
    GoogleMapsModule,
    CommonModule,
    RouteCreatorComponent,
    MapControlsComponent,
    RouteInstructionsComponent,
    BusListComponent,
    RouteListComponent,
  ],
  templateUrl: './map-container.html',
})
export class MapContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  private destroy$ = new Subject<void>();
  private routeService = inject(RouteService);
  private busMarkerService = inject(BusMarkerService);
  private locationService = inject(LocationService);
  private routeMapService = inject(RouteMapService);

  center: google.maps.LatLngLiteral = { lat: -8.1116, lng: -79.0288 };
  zoom = 13;
  mapWidth = '100%';
  mapHeight = '100%';

  isLocating = false;
  currentLocation: google.maps.LatLngLiteral | null = null;

  isCreatingRoute = false;
  hasOrigin = false;
  hasDestination = false;
  isAddingWaypoints = false;
  newRoute: RouteFormData = { nombre: '', codigo: '', colorHex: '#FF0000' };

  showBusList = false;
  showRouteList = false;

  private busPositions = new Map([
    [1, { lat: -8.1116, lng: -79.0288 }],
    [2, { lat: -8.108, lng: -79.024 }],
    [3, { lat: -8.115, lng: -79.03 }],
    [4, { lat: -8.113, lng: -79.026 }],
    [5, { lat: -8.117, lng: -79.032 }],
  ]);

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

  async ngAfterViewInit() {
    this.resizeMap();
    this.setupResizeObserver();
    this.subscribeToLocationService();

    setTimeout(async () => {
      this.setupMapClickListener();
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.busMarkerService.clearMarkers();
    this.locationService.clearLocationMarker();
    this.clearRouteMarkers();
    this.routeMapService.clearAllRoutesFromMap();
  }

  // ============ SUSCRIPCIONES Y CONFIGURACIÓN ============
  private subscribeToLocationService() {
    this.locationService.currentLocation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((location) => {
        this.currentLocation = location;
      });

    this.locationService.isLocating$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLocating) => {
        this.isLocating = isLocating;
      });
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

  private setupMapClickListener() {
    if (this.map.googleMap) {
      this.directionsRenderer.setMap(this.map.googleMap);

      this.directionsRenderer.addListener('directions_changed', () => {
        console.log('Ruta modificada por arrastre');
      });

      this.map.googleMap.addListener('click', (event: any) => {
        console.log('Map clicked:', event.latLng?.toString());
        console.log('isCreatingRoute:', this.isCreatingRoute);
        console.log('showBusList:', this.showBusList);
        console.log('showRouteList:', this.showRouteList);

        // IMPORTANTE: Cerrar listas si están abiertas y no estamos creando ruta
        if (!this.isCreatingRoute && (this.showBusList || this.showRouteList)) {
          this.showBusList = false;
          this.showRouteList = false;
          return;
        }

        // Solo proceder si estamos en modo de creación de ruta
        if (this.isCreatingRoute && event.latLng) {
          console.log('Procesando click para ruta...');
          this.handleRouteClick(event.latLng);
        } else if (
          this.isAddingWaypoints &&
          event.latLng &&
          this.hasDestination &&
          this.isCreatingRoute
        ) {
          console.log('Agregando waypoint...');
          this.addWaypoint(event.latLng);
        }
      });
    }
  }

  // ============ MÉTODOS DE UBICACIÓN ============
  async getCurrentLocation() {
    try {
      const location = await this.locationService.getCurrentLocation();
      this.center = location;
      this.zoom = 16;

      if (this.map && this.map.googleMap) {
        this.map.googleMap.setCenter(location);
        this.map.googleMap.setZoom(16);
        await this.locationService.createLocationMarker(
          this.map.googleMap,
          location
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Error al obtener ubicación');
    }
  }


  toggleBusList() {
    this.showBusList = !this.showBusList;
    if (this.showBusList) {
      this.showRouteList = false;
    }
  }

  onSelectBus(bus: Bus) {
    const position = this.busPositions.get(bus.id);
    if (position) {
      this.center = position;
      this.zoom = 17;

      if (this.map && this.map.googleMap) {
        this.map.googleMap.setCenter(position);
        this.map.googleMap.setZoom(17);

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h4 class="font-semibold text-sm">${bus.modelo}</h4>
              <p class="text-xs text-gray-600">Placa: ${bus.placa}</p>
              <p class="text-xs text-gray-600">Estado: ${bus.estado}</p>
              <p class="text-xs text-gray-600">Capacidad: ${bus.capacidad} personas</p>
            </div>
          `,
        });

        infoWindow.setPosition(position);
        infoWindow.open(this.map.googleMap);

        setTimeout(() => {
          infoWindow.close();
        }, 5000);
      }
    } else {
      console.warn(`No se encontró posición para el bus ${bus.id}`);
    }

    this.showBusList = false;
  }

  onCloseBusList() {
    this.showBusList = false;
  }

  // ============ MÉTODOS DE RUTAS PARA LISTAR ============
  toggleRouteList() {
    this.showRouteList = !this.showRouteList;
    if (this.showRouteList) {
      this.showBusList = false;
    }
  }

  onSelectRoute(route: Route) {
    try {
      const [lat, lng] = route.origen.split(',').map(Number);
      this.center = { lat, lng };
      this.zoom = 14;

      if (this.map && this.map.googleMap) {
        this.map.googleMap.setCenter({ lat, lng });
        this.map.googleMap.setZoom(14);

        // Mostrar la ruta en el mapa
        this.routeMapService.showRouteOnMap(route, this.map.googleMap);

        // Crear un info window para mostrar información de la ruta
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h4 class="font-semibold text-sm">${route.nombre}</h4>
              <p class="text-xs text-gray-600">Código: ${route.codigo}</p>
              <p class="text-xs text-gray-600">Estado: ${route.estado}</p>
              <p class="text-xs text-gray-600">Descripción: ${
                route.descripcion || 'Sin descripción'
              }</p>
            </div>
          `,
        });

        infoWindow.setPosition({ lat, lng });
        infoWindow.open(this.map.googleMap);

        // Cerrar info window después de 5 segundos
        setTimeout(() => {
          infoWindow.close();
        }, 5000);
      }

      this.showRouteList = false;
    } catch (error) {
      console.error('Error selecting route:', error);
      alert('Error al seleccionar la ruta');
    }
  }

  onCloseRouteList() {
    this.showRouteList = false;
  }
  startCreatingRoute() {
    console.log('Iniciando creación de ruta...');

    // CERRAR todas las listas primero
    this.showBusList = false;
    this.showRouteList = false;

    // Configurar modo de creación
    this.isCreatingRoute = true;
    this.hasOrigin = false;
    this.hasDestination = false;
    this.isAddingWaypoints = false;

    // Limpiar marcadores anteriores
    this.clearRouteMarkers();

    // Configurar nueva ruta
    this.newRoute = {
      nombre: '',
      codigo: '',
      colorHex: this.generateRandomColor(),
    };

    console.log(
      'Modo creación activado. Haz click en el mapa para colocar el origen.'
    );
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
      alert('Completa nombre y código de la ruta');
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

    // Obtener coordenadas correctamente
    const originPos = this.originMarker.position as google.maps.LatLng;
    const destinationPos = this.destinationMarker
      .position as google.maps.LatLng;

    let originLat, originLng, destLat, destLng;

    if (typeof originPos.lat === 'function') {
      originLat = originPos.lat();
      originLng = originPos.lng();
    } else {
      originLat = (originPos as any).lat;
      originLng = (originPos as any).lng;
    }

    if (typeof destinationPos.lat === 'function') {
      destLat = destinationPos.lat();
      destLng = destinationPos.lng();
    } else {
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
      empresaId: 1,
      descripcion: `Ruta desde ${this.originMarker.title} hasta ${this.destinationMarker.title}`,
    };

    console.log('Enviando datos de ruta:', routeData);

    this.routeService.createRoute(routeData).subscribe({
      next: (response) => {
        console.log('Ruta creada exitosamente:', response);
        alert('Ruta guardada exitosamente');
        this.cancelRouteCreation();

        // Recargar la lista de rutas si está visible
        if (this.showRouteList) {
          this.routeMapService.loadRoutes();
        }
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

  // ============ UTILIDADES ============
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
      '#E91E63',
      '#9C27B0',
      '#673AB7',
      '#3F51B5',
      '#2196F3',
      '#03A9F4',
      '#00BCD4',
      '#009688',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ============ MÉTODOS ADICIONALES PARA UX ============
  centerOnTrujillo() {
    this.center = { lat: -8.1116, lng: -79.0288 };
    this.zoom = 13;

    if (this.map && this.map.googleMap) {
      this.map.googleMap.setCenter(this.center);
      this.map.googleMap.setZoom(this.zoom);
    }
  }
}
