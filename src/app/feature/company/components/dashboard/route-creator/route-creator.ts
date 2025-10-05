// src/app/feature/company/components/dashboard/route-creator/route-creator.ts
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
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { RouteService } from '../../../service/route/route.service';
import { CreateRouteRequest } from '../../../models/route.model';
import { IconsModule } from '../../../icons.module';

export interface RouteFormData {
  nombre: string;
  codigo: string;
  colorHex: string;
}

type AnyMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

@Component({
  selector: 'app-route-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  templateUrl: './route-creator.html',
})
export class RouteCreator implements OnInit, OnDestroy {
  @Input() map: google.maps.Map | null = null;
  @Output() routeCreated = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private routeService = inject(RouteService);

  routeData: RouteFormData = {
    nombre: '',
    codigo: '',
    colorHex: this.generateRandomColor(),
  };

  isCreatingRoute = false;
  hasOrigin = false;
  hasDestination = false;
  isAddingWaypoints = false;

  private originMarker: AnyMarker | null = null;
  private destinationMarker: AnyMarker | null = null;
  private waypointMarkers: AnyMarker[] = [];
  private directionsService = new google.maps.DirectionsService();
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private waypoints: google.maps.LatLng[] = [];
  private mapClickListener: google.maps.MapsEventListener | null = null;

  private geocoder = new google.maps.Geocoder();
  private infoWindow = new google.maps.InfoWindow();
  private addressCache = new Map<string, string>();

  private get hasVectorMapId(): boolean {
    return !!(this.map as any)?.get?.('mapId');
  }

