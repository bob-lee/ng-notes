# ng-lazy-load

[![npm](https://img.shields.io/npm/v/ng-lazy-load.svg)](https://www.npmjs.com/package/ng-lazy-load)
[![npm License](https://img.shields.io/npm/l/ng-lazy-load.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

`ng-lazy-load` library provides `lazyLoad` directive and `LazyLoadService` to lazy load your resource file when it is near to be shown on screen. This library is an extension of [@trademe/ng-defer-load](https://github.com/TradeMe/ng-defer-load) to allow more control on its behaviour and make it useful in `ngFor` loop. The library will output debug logs to console in the development mode to show what's happening inside the library:
```
...
lazyLoad never
lazyLoad register
loading [0] (Intersecting)
loading [1] (NearIntersecting 0)
loading [2] (NearIntersecting 0)
loading [5] (Intersecting)
...
```

## Usage

Simplest usage would be:
```html
<div (lazyLoad)="toLoad=true">
  <img [src]="toLoad ? url : ''">
</div>
```

A typical usage for `ngFor` loop would be:
```html
<my-element #myElement
    *ngFor="let item of items$ | async; let i = index"
    (lazyLoad)="myElement.doLoad($event)" [url]="item.url" [index]="i" >
</my-element>
```
```javascript
// in my-element component
import { IntersectionState } from 'ng-lazy-load';

doLoad(state: IntersectionState) {
  this.toLoad = true;
}
```
By having additional `[url]` and `[index]` inputs, the directive can choose to register the api only for elements that has a resource to load and provide some flexibility in its behaviour to cope with various needs.

### LazyLoadService.loadAheadCount

Default value of `LazyLoadService.loadAheadCount` property is 2 which means that if [n]th element is intersecting, [n+1]th and [n+2]th elements will also be loaded as well.
You can override this by setting to other value:
```javascript
// in parent component
import { LazyLoadService } from 'ng-lazy-load';

constructor(private lazyLoadService: LazyLoadService) { }

ngOnInit() {
  this.lazyLoadService.loadAheadCount = 5; // load 5 elements ahead beyond the intersecting one
```

### LazyLoadService.registerAfter()

By default, `lazyLoad` directive will register the `IntersectionObserver` api on its host element's init. But you may want to delay its registration:
```javascript
// in parent component
ngOnInit() {
  this.lazyLoadService.registerAfter(1500); // let directives register after 1500 msec 
```

### LazyLoadService.registerLater() and LazyLoadService.registerAll()

Or let directives register later when asked by the parent component:
```javascript
// in parent component
ngOnInit() {
  this.lazyLoadService.registerLater(); // let directives not register on init
}
// somewhere in parent component
this.lazyLoadService.registerAll(); // let directives register now
```

A [Stackblitz demo](https://stackblitz.com/edit/angular-deferload-not-working-with-animation) is available to show the usage.

## Installation

```
// to install
npm install ng-lazy-load

// in app.module.ts
import { LazyLoadModule } from 'ng-lazy-load';
@NgModule({
  imports: [
    LazyLoadModule,

// in template
<div (lazyLoad)="toLoad=true">
  <img [src]="toLoad ? url : ''">
```
