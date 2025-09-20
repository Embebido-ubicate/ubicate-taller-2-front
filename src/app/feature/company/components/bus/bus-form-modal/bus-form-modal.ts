import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Bus } from '../../../models/buses.model';
import { BusService } from '../../../service/bus/bus.service';

@Component({
  selector: 'app-bus-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bus-form-modal.html',
})
export class BusFormModal implements OnInit {
  private busService = inject(BusService);

  @Input() isOpen = false;
  @Input() bus: Bus | null = null;

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  busForm: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.busForm = this.createForm();
  }

  ngOnInit() {
    if (this.bus) {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      placa: ['', [Validators.required, Validators.minLength(3)]],
      modelo: ['', [Validators.required]],
      capacidad: ['', [Validators.required, Validators.min(1)]],
      anio: [
        '',
        [Validators.required, Validators.min(2000), Validators.max(2030)],
      ],
      color: ['', [Validators.required]],
      estado: ['ACTIVO', [Validators.required]],
    });
  }

  private populateForm() {
    if (this.bus) {
      this.busForm.patchValue({
        placa: this.bus.placa,
        modelo: this.bus.modelo,
        capacidad: this.bus.capacidad,
        anio: this.bus.anio,
        color: this.bus.color,
        estado: this.bus.estado,
      });
    }
  }

  closeModal() {
    this.busForm.reset();
    this.onClose.emit();
  }

  onSubmit() {
    if (this.busForm.valid && this.bus) {
      this.isSubmitting = true;
      const formData = this.busForm.value;

      this.busService.updateBus(this.bus.id, formData).subscribe({
        next: (response: any) => {
          console.log('Bus actualizado:', response);
          this.isSubmitting = false;
          this.busForm.reset();
          this.onSave.emit();
        },
        error: (error: any) => {
          console.error('Error actualizando bus:', error);
          this.isSubmitting = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.busForm.controls).forEach((key) => {
      const control = this.busForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.busForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} es requerido`;
      if (control.errors['minlength'])
        return `${fieldName} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['min'])
        return `${fieldName} debe ser mayor a ${control.errors['min'].min}`;
      if (control.errors['max'])
        return `${fieldName} debe ser menor a ${control.errors['max'].max}`;
    }
    return '';
  }

  hasError(fieldName: string): boolean {
    const control = this.busForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }
}
