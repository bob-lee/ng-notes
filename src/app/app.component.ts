import { Component } from '@angular/core';
import { routerTransition } from './app.animation';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ routerTransition ],
})
export class AppComponent {

  constructor() { }

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }
}
