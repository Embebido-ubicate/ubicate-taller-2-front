import {
  Component,
  EventEmitter,
  Input,
  Output,
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
import { ConductorService } from '../../../service/chofer.service';

@Component({
  selector: 'app-conductor-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './conductor-form-modal.html',
})
export class ConductorFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private conductorService = inject(ConductorService);

  @Input() isVisible = false;
  @Input() conductor: any = null;
  @Input() buses: any[] = [];
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  conductorForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;

  categorias = ['A1', 'A2a', 'A2b', 'A3a', 'A3b', 'A3c'];
  estados = ['ACTIVO', 'INACTIVO', 'VACACIONES', 'SUSPENDIDO'];
  turnos = [
    { value: 'MAÑANA', label: 'Mañana (06:00 - 14:00)' },
    { value: 'TARDE', label: 'Tarde (14:00 - 22:00)' },
    { value: 'NOCHE', label: 'Noche (22:00 - 06:00)' },
  ];

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges() {
    if (this.conductorForm) {
      if (this.conductor) {
        this.isEditMode = true;
        this.populateForm();
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  initForm() {
    this.conductorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      numeroLicencia: ['', [Validators.required]],
      categoriaLicencia: ['', [Validators.required]],
      fechaVencimientoLicencia: ['', [Validators.required]],
      turno: ['MAÑANA', [Validators.required]],
    });
  }

  populateForm() {
    if (this.conductor) {
      const nombreCompleto = this.conductor.nombre_completo || '';
      const partes = nombreCompleto.trim().split(' ');
      const nombre = partes[0] || '';
      const apellido = partes.slice(1).join(' ') || '';

      this.conductorForm.patchValue({
        nombre: nombre,
        apellido: apellido,
        dni: this.conductor.dni || '',
        telefono: this.conductor.telefono || '',
        email: this.conductor.email || '',
        numeroLicencia: this.conductor.numero_licencia || '',
        categoriaLicencia: this.conductor.categoria_licencia || '',
        fechaVencimientoLicencia:
          this.conductor.fecha_vencimiento_licencia || '',
        turno: this.conductor.turno || 'MAÑANA',
      });
    }
  }

  resetForm() {
    this.conductorForm.reset({
      nombre: '',
      apellido: '',
      turno: 'MAÑANA',
      categoriaLicencia: '',
    });
  }

  cancel() {
    this.resetForm();
    this.onCancel.emit();
  }

  onSubmit() {
    if (this.conductorForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.conductorForm.value;

      if (this.isEditMode) {
        this.conductorService
          .updateConductor(this.conductor.id, formData)
          .subscribe({
            next: () => {
              this.isSubmitting = false;
              this.resetForm();
              this.onSave.emit();
            },
            error: (error) => {
              console.error('Error al actualizar conductor:', error);
              this.isSubmitting = false;
            },
          });
      } else {
        this.conductorService.createConductor(formData).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.resetForm();
            this.onSave.emit();
          },
          error: (error) => {
            console.error('Error al crear conductor:', error);
            this.isSubmitting = false;
          },
        });
      }
    } else {
      Object.keys(this.conductorForm.controls).forEach((key) => {
        this.conductorForm.get(key)?.markAsTouched();
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.conductorForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.conductorForm.get(fieldName);
    if (field?.errors && (field?.dirty || field?.touched)) {
      if (field.errors['required']) return `${fieldName} es obligatorio`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['pattern']) return 'Formato inválido';
      if (field.errors['minlength'])
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Editar Conductor' : 'Nuevo Conductor';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Actualizando...' : 'Guardando...';
    }
    return this.isEditMode ? 'Actualizar Conductor' : 'Guardar Conductor';
  }
}
