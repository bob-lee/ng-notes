import { Component, VERSION } from '@angular/core';
import { routerTransition } from './app.animation';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [ routerTransition ],
})
export class AppComponent {
  name = `v${VERSION.full}`;

  constructor(public router: Router) { }

  getState(outlet) {
    return outlet.activatedRouteData.state;
  }

  divScroll(e) {
    console.log('div App', e);
  }
}
