# ng-scrolltop

[![npm](https://img.shields.io/npm/v/ng-scrolltop.svg)](https://www.npmjs.com/package/ng-scrolltop)
[![npm License](https://img.shields.io/npm/l/ng-scrolltop.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

`scrolltop` component detects current Y position in a long page and shows up a clickable, unobtrusive icon that scrolls to page top smoothly:

```
// template
<div class="longList">
  ...
</div>

<scrolltop></scrolltop>
```

By default, `scrolltop` component placed in left bottom of the screen with background color of `#333` and you can override them by providing optional inputs like `[bottom]="'60px'" [background]="'#999'"`. 

A [Stackblitz demo](https://stackblitz.com/edit/angular-ng-scrolltop) is available to show the usage.

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
