import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-conductor-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conductor-filters.html',
})
export class ConductorFilters {
  // Valores de los filtros
  searchTerm = '';
  selectedEstado = 'Todos';
  selectedCategoria = 'Todas';
  selectedTurno = 'Todos';

  // Opciones para los selects
  estados = ['Todos', 'ACTIVO', 'INACTIVO', 'VACACIONES', 'SUSPENDIDO'];
  categorias = ['Todas', 'A1', 'A2a', 'A2b', 'A3a', 'A3b', 'A3c'];
  turnos = ['Todos', 'MAÑANA', 'TARDE', 'NOCHE'];

  // Eventos para comunicarse con el componente padre
  @Output() onSearch = new EventEmitter<string>();
  @Output() onEstadoChange = new EventEmitter<string>();
  @Output() onCategoriaChange = new EventEmitter<string>();
  @Output() onTurnoChange = new EventEmitter<string>();
  @Output() onClearFilters = new EventEmitter<void>();

  onSearchInput() {
    this.onSearch.emit(this.searchTerm);
  }

  onEstadoSelect() {
    this.onEstadoChange.emit(this.selectedEstado);
  }

  onCategoriaSelect() {
    this.onCategoriaChange.emit(this.selectedCategoria);
  }

  onTurnoSelect() {
    this.onTurnoChange.emit(this.selectedTurno);
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedEstado = 'Todos';
    this.selectedCategoria = 'Todas';
    this.selectedTurno = 'Todos';
    this.onClearFilters.emit();
  }
}
