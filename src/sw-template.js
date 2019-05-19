importScripts('/workbox-sw.js');

workbox.core.skipWaiting();
workbox.core.clientsClaim();
workbox.precaching.precacheAndRoute([]);

// app-shell
workbox.routing.registerRoute('/', new workbox.strategies.NetworkFirst());
workbox.routing.registerRoute(/^\/$|login|group/, new workbox.strategies.NetworkFirst());

// storage-cache
const STORAGE1 = /https:\/\/firebasestorage.googleapis.com\/v0\/b\/ng-notes-abb75.appspot.com\/o\/.*/;
const STORAGE2 = /https:\/\/storage.googleapis.com\/ng-notes-abb75.appspot.com\/.*/;
const matchCb = ({url, event}) => {
  return STORAGE1.test(url) || STORAGE2.test(url) ? {url} : null;
};
workbox.routing.registerRoute(matchCb,
  new workbox.strategies.CacheFirst({
    cacheName: 'storage-cache',
    plugins: [
      new workbox.expiration.Plugin({maxEntries: 60}),
      new workbox.cacheableResponse.Plugin({statuses: [0, 200]}),
    ],
  })
);

// webfont-cache
const webFontHandler = new workbox.strategies.CacheFirst({
  cacheName: 'webfont-cache',
  plugins: [
    new workbox.expiration.Plugin({maxEntries: 20}),
    new workbox.cacheableResponse.Plugin({statuses: [0, 200]}),
  ],
});
workbox.routing.registerRoute(/https:\/\/fonts.googleapis.com\/.*/, webFontHandler);
workbox.routing.registerRoute(/https:\/\/fonts.gstatic.com\/.*/, webFontHandler);
