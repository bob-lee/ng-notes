# ng-input-file

[![npm](https://img.shields.io/npm/v/ng-input-file.svg)](https://www.npmjs.com/package/ng-input-file)
[![npm License](https://img.shields.io/npm/l/ng-input-file.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

This library provides a component `input-file` that wraps a legacy `input[type=file]` element styled with `Material` components:


```
// legacy input
<input type="file" accept="image/*, video/*" (change)="fileChanged($event)">

// using a component
<input-file (files)="fileChanged($event)" #input1></input-file>
```

`input-file` component emits `(files)` output whenever user chooses or removes a file. By default, the component accepts `image/*, video/*` and you can override it by providing optional input like `[accept]="'image/*'"`. 

A [Stackblitz demo](https://stackblitz.com/edit/angular-ng-input-file) is available to show the usage.


```
// to install
npm install ng-input-file --save
yarn add ng-input-file

// in app.module.ts
import { NgInputFileComponent } from 'ng-input-file';
@NgModule({
  declarations: [
    NgInputFileComponent,

// in template
<input-file (files)="fileChanged($event)" #input1></input-file>

// in component
import { NgInputFileComponent } from 'ng-input-file';

@ViewChild('input1')
private input1: NgInputFileComponent;

fileChanged({ files }) {
  console.log(`fileChanged ${files.length}`, files, this.input1.filename);
}
```
