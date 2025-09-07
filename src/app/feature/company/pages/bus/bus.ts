import { Component, ViewChild } from '@angular/core';
import { BusHeader } from '../../components/bus/bus-header/bus-header';
import { BusFilter } from '../../components/bus/bus-filter/bus-filter';
import { BusList } from '../../components/bus/bus-list/bus-list';

@Component({
  selector: 'app-bus',
  imports: [BusHeader, BusFilter, BusList],
  templateUrl: './bus.html',
})
export class Bus {
  @ViewChild(BusList) busList!: BusList;

  onBusCreated() {

    if (this.busList) {
      this.busList.loadBuses();
    }
  }
}
