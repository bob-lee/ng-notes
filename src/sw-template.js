importScripts('/workbox-sw.js');
//self.workbox.logLevel = self.workbox.LOG_LEVEL.verbose;

const w = new self.WorkboxSW();

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

w.precache([]);

// app-shell
//w.router.registerNavigationRoute('/index.html');
w.router.registerRoute('/', w.strategies.networkFirst());
w.router.registerRoute(/^\/$|login|group/, w.strategies.networkFirst());

// webfont-cache
const webFontHandler = w.strategies.cacheFirst({
  cacheName: 'webfont-cache',
  cacheExpiration: {
    maxEntries: 20
  },
  cacheableResponse: { statuses: [0, 200] }
});
w.router.registerRoute(/https:\/\/fonts.googleapis.com\/.*/, webFontHandler);
w.router.registerRoute(/https:\/\/fonts.gstatic.com\/.*/, webFontHandler);
w.router.registerRoute(/https:\/\/use.fontawesome.com\/.*/, webFontHandler);

// storage-cache
const STORAGE1 = /https:\/\/firebasestorage.googleapis.com\/v0\/b\/ng-notes-abb75.appspot.com\/o\/.*/;
const STORAGE2 = /https:\/\/storage.googleapis.com\/ng-notes-abb75.appspot.com\/.*/;
const matchCb = ({url, event}) => {
  return STORAGE1.test(url) || STORAGE2.test(url) ? {url} : null;
};
w.router.registerRoute(matchCb,
  w.strategies.cacheFirst({
    cacheName: 'storage-cache',
    cacheExpiration: {
      maxEntries: 60
    },
    cacheableResponse: { statuses: [0, 200] }
  })
);
