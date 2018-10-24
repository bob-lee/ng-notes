# ng-animate-value

[![npm](https://img.shields.io/npm/v/ng-animate-value.svg)](https://www.npmjs.com/package/ng-animate-value)
[![npm License](https://img.shields.io/npm/l/ng-animate-value.svg?style=flat-square)](https://opensource.org/licenses/mit-license.php)

This library provides a directive `blAnimateValue` and a component `bl-header` to animate value change on a named property in flexible way:

```html
<div blAnimateValue [prop]="prop" [left]="left">
  <h2 class="enter">{{ propEnter }}</h2>
  <h2 class="leave">{{ propLeave }}</h2>
</div>

<bl-header [prop]="title" [left]="inside"
  [styles]="{width: '300px', fontSize: '2rem'}">
</bl-header>
```