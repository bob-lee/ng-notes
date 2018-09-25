import {
  Directive, ElementRef, EventEmitter,
  HostListener, Input, Output, Renderer2, OnInit, OnDestroy
} from '@angular/core';
import {
  AnimationBuilder, AnimationPlayer, animate, keyframes, style
} from '@angular/animations';
import { NgIdleClickService } from './ng-idle-click.service';

const DELAY = 1000;
const DEFAULT_ANIMATION_PERIOD = '1s';

@Directive({ selector: '[idleClick]' })
export class NgIdleClickDirective implements OnInit, OnDestroy {
  @Input() idleClickDebug: boolean = false;
  @Input() idleClickLoader: string = '';
  @Output() idleClick: EventEmitter<any> = new EventEmitter();
  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.busyService.busy) { // do nothing
      if (this.idleClickDebug) console.warn('busy');
      return;
    } else { // serve
      if (this.idleClickDebug) console.warn('click');
      this.busyService.set();
      this.toAnimate = false;
      this.timer = setTimeout(_ => { 
        if (this.busyService.busy) { // still busy serving
          if (this.idleClickLoader) // add named class
            this.renderer.addClass(this.el.nativeElement, this.idleClickLoader);
          else // or start playing default animation
            this.toAnimate = true;
        }
      }, DELAY);
      this.idleClick.emit({ event: e, done: this.done });
    }
  }
  private timer;
  private _toAnimate: boolean;
  get toAnimate() { return this._toAnimate; }
  set toAnimate(value) {
    this._toAnimate = value;
    if (value) this.playDefaultAnimation();
  }
  private player: AnimationPlayer;

  constructor(private busyService: NgIdleClickService, 
    private el: ElementRef,
    private renderer: Renderer2,
    private builder: AnimationBuilder) { }

  ngOnInit() {
    if (this.idleClickDebug) console.log(`NgIdleClickDirective(${this.idleClickLoader})`);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.player) this.player.destroy();
  }

  done = () => {
    this.busyService.reset();
    this.toAnimate = false;
    if (this.idleClickLoader)
      this.renderer.removeClass(this.el.nativeElement, this.idleClickLoader);

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.idleClickDebug) console.warn('done');
  };

  animationDone = () => {
    if (this.idleClickDebug) console.log('animationDone()', !!this.toAnimate, !!this.player);

    if (this.toAnimate) { // continue
      this.playDefaultAnimation();
    }
  }

  playDefaultAnimation() {
    if (this.player) {
      this.player.reset();
    } else {
      const factory = this.builder.build([
        animate(DEFAULT_ANIMATION_PERIOD, keyframes([
          style({ opacity: 0.9, offset: 0 }),
          style({ opacity: 0.1, offset: 0.5 }),
          style({ opacity: 0.9, offset: 1 })
        ]))
      ]);
      this.player = factory.create(this.el.nativeElement);
      if (this.idleClickDebug) console.log('create@playDefaultAnimation');
    }

    this.player.onDone(this.animationDone);
    this.player.play();
  }
  
}
