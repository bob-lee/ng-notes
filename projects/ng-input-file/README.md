# ng-input-file

[![npm](https://img.shields.io/npm/v/ng-input-file.svg)](https://www.npmjs.com/package/ng-input-file)
[![npm License](https://img.shields.io/npm/l/ng-input-file.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

This library provides a component `input-file` that wraps a legacy `input[type=file]` element styled with `Material` components, enables user to choose file from local device or Google drive (needs extra setup below). This library assumes your application is already using `@angular/material` and one of the themes:

<img width="50%" src="https://raw.githubusercontent.com/bob-lee/ng-notes/master/projects/ng-input-file/ng-input-file.PNG">

```html
<!-- legacy input -->
<input type="file" accept="image/*, video/*" (change)="fileChanged($event)">

<!-- using a component -->
<input-file (files)="fileChanged($event)" #input1></input-file>
```

`input-file` component emits `(files)` output whenever user chooses or removes a file. By default, the component accepts `image/*, video/*` and you can override it by providing optional input like `[accept]="'image/*'"`. 

To enable Google drive, you'd need to import `GoogleDriveService` and initialize it with [your developer information](https://developers.google.com/drive/api/v3/picker) like below:
```javascript
import { NgInputFileComponent, GoogleApiConfig, GoogleDriveService } from 'ng-input-file';

const GOOGLE_CONFIG: GoogleApiConfig = {
  developerKey: 'your-developer-key',
  appId: 'your-app-id',
  clientId: 'your-client-id'
}

export class MyComponent {

  constructor(private googleDrive: GoogleDriveService) {
    this.googleDrive.init(GOOGLE_CONFIG);
  }
```

A [Stackblitz demo](https://stackblitz.com/edit/angular-ng-input-file) is available to show the usage.


```
// to install
npm install ng-input-file --save
yarn add ng-input-file

// in app.module.ts
import { NgInputFileModule } from 'ng-input-file';
@NgModule({
  imports: [
    NgInputFileModule,

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
