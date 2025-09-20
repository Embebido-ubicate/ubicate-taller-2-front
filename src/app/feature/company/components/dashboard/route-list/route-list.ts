import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Route } from '../../../models/route.model';
import { RouteMapService } from '../../../service/route/route-map.service';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-list.html',
})
export class RouteListComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() selectRoute = new EventEmitter<Route>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private routeMapService = inject(RouteMapService);

  routes: Route[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.routeMapService.routes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((routes) => {
        this.routes = routes;
      });

    this.routeMapService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.loading = loading;
      });

    this.routeMapService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.error = error;
      });

    this.loadRoutes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoutes() {
    this.routeMapService.loadRoutes(0, 50).subscribe();
  }

  onSelectRoute(route: Route) {
    this.selectRoute.emit(route);
  }

  onToggleRoute(event: Event, route: Route) {
    event.stopPropagation();

    this.routeMapService
      .toggleRouteActive(route.id)
      .subscribe((updatedRoute) => {
        if (updatedRoute) {
          console.log(`Ruta ${route.codigo} actualizada:`, updatedRoute);
        }
      });
  }

  onEditRoute(event: Event, route: Route) {
    event.stopPropagation();
    console.log('Editar ruta:', route);
  }

  onDeleteRoute(event: Event, route: Route) {
    event.stopPropagation();

    if (
      confirm(
        `¿Estás seguro de eliminar la ruta ${route.codigo} - ${route.nombre}?`
      )
    ) {
      this.routeMapService.deleteRoute(route.id).subscribe((success) => {
        if (success) {
          console.log(`Ruta ${route.codigo} eliminada exitosamente`);
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }

  trackByRoute(index: number, route: Route): number {
    return route.id;
  }

  // MÉTODO CORREGIDO - Sin redeclaración de variables
  getOriginDestination(route: Route): string {
    // Primero verificar si hay descripción
    if (route.descripcion && route.descripcion.trim() !== '') {
      return route.descripcion;
    }

    // Si no hay descripción, mostrar coordenadas
    try {
      // Parsear origen
      const origenParts = route.origen.split(',');
      const destinoParts = route.destino.split(',');

      if (origenParts.length >= 2 && destinoParts.length >= 2) {
        const originLat = parseFloat(origenParts[0]).toFixed(3);
        const originLng = parseFloat(origenParts[1]).toFixed(3);
        const destinationLat = parseFloat(destinoParts[0]).toFixed(3);
        const destinationLng = parseFloat(destinoParts[1]).toFixed(3);

        return `${originLat}, ${originLng} → ${destinationLat}, ${destinationLng}`;
      }

      return 'Coordenadas inválidas';
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return 'Sin descripción';
    }
  }

  getRouteInfo(route: Route): string {
    const info: string[] = [];

    if (route.buses && route.buses.length > 0) {
      const busCount = route.buses.length;
      info.push(`${busCount} bus${busCount !== 1 ? 'es' : ''}`);
    }

    if (route.estado) {
      info.push(`Estado: ${route.estado}`);
    }

    return info.length > 0 ? info.join(' • ') : 'Sin información';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getActiveRoutes(): number {
    return this.routes.filter((r) => r.activo).length;
  }

  getInactiveRoutes(): number {
    return this.routes.filter((r) => !r.activo).length;
  }
}
