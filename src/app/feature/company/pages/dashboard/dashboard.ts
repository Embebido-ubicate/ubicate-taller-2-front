import { Component } from '@angular/core';
import { MapComponent } from '../../components/dashboard/map/map';
import { Stats } from '../../components/dashboard/stats/stats';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Stats, MapComponent],
  templateUrl: './dashboard.html',
})
export class Dashboard {}
