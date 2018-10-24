import { animate, animateChild, animation, group, keyframes,
  query, style, transition, trigger } from '@angular/animations';

export const PERIOD_1 = '500ms ease';
export const PERIOD_2 = '1s ease-in-out';
const WIDTH = 'calc(100% - 40px)';
/*
31.8 = 15 (.parent padding-left) + 16.8

16.8 seems to be a scrollbar width in this browser
*/
const WIDTH2 = 'calc(100% - 16.8px)';
const TIMING = '1s .5s ease-in-out';

export const routerTransition = trigger('routerTransition', [
  transition('home => about, group => groups', [ // slide upward
    query(':enter, :leave', style({ position: 'fixed', width: WIDTH2, height: '*' })),
    query(':leave', style({ transform: 'translateY(0%)', opacity: 1 })),
    query(':enter', style({ transform: 'translateY(2em)', opacity: 0 })),

    group([
      query(':leave', animate(TIMING, style({transform: 'translateY(-2em)', opacity: 0}))),
      query(':enter', animate(TIMING, style({transform: 'translateY(0%)', opacity: 1})))
    ])
  ]),
  transition('about => home, groups => group', [ // slide downward
    query(':enter, :leave', style({ position: 'fixed', width: WIDTH2, height: '*' })),
    query(':leave', style({ transform: 'translateY(0%)', opacity: 1 })),
    query(':enter', style({ transform: 'translateY(-2em)', opacity: 0 })),

    group([
      query(':leave', animate(TIMING, style({ transform: 'translateY(2em)', opacity: 0 }))),
      query(':enter', animate(TIMING, style({ transform: 'translateY(0%)', opacity: 1 })))
    ])
  ]),
]);
/*
export const titleChanged = trigger('titleChanged', [
  transition('* => *', [
    query(':enter', style({ opacity: 0 }), { optional: true }),
    query(':leave', style({ opacity: 1 }), { optional: true }),
    group([
      query(':leave', animate('1s ease-out', style({ opacity: 0 })), { optional: true }),
      query(':enter', animate('1s ease-out', style({ opacity: 1 })), { optional: true })
    ])
  ])
]);
*/
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

// export const expandAnimation = animation([
//   style({ overflow: 'hidden', opacity: 0/*, height: 0*/ }),
//   animate('{{ time }}', style({ opacity: 1/*, height: '*'*/ }))
// ], { params: { time: PERIOD_1 }});

// export const routerTransition = trigger('routerTransition', [ // opacity only
//   transition('login => home, groups => group', [
//     query(':enter, :leave', style({ position: 'fixed', width: WIDTH, height: '100%' }), {optional: true}),
//     query(':leave', style({ opacity: 1 })),
//     query(':enter', style({ opacity: 0 }), {optional: true}),

//     group([
//       query(':leave', animate(PERIOD_2, style({ opacity: 0 })), {optional: true}),
//       query(':enter', [
//         animate(PERIOD_2, style({ opacity: 1 })),
//         //animateChild()
//       ], {optional: true}),
//     ]),
//   ]),
//   transition('group => groups, home => login', [
//     query(':enter, :leave', style({ position: 'fixed', width: WIDTH, height: '100%' }), {optional: true}),
//     query(':leave', style({ opacity: 1 })),
//     query(':enter', style({ opacity: 0 }), {optional: true}),

//     group([
//       query(':leave', animate(PERIOD_2, style({ opacity: 0 })), {optional: true}),
//       query(':enter', [
//         animate(PERIOD_2, style({ opacity: 1 })),
//         animateChild()
//       ], {optional: true}),
//     ]),
//   ]),

// ]);

export const valueUpdated = trigger('valueUpdated', [
  transition(':increment, :decrement, * => *', group([
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
