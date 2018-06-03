import { animate, animateChild, animation, group, query, stagger, style, transition, trigger, useAnimation } from '@angular/animations';

export const PERIOD_1 = '500ms ease';
export const PERIOD_2 = '500ms ease';

export const listAnimation = animation([
  query(':enter', [
    style({ transform: 'scale(0)', opacity: 0 })
  ], { optional: true }),
  query(':leave', [
    style({ opacity: 1 }),
    animate('{{ time }}', style({ opacity: 0 }))
  ], { optional: true }),
  query(':enter', [
    animate('{{ time }}', style({ transform: 'scale(1.5)', opacity: 1 }))
  ], { optional: true })
], { params: { time: PERIOD_1 }});

export const listChild = trigger('listChild', [
  transition('* => *', [
    query(':enter', [
      style({ height: 0, opacity: 0 })
    ], { optional: true }),
    /*query(':enter', [
      style({ transform: 'scale(0)', opacity: 0 })
    ], { optional: true }),*/
    query(':leave', [ // item removed
      style({ opacity: 1, height: '5em' }),
      animate('1s ease-out', style({ opacity: 0, height: 0 }))
    ], { optional: true }),
    /*query(':enter', [
      animate('1000ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
    ], { optional: true })*/
    query(':enter', [
      animate('1s', style({ height: '*', opacity: 1 }))
    ], { optional: true })

  ])
]);

export const itemAnimation = animation([
  query('.item', style({ opacity: 0, height: 0 }), { optional: true }),
  query('.item', [
    stagger(300, [
      animate('{{ time }}', style({ opacity: 1, height: '*'})),
    ])
  ], { optional: true })
], { params: { time: PERIOD_2 }});

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
