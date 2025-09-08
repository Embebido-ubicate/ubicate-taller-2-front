import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConductorDeleteModal } from '../conductor-delete-modal/conductor-delete-modal';
import { ConductorEditModal } from '../conductor-edit-modal/conductor-edit-modal';
import { ConductorFilters } from '../conductor-filters/conductor-filters';
import { ConductorService } from '../../../service/chofer.service';
import { BusService } from '../../../service/bus.service';

@Component({
  selector: 'app-conductor-table',
  standalone: true,
  imports: [
    CommonModule,
    ConductorDeleteModal,
    ConductorEditModal,
    ConductorFilters,
  ],
  templateUrl: './conductor-table.html',
})
export class ConductorTable implements OnInit {
  private conductorService = inject(ConductorService);
  private busService = inject(BusService);

  conductores: any[] = [];
  buses: any[] = [];
  busesDisponibles: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 20;
  loadingBusAssignment: { [key: number]: boolean } = {};

  // Filtros
  currentSearchTerm = '';
  currentEstado = 'Todos';
  currentCategoria = 'Todas';
  currentTurno = 'Todos';

  // Modales
  showDeleteModal = false;
  showEditModal = false;
  selectedConductor: any = null;

  ngOnInit() {
    this.loadConductores();
    this.loadBusesDisponibles();
  }

  loadBusesDisponibles() {
    this.busService.getBuses(0, 100).subscribe({
      next: (response) => {
        this.busesDisponibles = response.content || response;
        this.buses = this.busesDisponibles; // Para compatibilidad con modales
      },
      error: (error) => {
        console.error('Error al cargar buses:', error);
      },
    });
  }

  loadBuses() {
    this.loadBusesDisponibles();
  }

  loadConductores() {
    this.loading = true;

    if (this.currentSearchTerm.trim()) {
      this.conductorService
        .searchConductores(
          this.currentSearchTerm,
          this.currentPage,
          this.pageSize
        )
        .subscribe({
          next: (response) => {
            this.conductores = this.applyLocalFilters(response.content);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al buscar conductores:', error);
            this.loading = false;
          },
        });
    } else if (this.currentEstado !== 'Todos') {
      this.conductorService
        .getConductoresByEstado(this.currentEstado)
        .subscribe({
          next: (conductores) => {
            this.conductores = this.applyLocalFilters(conductores);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al filtrar por estado:', error);
            this.loading = false;
          },
        });
    } else if (this.currentTurno !== 'Todos') {
      this.conductorService.getConductoresByTurno(this.currentTurno).subscribe({
        next: (conductores) => {
          this.conductores = this.applyLocalFilters(conductores);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al filtrar por turno:', error);
          this.loading = false;
        },
      });
    } else {
      this.conductorService
        .getConductores(this.currentPage, this.pageSize)
        .subscribe({
          next: (response) => {
            this.conductores = this.applyLocalFilters(response.content);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al cargar conductores:', error);
            this.loading = false;
          },
        });
    }
  }

  applyLocalFilters(conductores: any[]): any[] {
    let filtered = [...conductores];
    if (this.currentCategoria !== 'Todas') {
      filtered = filtered.filter(
        (c) => c.categoria_licencia === this.currentCategoria
      );
    }
    return filtered;
  }

  // Eventos de filtros
  onSearch(searchTerm: string) {
    this.currentSearchTerm = searchTerm;
    this.currentEstado = 'Todos';
    this.currentTurno = 'Todos';
    this.currentPage = 0;
    this.loadConductores();
  }

  onEstadoChange(estado: string) {
    this.currentEstado = estado;
    this.currentSearchTerm = '';
    this.currentTurno = 'Todos';
    this.currentPage = 0;
    this.loadConductores();
  }

  onCategoriaChange(categoria: string) {
    this.currentCategoria = categoria;
    this.loadConductores();
  }

  onTurnoChange(turno: string) {
    this.currentTurno = turno;
    this.currentSearchTerm = '';
    this.currentEstado = 'Todos';
    this.currentPage = 0;
    this.loadConductores();
  }

  onClearFilters() {
    this.currentSearchTerm = '';
    this.currentEstado = 'Todos';
    this.currentCategoria = 'Todas';
    this.currentTurno = 'Todos';
    this.currentPage = 0;
    this.loadConductores();
  }

  // Método para asignar bus
  onBusAssignment(conductor: any, event: any) {
    const busId = event.target.value || null;

    if (this.loadingBusAssignment[conductor.id]) return;

    this.loadingBusAssignment[conductor.id] = true;

    const operation = busId
      ? this.conductorService.asignarBus(conductor.id, Number(busId))
      : this.conductorService.removerBus(conductor.id);

    operation.subscribe({
      next: () => {
        this.loadingBusAssignment[conductor.id] = false;
        this.loadConductores(); // Recargar para mostrar cambios
      },
      error: (error) => {
        console.error('Error al asignar/remover bus:', error);
        this.loadingBusAssignment[conductor.id] = false;
      },
    });
  }

  // Métodos de acciones
  onView(conductor: any) {
    console.log('Ver conductor:', conductor);
  }

  onEdit(conductor: any) {
    this.selectedConductor = conductor;
    this.showEditModal = true;
  }

  onDelete(conductor: any) {
    this.selectedConductor = conductor;
    this.showDeleteModal = true;
  }

  // Métodos de modales
  onCancelEdit() {
    this.showEditModal = false;
    this.selectedConductor = null;
  }

  onConfirmEdit() {
    this.showEditModal = false;
    this.selectedConductor = null;
    this.loadConductores();
  }

  onCancelDelete() {
    this.showDeleteModal = false;
    this.selectedConductor = null;
  }

  onConfirmDelete() {
    this.showDeleteModal = false;
    this.selectedConductor = null;
    this.loadConductores();
  }

  // Métodos de estilo
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'VACACIONES':
        return 'bg-orange-100 text-orange-800';
      case 'INACTIVO':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDIDO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTurnoClass(turno: string): string {
    switch (turno) {
      case 'MAÑANA':
        return 'bg-yellow-100 text-yellow-800';
      case 'TARDE':
        return 'bg-blue-100 text-blue-800';
      case 'NOCHE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
