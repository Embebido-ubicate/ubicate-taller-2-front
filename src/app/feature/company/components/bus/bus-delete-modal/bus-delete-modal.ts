import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bus } from '../../../models/buses.model';
import { BusService } from '../../../service/bus/bus.service';

@Component({
  selector: 'app-bus-delete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bus-delete-modal.html',
})
export class BusDeleteModal {
  private busService = inject(BusService);

  @Input() isOpen = false;
  @Input() bus: Bus | null = null;

  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  isDeleting = false;

  closeModal() {
    if (!this.isDeleting) {
      this.onClose.emit();
    }
  }

  confirmDelete() {
    if (this.bus && !this.isDeleting) {
      this.isDeleting = true;

      this.busService.deleteBus(this.bus.id).subscribe({
        next: () => {
          this.isDeleting = false;
          this.onConfirm.emit();
        },
        error: (error) => {
          console.error('Error eliminando bus:', error);
          this.isDeleting = false;
        },
      });
    }
  }
}
