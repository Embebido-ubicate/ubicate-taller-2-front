import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusService } from '../../../service/bus/bus.service';
import { Bus } from '../../../models/buses.model';
import { BusDeleteModal } from '../bus-delete-modal/bus-delete-modal';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bus-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bus-list.html',
})
export class BusList implements OnInit {
  private busService = inject(BusService);

  buses: Bus[] = [];
  loading = false;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;

  showDeleteModal = false;
  selectedBus: Bus | null = null;

  updatingId: number | null = null;

  readonly ESTADOS = [
    'ACTIVO',
    'INACTIVO',
    'EN_RUTA',
    'MANTENIMIENTO',
  ] as const;

  readonly estadoBadgeMap: Record<string, string> = {
    ACTIVO: 'bg-green-100 text-green-800',
    INACTIVO: 'bg-red-100 text-red-800',
    EN_RUTA: 'bg-blue-100 text-blue-800',
    MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
  };

  Math = Math;

  ngOnInit() {
    this.loadBuses();
  }

  loadBuses() {
    this.loading = true;
    this.busService.getBuses(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.buses = res.content;
        this.totalPages = res.total_pages;
        this.totalElements = res.total_elements;
        this.currentPage = res.number;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadBuses();
    }
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  openDeleteModal(bus: Bus) {
    this.selectedBus = bus;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedBus = null;
  }

  onBusDeleted() {
    this.closeDeleteModal();
    this.loadBuses();
  }

  onEstadoChange(bus: Bus, nuevoEstado: string) {
    if (!nuevoEstado || nuevoEstado === bus.estado) return;

    const anterior = bus.estado;

    this.updatingId = bus.id;
    bus.estado = nuevoEstado;

    this.busService.updateBusStatus(bus.id, nuevoEstado).subscribe({
      next: () => {
        this.updatingId = null;
      },
      error: () => {
        bus.estado = anterior;
        this.updatingId = null;
      },
    });
  }
}
