const CACHE='ph-shell-195d0dc1abea';
const SHELL=['/','/index.html','/app.js','/domain.js','/db.js','/vision.js','/confirm.js','/backup.js','/style.css','/manifest.webmanifest','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ph-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin||new URL(event.request.url).pathname.startsWith('/api/'))return;event.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(event.request,{ignoreSearch:true});return cached||fetch(event.request);}));});
