// Actualizar para coincidir con RouteResponse del servicio
export interface Route {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  origen: string;
  destino: string;
  colorHex: string;
  polyline: string;
  estado: string;
  activo: boolean;
  empresaId: number;
  fechaCreacion: string;
  buses: any[]; // Podrías tipar esto mejor según tu modelo de Bus
}

export interface RouteStats {
  total_rutas: number;
  rutas_activas: number;
  rutas_inactivas: number;
  rutas_por_estado: Record<string, number>;
}

export interface RoutePaginatedResponse {
  content: Route[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
