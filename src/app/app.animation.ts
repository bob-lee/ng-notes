import { animate, animateChild, animation, group, keyframes, 
  query, style, transition, trigger } from '@angular/animations';

export const PERIOD_1 = '500ms ease';
export const PERIOD_2 = '500ms ease';

export const listChild = trigger('listChild', [
  transition('* => *', [
    query(':enter', [
      style({ height: 0, opacity: 0 })
    ], { optional: true }),
    query(':leave', [ // item removed
      style({ opacity: 1, height: '5em' }),
      animate('1s ease-out', style({ opacity: 0, height: 0 }))
    ], { optional: true }),
    query(':enter', [ // item added
      animate('1s', style({ height: '*', opacity: 1 }))
    ], { optional: true }),
    query('my-note.modified', [ // item modified
      animate('1000ms ease-out', keyframes([
        style({ opacity: 1, offset: 0 }),
        style({ opacity: 0, offset: 0.25 }),
        style({ opacity: 1, offset: 0.5 }),
        style({ opacity: 0, offset: 0.75 }),
        style({ opacity: 1, offset: 1 })
      ]))
    ], { optional: true }),
  
  ])
]);

export const expandAnimation = animation([
  style({ overflow: 'hidden', opacity: 0/*, height: 0*/ }),
  animate('{{ time }}', style({ opacity: 1/*, height: '*'*/ }))
], { params: { time: PERIOD_1 }});

export const routerTransition = trigger('routerTransition', [
  transition('login => home, groups => group', [
    query(':enter, :leave', style({ position: 'fixed', width: '100%', height: '100%' }), {optional: true}),
    query(':enter', style({ transform: 'translateX(100%)' }), {optional: true}),

    group([
      query(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('1.0s ease-in-out', style({transform: 'translateX(-100%)'}))
      ], {optional: true}),
      query(':enter', [
        animate('1.0s ease-in-out', style({transform: 'translateX(0%)'})),
        animateChild()
      ], {optional: true}),
    ]),
  ]),
  transition('group => note', [
    query(':enter', style({ position: 'fixed', width: '100%', height: '100%' }), {optional: true}),
    query(':enter', style({ transform: 'translateX(100%)' }), {optional: true}),

    group([
      query(':enter', [
        animate('1.0s ease-in-out', style({transform: 'translateX(0%)'})),
        animateChild()
      ], {optional: true}),
    ]),
  ]),
  transition('group => groups, home => login', [
    query(':enter, :leave', style({ position: 'fixed', width: '100%', height: '100%' }), {optional: true}),
    query(':enter', style({ transform: 'translateX(-100%)' }), {optional: true}),

    group([
      query(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('1.0s ease-in-out', style({transform: 'translateX(100%)'}))
      ], {optional: true}),
      query(':enter', [
        animate('1.0s ease-in-out', style({transform: 'translateX(0%)'})),
        animateChild()
      ], {optional: true}),
    ]),
  ]),

]);

export const valueUpdated = trigger('valueUpdated', [
  transition(":increment, :decrement, * => *", group([
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(40%)' }),
      animate('.5s ease-out', style({ opacity: 1, transform: 'translateX(0%)' }))
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1, transform: 'translateX(0%)' }),
      animate('.5s ease-out', style({ opacity: 0, transform: 'translateX(-40%)' }))
    ], { optional: true })
  ]))
]);
