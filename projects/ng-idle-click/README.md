# ng-idle-click

This library provide a directive `idleClick` to prevent multiple clicks or submits by using a singlton service maintaining a `busy` flag. Normally `click` event is handled like:


```
<button (click)="handle($event)">

handle(event) {
  // do something
}
```


Instead handle `idleClick` event that emits with the usual `event` plus a function `done` to be called after job done:
```
<button (idleClick)="handle($event)">

handle({ event, done }) {
  // do something
  done(); // and call this
}
```


At `click` event, a ` busy` flag is set to true and at `done` function call, it is set to false and while it is busy, any clicks will be ignored.

`done` function also can be called asynchronously inside a callback function or `async` handler function like:

```
handleAsync1({ event, done }) {
  setTimeout((event) => {
    // do something
    done();
  });
}

async handleAsync2({ event, done }) {
  await this.doSomething(event);
  done();
}
```


If handling a click event takes longer than 1000ms, the directive will add `my-loader` class to the host element then remove it at the time `done` function is called so that user can indicate it is busy handling it. 

A [Stackblitz demo](https://stackblitz.com/edit/angular-zta1qz?embed=1&file=src/app/app.component.ts) is available to show the various usage.


```
// to install
npm install ng-idle-click

// in app.module.ts
import { NgIdleClickModule } from 'ng-idle-click';
@NgModule({
  imports: [
    NgIdleClickModule,

// in template
<button (idleClick)="handle($event)">

// in component
handle({ event, done }) {
  // do something
  done(); // and call this
}
```
