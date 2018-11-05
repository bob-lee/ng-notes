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
const NOTICE_EVERY = 15;

@Directive({ selector: '[idleClick]' })
export class NgIdleClickDirective implements OnInit, OnDestroy {

  private player: AnimationPlayer;
  private timer;
  private countAnimate = 0;
  private _toAnimate: boolean;
  get toAnimate() { return this._toAnimate; }
  set toAnimate(value) {
    this._toAnimate = value;
    if (value) this.playDefaultAnimation();
  }

  @Input() idleClickLoader = '';
  @Output() idleClick: EventEmitter<any> = new EventEmitter();
  @Output() tookLong: EventEmitter<any> = new EventEmitter();
  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.busyService.busy) { // do nothing
      if (this.busyService.isDevMode) console.warn('busy');
      return;
    } else { // serve
      if (this.busyService.isDevMode) console.warn('click');
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

  constructor(private busyService: NgIdleClickService,
    private el: ElementRef,
    private renderer: Renderer2,
    private builder: AnimationBuilder) { }

  ngOnInit() {
    if (this.busyService.isDevMode) console.log(`NgIdleClickDirective(${this.idleClickLoader})`);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.player) this.player.destroy();
  }

  done = () => {
    this.busyService.reset();
    this.countAnimate = 0;
    this.toAnimate = false;
    if (this.idleClickLoader)
      this.renderer.removeClass(this.el.nativeElement, this.idleClickLoader);

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.busyService.isDevMode) console.warn('done');
  };

  animationDone = () => {
    if (this.toAnimate) { // continue
      if (this.countAnimate++ % NOTICE_EVERY === (NOTICE_EVERY - 1)) {
        this.tookLong.emit({ event: this.countAnimate, done: this.done });
      }
      this.playDefaultAnimation();
    }
    if (this.busyService.isDevMode) console.log('animationDone()', !!this.toAnimate, !!this.player);
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
      if (this.busyService.isDevMode) console.log('create@playDefaultAnimation');
    }

    this.player.onDone(this.animationDone);
    this.player.play();
  }

}
