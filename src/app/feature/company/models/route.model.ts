export interface RouteFormData {
  nombre: string;
  codigo: string;
  colorHex: string;
}

export interface CreateRouteRequest {
  nombre: string;
  codigo: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  color_hex?: string;
  polyline?: string;
  bus_ids?: number[];
}

export interface UpdateRouteRequest {
  nombre?: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  color_hex?: string;
  polyline?: string;
  estado?: string;
  bus_ids?: number[];
}

export interface RouteResponse {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  origen: string;
  destino: string;
  color_hex: string | null;
  polyline: string | null;
  estado: string;
  activo: boolean;
  empresa_id: number;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  bus_ids: number[];
}
