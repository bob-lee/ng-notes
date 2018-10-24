import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { AnimationBuilder, AnimationMetadata, AnimationPlayer, animate, group, query, style } from '@angular/animations';

const DEFAULT_ANIMATION_PERIOD = '.5s ease-out';

@Directive({ selector: '[blAnimateValue]' })
export class AnimateValueDirective implements OnDestroy {

  private player: AnimationPlayer;
  private _prop: string;
  @Input()
  set prop(value) {
     this._prop = value;
     this.playDefaultAnimation();
  }
  @Input() left: boolean;

  constructor(private el: ElementRef,
    private builder: AnimationBuilder) { }

  ngOnDestroy() {
    if (this.player) this.player.destroy();
  }

  playDefaultAnimation() {
    if (this.player) {
      this.player.destroy();
    }

    const factory = this.builder.build([
      this.getMetadata(this.left)
    ]);
    this.player = factory.create(this.el.nativeElement);

    this.player.play();
  }

  private getMetadata(left: boolean,
    timing: string = DEFAULT_ANIMATION_PERIOD,
    distanceX: number= 50,
    distanceUnit: string = 'px'): AnimationMetadata {

    const x = distanceX * (left ? 1 : -1);
    const transformBegin = `translateX(${x}${distanceUnit})`;
    const transformEnd = `translateX(${x * -1}${distanceUnit})`;

    return group([
      query('.enter', [
        style({ opacity: 0, transform: transformBegin }),
        animate(timing, style({ opacity: 1, transform: 'translateX(0%)' }))
      ], { optional: true }),
      query('.leave', [
        style({ opacity: 1, transform: 'translateX(0%)' }),
        animate(timing, style({ opacity: 0, transform: transformEnd }))
      ], { optional: true })
    ]);
  }
}
