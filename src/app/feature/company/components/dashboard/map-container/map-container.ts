import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { Subject, catchError, of, finalize } from 'rxjs';
import { MapControlsComponent } from '../map-controls/map-controls';
import { RouteInstructionsComponent } from '../route-instructions/route-instructions';
import { BusListComponent } from '../../bus-mapa/bus-list/bus-list';
import { RouteListComponent } from '../route-list/route-list';
import { LocationService } from '../../../service/location/location.service';
import { RouteMapService } from '../../../service/route/route-map.service';
import {
  BusMarkerService,
  BusWithPosition,
} from '../../../service/bus/bus-marker.service';
import { BusService } from '../../../service/bus/bus.service';
import { Bus } from '../../../models/buses.model';
import { RouteCreator } from '../route-creator/route-creator';
import { RouteResponse } from '../../../models/route.model';
import { IconsModule } from '../../../icons.module';

@Component({
  selector: 'app-map-container',
  standalone: true,
  imports: [
    GoogleMapsModule,
    CommonModule,
    RouteCreator,
    MapControlsComponent,
    RouteInstructionsComponent,
    BusListComponent,
    RouteListComponent,
    IconsModule,
  ],
  templateUrl: './map-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  private destroy$ = new Subject<void>();
  private busMarkerService = inject(BusMarkerService);
  private busService = inject(BusService);
  private locationService = inject(LocationService);
  private routeMapService = inject(RouteMapService);
  private cdr = inject(ChangeDetectorRef);

  googleMapReady = false;
  mapInitialized = false;

  center: google.maps.LatLngLiteral = { lat: -8.1116, lng: -79.0288 };
  zoom = 15;
  mapWidth = '100%';
  mapHeight = '100%';

  isLocating = false;
  isCreatingRoute = false;
  showBusList = false;
  showRouteList = false;
  isLoadingBuses = false;
  isLoadingRoutes = false;

  buses: BusWithPosition[] = [];
  routes: RouteResponse[] = [];
  currentLocation: google.maps.LatLngLiteral | null = null;
  selectedRouteId: number | null = null;

  get safeGoogleMap(): google.maps.Map | null {
    return this.map?.googleMap ?? null;
  }

  get isMapReady(): boolean {
    return !!this.map?.googleMap && this.googleMapReady;
  }

  mapOptions: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',
    minZoom: 10,
    maxZoom: 20,
    center: this.center,
    zoom: this.zoom,
  };

  async ngAfterViewInit() {
    let attempts = 0;
    while (!this.map?.googleMap && attempts < 30) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    if (!this.map?.googleMap) return;

    this.googleMapReady = true;
    this.mapInitialized = true;
    this.setupBasicListeners();
    this.subscribeToServices();
    this.loadInitialData();
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.busMarkerService.clearMarkers();
    this.locationService.clearLocationMarker();
    this.routeMapService.clearAllRoutesFromMap();
  }

  private setupBasicListeners() {
    if (!this.safeGoogleMap) return;

    this.safeGoogleMap.addListener('click', () => {
      if (!this.isCreatingRoute && (this.showBusList || this.showRouteList)) {
        this.showBusList = false;
        this.showRouteList = false;
        this.cdr.markForCheck();
      }
    });
  }

  private subscribeToServices() {
    this.locationService.isLocating$.subscribe((v) => {
      this.isLocating = v;
      this.cdr.markForCheck();
    });

    this.routeMapService.routes$.subscribe((routes) => {
      this.routes = routes;
      this.cdr.markForCheck();
    });

    this.routeMapService.loading$.subscribe((loading) => {
      this.isLoadingRoutes = loading;
      this.cdr.markForCheck();
    });
  }

  private loadInitialData() {
    this.routeMapService.loadRoutes().subscribe();
  }

  private loadBusesByRoute(rutaId: number) {
    this.busService
      .getBuses(0, 100, rutaId)
      .pipe(
        catchError(() => of({ content: [] })),
        finalize(() => {
          this.isLoadingBuses = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((response) => {
        const buses = response.content || [];

        const busesWithPosition = buses
          .filter((b: any) => {
            const hasCoords =
              b.latitud !== null &&
              b.longitud !== null &&
              !isNaN(b.latitud) &&
              !isNaN(b.longitud);

            const isActive = b.activo === true && b.estado !== 'INACTIVO';

            return hasCoords && isActive;
          })
          .map((b: any) => ({
            ...b,
            position: { lat: b.latitud, lng: b.longitud },
          }));

        this.buses = busesWithPosition;

        if (this.isMapReady && busesWithPosition.length > 0) {
          this.busMarkerService.clearMarkers();
          this.busMarkerService.createBusMarkers(
            busesWithPosition,
            this.safeGoogleMap!
          );
        }
      });
  }

  getCurrentLocation() {
    if (this.isLocating) return;

    this.locationService.getCurrentLocation().then((location) => {
      if (this.safeGoogleMap) {
        this.locationService.createLocationMarker(this.safeGoogleMap, location);
      }
    });
  }

  toggleBusList() {
    this.showBusList = !this.showBusList;
    if (this.showBusList) this.showRouteList = false;
    this.cdr.markForCheck();
  }

  toggleRouteList() {
    this.showRouteList = !this.showRouteList;
    if (this.showRouteList) this.showBusList = false;
    this.cdr.markForCheck();
  }

  onSelectBus(_: Bus) {
    this.showBusList = false;
    this.cdr.markForCheck();
  }

  onSelectRouteId(routeId: number) {
    if (!this.safeGoogleMap) {
      this.showRouteList = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingRoutes = true;
    this.isLoadingBuses = true;
    this.selectedRouteId = routeId;
    this.cdr.markForCheck();

    this.routeMapService
      .getById(routeId)
      .pipe(
        finalize(() => {
          this.isLoadingRoutes = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((route) => {
        if (route) {
          this.routeMapService.showRouteOnMap(route, this.safeGoogleMap!);
        }
        this.showRouteList = false;
      });

    this.loadBusesByRoute(routeId);
  }

  onCloseBusList() {
    this.showBusList = false;
    this.cdr.markForCheck();
  }

  onCloseRouteList() {
    this.showRouteList = false;
    this.cdr.markForCheck();
  }

  startCreatingRoute() {
    this.showBusList = false;
    this.showRouteList = false;
    this.isCreatingRoute = true;
    this.cdr.markForCheck();
  }

  onRouteCreated() {
    this.isCreatingRoute = false;
    this.routeMapService.loadRoutes().subscribe();
    this.cdr.markForCheck();
  }

  onCancelRouteCreation() {
    this.isCreatingRoute = false;
    this.cdr.markForCheck();
  }

  centerOnTrujillo() {
    if (this.safeGoogleMap) {
      this.safeGoogleMap.setCenter(this.center);
      this.safeGoogleMap.setZoom(this.zoom);
    }
  }

  refreshData() {
    this.routeMapService.loadRoutes().subscribe();
    if (this.selectedRouteId) {
      this.loadBusesByRoute(this.selectedRouteId);
    }
  }

  clearRouteAndBuses() {
    this.selectedRouteId = null;
    this.busMarkerService.clearMarkers();
    this.routeMapService.clearAllRoutesFromMap();
    this.buses = [];
    this.cdr.markForCheck();
  }

  getBusCount(): number {
    return this.buses.filter((b) => b.activo).length;
  }

  getActiveRoutesCount(): number {
    return this.routes.filter((r) => r.estado === 'ACTIVA').length;
  }
}
