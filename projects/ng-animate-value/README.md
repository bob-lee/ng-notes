# ng-animate-value

[![npm](https://img.shields.io/npm/v/ng-animate-value.svg)](https://www.npmjs.com/package/ng-animate-value)
[![npm License](https://img.shields.io/npm/l/ng-animate-value.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

This library provides a component `bl-animate-value` to animate value changes on a named property with default or custom styles, internally it uses a directive `blAnimateValue`:

```html
<div class="box"
  blAnimateValue [prop]="prop" [left]="left">
  <div class="inner enter">
    <div class="inner-box" [attr.data-help]="helpEnter">
      {{ propEnter }}
    </div>
  </div>
  <div class="inner leave">
    <div class="inner-box" [attr.data-help]="helpLeave">
      {{ propLeave }}
    </div>
  </div>
</div>

<bl-animate-value
  [prop]="myProperty1"
  [left]="!left"
  [helpLeft]="helpLeft"
  [helpRight]="helpRight">
</bl-animate-value>

<bl-animate-value id="prop1234"
  [prop]="myProperty2"
  [left]="!left"
  [styles]="{background: 'red', height:'2em', width: '2em', borderRadius: '1em'}"
  [stylesInner]="{color: 'white', alignItems:'center', justifyContent:'center'}">
</bl-animate-value>
```

A [Stackblitz demo](https://stackblitz.com/edit/angular-ng-animate-value) is available to show the various usage.
