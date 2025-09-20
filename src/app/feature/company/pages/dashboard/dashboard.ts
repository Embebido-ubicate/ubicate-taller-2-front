import { Component } from '@angular/core';
import { Stats } from '../../components/dashboard/stats/stats';
import { MapContainerComponent } from '../../components/dashboard/map-container/map-container';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Stats, MapContainerComponent],
  templateUrl: './dashboard.html',
})
export class Dashboard {}
