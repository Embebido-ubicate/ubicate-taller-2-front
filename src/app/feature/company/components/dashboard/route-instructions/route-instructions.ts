import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-route-instructions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-instructions.html'
})
export class RouteInstructionsComponent {
  @Input() isCreatingRoute = false;
  @Input() hasOrigin = false;
  @Input() hasDestination = false;
}
