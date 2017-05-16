// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyAuDinv8z5S_Ym00MHJqZYZyh6UBooTPGM",
    authDomain: "ng-notes-abb75.firebaseapp.com",
    databaseURL: "https://ng-notes-abb75.firebaseio.com",
    projectId: "ng-notes-abb75",
    storageBucket: "ng-notes-abb75.appspot.com",
    messagingSenderId: "586189256171"
  }
};
