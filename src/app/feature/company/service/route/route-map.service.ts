import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { RouteService } from './route.service';
import { Route } from '../../models/route.model';

@Injectable({ providedIn: 'root' })
export class RouteMapService {
  private routeService = inject(RouteService);

  private routesSubject = new BehaviorSubject<Route[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  routes$ = this.routesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Directorio de renderizadores de rutas para el mapa
  private routeRenderers = new Map<number, google.maps.DirectionsRenderer>();

  loadRoutes(page: number = 0, size: number = 50): Observable<Route[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.routeService.getRoutes(page, size).pipe(
      map((response) => {
        const routes = response.content || response; // Manejar respuesta paginada o array directo
        this.routesSubject.next(routes);
        this.loadingSubject.next(false);
        return routes;
      }),
      catchError((error) => {
        console.error('Error loading routes:', error);
        this.errorSubject.next('Error al cargar las rutas');
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }

  toggleRouteActive(routeId: number): Observable<Route | null> {
    const currentRoutes = this.routesSubject.value;
    const route = currentRoutes.find((r) => r.id === routeId);

    if (!route) {
      return of(null);
    }

    const newState = route.activo ? 'inactivo' : 'activo';

    return this.routeService.updateRoute(routeId, { estado: newState }).pipe(
      map((updatedRoute) => {
        // Actualizar la lista local
        const updatedRoutes = currentRoutes.map((r) =>
          r.id === routeId ? updatedRoute : r
        );
        this.routesSubject.next(updatedRoutes);
        return updatedRoute;
      }),
      catchError((error) => {
        console.error('Error toggling route:', error);
        this.errorSubject.next('Error al actualizar la ruta');
        return of(null);
      })
    );
  }

  deleteRoute(routeId: number): Observable<boolean> {
    return this.routeService.deleteRoute(routeId).pipe(
      map(() => {
        // Remover de la lista local
        const currentRoutes = this.routesSubject.value;
        const filteredRoutes = currentRoutes.filter((r) => r.id !== routeId);
        this.routesSubject.next(filteredRoutes);

        // Limpiar el renderer del mapa si existe
        this.clearRouteFromMap(routeId);

        return true;
      }),
      catchError((error) => {
        console.error('Error deleting route:', error);
        this.errorSubject.next('Error al eliminar la ruta');
        return of(false);
      })
    );
  }

  // Métodos para el mapa
  showRouteOnMap(route: Route, map: google.maps.Map): void {
    if (!route.polyline) return;

    // Limpiar renderer anterior si existe
    this.clearRouteFromMap(route.id);

    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      draggable: false,
      polylineOptions: {
        strokeColor: route.colorHex,
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    directionsRenderer.setMap(map);

    // Si tienes el polyline, decodificarlo y mostrar la ruta
    if (route.polyline) {
      try {
        // Aquí podrías usar el polyline para mostrar la ruta
        // Por ahora, creamos una ruta simple entre origen y destino
        this.createSimpleRouteFromCoords(route, directionsRenderer);
      } catch (error) {
        console.error('Error showing route on map:', error);
      }
    }

    this.routeRenderers.set(route.id, directionsRenderer);
  }

  private createSimpleRouteFromCoords(
    route: Route,
    renderer: google.maps.DirectionsRenderer
  ): void {
    const [originLat, originLng] = route.origen.split(',').map(Number);
    const [destLat, destLng] = route.destino.split(',').map(Number);

    const directionsService = new google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderer.setDirections(result);
      }
    });
  }

  clearRouteFromMap(routeId: number): void {
    const renderer = this.routeRenderers.get(routeId);
    if (renderer) {
      renderer.setMap(null);
      this.routeRenderers.delete(routeId);
    }
  }

  clearAllRoutesFromMap(): void {
    this.routeRenderers.forEach((renderer) => {
      renderer.setMap(null);
    });
    this.routeRenderers.clear();
  }

  getRoutes(): Route[] {
    return this.routesSubject.value;
  }
}
