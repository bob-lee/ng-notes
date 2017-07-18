import { Component } from '@angular/core';
import { trigger, animate, style, group, animateChild, query, stagger, transition } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('routerAnimation', [

      transition('login => *, * => login', [
        query(':enter, :leave',
          style({ position: 'absolute', top: 0, left: 0, right: 0 })),
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(100%)' })
        ]),

        query(':leave', [
          animate('800ms cubic-bezier(.35,0,.25,1)', style({ opacity: 0, transform: 'translateX(-100%)' }))
        ]),

        group([
          query(':enter', [
            animate('800ms cubic-bezier(.35,0,.25,1)', style('*'))
          ])
        ])
      ])

    ])
  ]
})
export class AppComponent {

  constructor() { }

  prepRouteState(outlet) {
    const animation = outlet.activatedRouteData['animation'] || {};
    if (animation['value']) console.log(`prepRouteState '${animation['value']}'`);
    return animation['value'] || null;
  }
}
