export interface BusesStats {
  total_buses: number;
  buses_activos: number;
  buses_inactivos: number;
  buses_en_ruta: number;
  buses_en_mantenimiento: number;
  estado_por_cantidad: Record<string, number>;
}

export interface Bus {
  id: number;
  placa: string;
  modelo: string;
  capacidad: number;
  anio: string;  
  color: string;
  estado: string;
  activo: boolean;
  empresa_id: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}
