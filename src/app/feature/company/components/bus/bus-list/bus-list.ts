import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusService } from '../../../service/bus/bus.service';
import { Bus } from '../../../models/buses.model';
import { BusFormModal } from '../bus-form-modal/bus-form-modal';
import { BusDeleteModal } from '../bus-delete-modal/bus-delete-modal';

@Component({
  selector: 'app-bus-list',
  standalone:true,
  imports: [CommonModule, BusFormModal, BusDeleteModal],
  templateUrl: './bus-list.html',
})
export class BusList implements OnInit {
  private busService = inject(BusService);

  buses: Bus[] = [];
  loading = false;

  // Paginación
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;

  // Modales
  showFormModal = false;
  showDeleteModal = false;
  selectedBus: Bus | null = null;
  editMode = false;

  // Exponer Math para el template
  Math = Math;

  ngOnInit() {
    this.loadBuses();
  }

  loadBuses() {
    this.loading = true;
    this.busService.getBuses(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.buses = response.content;
        this.totalPages = response.total_pages;
        this.totalElements = response.total_elements;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading buses:', error);
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

  // Métodos para los modales
  openCreateModal() {
    this.selectedBus = null;
    this.editMode = false;
    this.showFormModal = true;
  }

  openEditModal(bus: Bus) {
    this.selectedBus = bus;
    this.editMode = true;
    this.showFormModal = true;
  }

  openDeleteModal(bus: Bus) {
    this.selectedBus = bus;
    this.showDeleteModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
    this.selectedBus = null;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedBus = null;
  }

  onBusCreated() {
    this.closeFormModal();
    this.loadBuses();
  }

  onBusUpdated() {
    this.closeFormModal();
    this.loadBuses();
  }

  onBusDeleted() {
    this.closeDeleteModal();
    this.loadBuses();
  }
}
