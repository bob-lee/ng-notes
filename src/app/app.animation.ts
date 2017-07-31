import { animate, animateChild, animation, group, query, stagger, style, transition, trigger, useAnimation } from '@angular/animations';

/*export const listAnimation = animation([
  query(':enter', [
    style({ opacity: 0, height: 0 })
  ], { optional: true }),
  query(':leave', [
    style({ opacity: 1, height: '*' }),
    animate('{{ time }}', style({ opacity: 0, height: 0 }))
  ], { optional: true }),
  query(':enter', stagger('300ms', [
    animate('{{ time }}', style({ opacity: 1, height: '*'}))
  ]), { optional: true })
], { params: { time: '0.6s ease' }});*/
export const listAnimation = animation([
  query(':enter', [
    style({ opacity: 0 })
  ], { optional: true }),
  // query(':leave', [
  //   style({ opacity: 1 }),
  //   animate('{{ time }}', style({ opacity: 0 }))
  // ], { optional: true }),
  query(':enter', [
    animate('{{ time }}', style({ opacity: 1 }))
  ], { optional: true })
], { params: { time: '1.6s ease' }});

export const itemAnimation = animation([
  query('.item', style({ opacity: 0, height: 0 }), { optional: true }),
  query('.item', [
    stagger(300, [
      animate('{{ time }}', style({ opacity: 1, height: '*'})),
    ])
  ], { optional: true })
], { params: { time: '.6s ease' }});

export const expandAnimation = animation([
  style({ overflow: 'hidden', opacity: 0, height: 0 }),
  animate('{{ time }}', style({ opacity: 1, height: '*' }))
], { params: { time: '1.5s ease' }});
