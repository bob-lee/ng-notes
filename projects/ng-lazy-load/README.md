# ng-lazy-load

[![npm](https://img.shields.io/npm/v/ng-lazy-load.svg)](https://www.npmjs.com/package/ng-lazy-load)
[![npm License](https://img.shields.io/npm/l/ng-lazy-load.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

`ng-lazy-load` library is an extension of [@trademe/ng-defer-load](https://github.com/TradeMe/ng-defer-load) to allow more control on its behaviour. You can use `lazyLoad` directive with optional `manualRegister` attribute, `[url]` input, `[index]` input and `LazyLoadService` as required.

```html
<my-element
    *ngFor="let item of items$ | async; let i = index"
    lazyLoad
    [url]="item.url"
    [index]="i" 
    manualRegister>
</my-element>
```
```javascript
// in MyElementComponent
constructor(private lazyLoadService: LazyLoadService) {
  this.lazyLoadService.announcedIntersection.subscribe(params => {
    const { index, state } = params;
    if ((this.index - index) <= 2) {
      this.toLoad = true; // to load 2 resources ahead beyond the intersecting index
    }
  });
}
// in parent component
ngOnInit() {
  setTimeout(_ => this.lazyLoadService.announceOrder('register'), 1500);
}
```

A [Stackblitz demo](https://stackblitz.com/edit/angular-deferload-not-working-with-animation) is available to show the usage.

```
// to install
npm install ng-lazy-load

// in app.module.ts
import { NgLazyLoadModule } from 'ng-lazy-load';
@NgModule({
  imports: [
    NgLazyLoadModule,

// in template
<div (lazyLoad)="toLoad=true">
  <img [src]="toLoad ? url : ''">
```
