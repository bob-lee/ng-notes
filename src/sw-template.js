importScripts('/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

workbox.precaching.precacheAndRoute([]);

// app-shell
workbox.routing.registerRoute('/', workbox.strategies.networkFirst());
workbox.routing.registerRoute(/^\/$|login|group/, workbox.strategies.networkFirst());

// storage-cache
const STORAGE1 = /https:\/\/firebasestorage.googleapis.com\/v0\/b\/ng-notes-abb75.appspot.com\/o\/.*/;
const STORAGE2 = /https:\/\/storage.googleapis.com\/ng-notes-abb75.appspot.com\/.*/;
const matchCb = ({url, event}) => {
  return STORAGE1.test(url) || STORAGE2.test(url) ? {url} : null;
};
workbox.routing.registerRoute(matchCb,
  workbox.strategies.cacheFirst({
    cacheName: 'storage-cache',
    plugins: [
      new workbox.expiration.Plugin({maxEntries: 60}),
      new workbox.cacheableResponse.Plugin({statuses: [0, 200]}),
    ],
  })
);

// webfont-cache
const webFontHandler = workbox.strategies.cacheFirst({
  cacheName: 'webfonts',
  plugins: [
    new workbox.expiration.Plugin({maxEntries: 20}),
    new workbox.cacheableResponse.Plugin({statuses: [0, 200]}),
  ],
});
workbox.routing.registerRoute(/https:\/\/fonts.googleapis.com\/.*/, webFontHandler);
workbox.routing.registerRoute(/https:\/\/fonts.gstatic.com\/.*/, webFontHandler);
