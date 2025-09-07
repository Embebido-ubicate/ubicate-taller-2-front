export interface BusesStats {
  total_buses: number;
  buses_activos: number;
  buses_inactivos: number;
  buses_en_ruta: number;
  buses_en_mantenimiento: number;
  estado_por_cantidad: Record<string, number>;
}