  ngOnInit() {
    if (this.map) {
      this.initializeDirectionsRenderer();
      this.setupMapClickListener();
      this.startCreatingRoute();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupMap();
  }

  private initializeDirectionsRenderer() {
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: this.routeData.colorHex,
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });
    if (this.map) this.directionsRenderer.setMap(this.map);
  }

  private setupMapClickListener() {
    if (!this.map) return;
    this.mapClickListener = this.map.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        if (this.isCreatingRoute && !this.hasDestination)
          this.handleRouteClick(e.latLng);
        else if (
          this.isAddingWaypoints &&
          this.hasDestination &&
          this.isCreatingRoute
        )
          this.addWaypoint(e.latLng);
      }
    );
  }

  private startCreatingRoute() {
    this.isCreatingRoute = true;
    this.hasOrigin = false;
    this.hasDestination = false;
    this.isAddingWaypoints = false;
    this.clearRouteMarkers();
  }

  private async makeMarker(
    position: google.maps.LatLng,
    options: {
      background: string;
      glyph: string;
      title: string;
      draggable: boolean;
    }
  ): Promise<AnyMarker> {
    const infoTitle = `${options.title} (${options.glyph})`;

    if (this.hasVectorMapId) {
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary(
          'marker'
        )) as google.maps.MarkerLibrary;
      const pin = new PinElement({
        background: options.background,
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        glyph: options.glyph,
        scale: 1.5,
      });
      const m = new AdvancedMarkerElement({
        map: this.map!,
        position,
        title: options.title,
        content: pin.element,
        gmpDraggable: options.draggable,
      });
      (m as any).addListener('gmp-click', async () => {
        const pos = this.getMarkerPosition(m);
        const html = await this.buildInfoContent(infoTitle, pos);
        this.infoWindow.setContent(html);
        this.infoWindow.setPosition(pos);
        this.infoWindow.open(this.map!);
      });
      return m;
    } else {
      const m = new google.maps.Marker({
        map: this.map!,
        position,
        title: options.title,
        draggable: options.draggable,
        icon: this.makeLetterPinIcon(options.glyph, options.background),
      });
      m.addListener('click', async () => {
        const pos = this.getMarkerPosition(m);
        const html = await this.buildInfoContent(infoTitle, pos);
        this.infoWindow.setContent(html);
        this.infoWindow.setPosition(pos);
        this.infoWindow.open(this.map!);
      });
      return m;
    }
  }

  private makeLetterPinIcon(letter: string, color: string): google.maps.Icon {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'>
      <path d='M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' stroke='white' stroke-width='1.2'/>
      <circle cx='12' cy='9' r='3.2' fill='rgba(255,255,255,0.2)'/>
      <text x='12' y='10.6' text-anchor='middle' font-size='7.5' font-weight='700' fill='white' font-family='Inter, Arial, sans-serif'>${letter}</text>
    </svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    };
  }

  private getMarkerPosition(m: AnyMarker): google.maps.LatLng {
    const pos: any =
      (m as any).position ?? (m as google.maps.Marker).getPosition?.();
    if (pos?.lat && typeof pos.lat === 'function')
      return pos as google.maps.LatLng;
    if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number')
      return new google.maps.LatLng(pos.lat, pos.lng);
    return pos as google.maps.LatLng;
  }

  private onMarkerDragEnd(m: AnyMarker, cb: () => void) {
    if ('addListener' in (m as any)) (m as any).addListener('dragend', cb);
  }

  private async handleRouteClick(latLng: google.maps.LatLng) {
    if (!this.hasOrigin) {
      this.originMarker = await this.makeMarker(latLng, {
        background: '#10B981',
        glyph: 'A',
        title: 'Origen',
        draggable: true,
      });
      this.onMarkerDragEnd(this.originMarker, () => {
        if (this.hasDestination) this.calculateRoute();
      });
      this.hasOrigin = true;
    } else if (!this.hasDestination) {
      this.destinationMarker = await this.makeMarker(latLng, {
        background: '#EF4444',
        glyph: 'B',
        title: 'Destino',
        draggable: true,
      });
      this.onMarkerDragEnd(this.destinationMarker, () => this.calculateRoute());
      this.hasDestination = true;
      this.calculateRoute();
    }
  }

  private async addWaypoint(latLng: google.maps.LatLng) {
    const idx = this.waypoints.length + 1;
    const marker = await this.makeMarker(latLng, {
      background: '#FFAA00',
      glyph: String(idx),
      title: `Punto intermedio ${idx}`,
      draggable: true,
    });
    this.onMarkerDragEnd(marker, () => {
      const i = this.waypointMarkers.indexOf(marker);
      if (i !== -1) {
        this.waypoints[i] = this.getMarkerPosition(marker);
        this.calculateRoute();
      }
    });
    this.waypointMarkers.push(marker);
    this.waypoints.push(latLng);
    this.calculateRoute();
  }

  private async buildInfoContent(
    title: string,
    pos: google.maps.LatLng
  ): Promise<string> {
    const key = `${pos.lat().toFixed(6)},${pos.lng().toFixed(6)}`;
    if (!this.addressCache.has(key)) {
      const res = await this.geocoder.geocode({ location: pos }).then((r) => r);
      const addr =
        res.results?.[0]?.formatted_address ||
        `Lat ${pos.lat().toFixed(6)}, Lng ${pos.lng().toFixed(6)}`;
      this.addressCache.set(key, addr);
    }
    const address = this.addressCache.get(key)!;
    return `<div style="min-width:220px"><div style="font-weight:700;margin-bottom:4px">${title}</div><div style="font-size:12px;line-height:1.35">${address}</div></div>`;
  }

  private calculateRoute() {
    if (!this.originMarker || !this.destinationMarker) return;
    const origin = this.getMarkerPosition(this.originMarker);
    const destination = this.getMarkerPosition(this.destinationMarker);
    const waypointsForRoute = this.waypoints.map((p) => ({
      location: p,
      stopover: true,
    }));
    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints: waypointsForRoute,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };
    this.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        this.directionsRenderer.setOptions({
          draggable: true,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: this.routeData.colorHex,
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
        this.directionsRenderer.setDirections(result);
      } else {
        alert(`Error al calcular la ruta: ${status}`);
      }
    });
  }

  get isFormValid(): boolean {
    return !!(
      this.routeData.nombre &&
      this.routeData.codigo &&
      this.hasDestination
    );
  }

  onCancel() {
    this.cleanupMap();
    this.cancel.emit();
  }

  onSave() {
    if (!this.isFormValid) return;
    const directions = this.directionsRenderer.getDirections();
    if (!directions?.routes?.length) return;
    if (!this.originMarker || !this.destinationMarker) return;

    const originPos = this.getMarkerPosition(this.originMarker);
    const destinationPos = this.getMarkerPosition(this.destinationMarker);

    const originLat = originPos.lat();
    const originLng = originPos.lng();
    const destLat = destinationPos.lat();
    const destLng = destinationPos.lng();

    let color = (this.routeData.colorHex || '').trim();
    if (color && !color.startsWith('#')) color = '#' + color.replace(/^#/, '');

    const route = directions.routes[0];
    const polyline: string =
      (route as any).overview_polyline?.toString?.() ??
      (route as any).overview_polyline ??
      '';

    const payload: CreateRouteRequest = {
      nombre: this.routeData.nombre,
      codigo: this.routeData.codigo,
      descripcion: `Ruta`,
      origen: `${originLat},${originLng}`,
      destino: `${destLat},${destLng}`,
      color_hex: color,
      polyline,
      bus_ids: [],
    };

    this.routeService.createRoute(payload).subscribe({
      next: () => {
        this.cleanupMap();
        this.routeCreated.emit();
      },
      error: () => {},
    });
  }

  onClear() {
    this.clearRouteMarkers();
  }

  onColorChange() {
    if (this.routeData.colorHex && !this.routeData.colorHex.startsWith('#')) {
      this.routeData.colorHex = '#' + this.routeData.colorHex.replace(/^#/, '');
    }
    this.updateRouteColor();
  }

  onToggleWaypoints() {
    this.isAddingWaypoints = !this.isAddingWaypoints;
  }

  private updateRouteColor() {
    if (this.hasDestination && this.directionsRenderer) {
      const directions = this.directionsRenderer.getDirections();
      if (directions?.routes?.length) {
        this.directionsRenderer.setOptions({
          draggable: true,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: this.routeData.colorHex,
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
        this.directionsRenderer.setDirections(directions);
      }
    }
  }

  private clearRouteMarkers() {
    if (this.originMarker) {
      if ((this.originMarker as any).map !== undefined)
        (this.originMarker as any).map = null;
      else (this.originMarker as google.maps.Marker).setMap(null);
      this.originMarker = null;
    }
    if (this.destinationMarker) {
      if ((this.destinationMarker as any).map !== undefined)
        (this.destinationMarker as any).map = null;
      else (this.destinationMarker as google.maps.Marker).setMap(null);
      this.destinationMarker = null;
    }
    this.waypointMarkers.forEach((m) => {
      if ((m as any).map !== undefined) (m as any).map = null;
      else (m as google.maps.Marker).setMap(null);
    });
    this.waypointMarkers = [];
    this.waypoints = [];
    if (this.directionsRenderer && this.map) {
      this.directionsRenderer.setMap(null);
      this.initializeDirectionsRenderer();
    }
    this.hasOrigin = false;
    this.hasDestination = false;
  }

  private cleanupMap() {
    if (this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }
    this.clearRouteMarkers();
    if (this.directionsRenderer && this.map)
      this.directionsRenderer.setMap(null);
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
}
