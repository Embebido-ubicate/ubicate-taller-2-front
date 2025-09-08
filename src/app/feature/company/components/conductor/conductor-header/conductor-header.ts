import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-conductor-header',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './conductor-header.html',
})
export class ConductorHeader {
  @Output() onCreateNew = new EventEmitter<void>();

  createNewConductor() {
    this.onCreateNew.emit();
  }
}
