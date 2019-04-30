# ng-scrolltop

[![npm](https://img.shields.io/npm/v/ng-scrolltop.svg)](https://www.npmjs.com/package/ng-scrolltop)
[![npm License](https://img.shields.io/npm/l/ng-scrolltop.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

`scrolltop` component monitors current Y position in a long page or element then if scrolled down enough, shows up a clickable, unobtrusive icon that scrolls to top smoothly:

```html
<div class="longList">
  ...
</div>

<scrolltop></scrolltop>
```

## Optional inputs

`scrolltop` icon will show in left bottom of the screen and have some default attributes' values that can be adjusted by providing optional inputs like:
```html
<scrolltop 
  [bottom]="'55px'" 
  [background]="'green'" 
  [size]="'60px'" 
  [sizeInner]="'36'" 
  [fill]="'white'">
</scrolltop>
```

By default, the library will work with `window` object but if your page has a scrolling element, you can pass over the `id` of that element like `[elementId]="'my-scrolling-div'"` to let the library work with the element not `window`.

A [Stackblitz demo](https://stackblitz.com/edit/angular-ng-scrolltop) is available to show the usage.

## Installation

```
// to install
npm install ng-scrolltop --save
yarn add ng-scrolltop

// in app.module.ts
import { NgScrolltopModule } from 'ng-scrolltop';
@NgModule({
  imports: [
    NgScrolltopModule,

// in template
<scrolltop></scrolltop>
```
