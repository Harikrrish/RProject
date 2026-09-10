// Run an isolated Chrome with --remote-debugging-port=9333 and npm run dev first.
// Uses native CDP: no downloaded browser driver or site dependency is needed.
import assert from 'node:assert/strict';
import { writeFile, mkdir, readFile } from 'node:fs/promises';

const origin = process.env.SITE_URL || 'http://127.0.0.1:4173';
const cdp = process.env.CDP_URL || 'http://127.0.0.1:9333';
const galleryManifest = JSON.parse(await readFile(new URL('../content/gallery.json', import.meta.url), 'utf8'));
const tabs = await (await fetch(`${cdp}/json`)).json();
const tab = tabs.find(tab => tab.type === 'page');
assert(tab, 'Start an isolated Chrome with remote debugging enabled.');
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
const errors = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
};
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const run = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const navigate = async path => { await call('Page.navigate', { url: origin + path }); await pause(500); await run('document.fonts.ready'); };
const viewport = (width, height) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
const screenshot = async name => writeFile(`/tmp/alankaar-review/${name}.png`, Buffer.from((await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false })).data, 'base64'));
try {
  await mkdir('/tmp/alankaar-review', { recursive:true });
  await call('Runtime.enable'); await call('Page.enable');
  await viewport(1440, 1000); await navigate('/');
  assert.match(await run('document.title'), /Interior Designers in Chennai/);
  assert.equal(await run('document.querySelectorAll("h1").length'), 1);
  await screenshot('desktop-shell');
  for (const [stage, progress] of [[1,.25],[2,.5],[3,.75],[4,1],[0,0]]) {
    await run(`window.scrollTo({top:(document.getElementById('transformation').offsetHeight-document.querySelector('.hero-sticky').offsetHeight)*${progress},behavior:'instant'})`);
    await pause(150);
    assert.equal(await run('document.querySelector(".scene-step.active").dataset.stage'), String(stage));
    if (stage === 4) await screenshot('desktop-complete');
  }
  await run('document.querySelector("[data-filter=kitchen]").click()');
  assert.equal(await run('document.querySelectorAll(".design-card:not([hidden])").length'), galleryManifest.categoryCounts.Kitchens);
  assert.equal(await run('[...document.querySelectorAll(".design-card:not([hidden])")].every(x=>x.dataset.category === "kitchen")'), true);
  for (const [category,total] of Object.entries(galleryManifest.categoryCounts)) {
    const key = ({'Living rooms':'living',Kitchens:'kitchen',Bedrooms:'bedroom',Wardrobes:'wardrobe',Balconies:'balcony'})[category] || category.toLowerCase();
    await run(`document.querySelector('[data-filter="${key}"]').click()`);
    assert.equal(await run('document.querySelectorAll(".design-card:not([hidden])").length'),total,`Full category is not visible: ${category}`);
    assert((await run('document.querySelectorAll(".design-card[data-kind=generated-concept]:not([hidden])").length'))>=15,`New images missing: ${category}`);
    assert((await run('document.getElementById("gallery-room-view").href')).includes('room='+category.toLowerCase().replace(/[^a-z0-9]+/g,'-')));
  }
  await run('document.querySelector("[data-filter=all]").click()');
  assert.equal(await run('document.querySelectorAll(".design-card").length'), galleryManifest.imageCount);
  assert.equal(await run('document.querySelectorAll(".design-card:not([hidden])").length'), 24);
  await run('document.getElementById("gallery-more").click()');
  assert.equal(await run('document.querySelectorAll(".design-card:not([hidden])").length'), 48);
  await run('document.querySelector("[data-filter=all]").click()');
  await run('document.querySelector(".design-card").click()');
  assert.equal(await run('document.getElementById("gallery-lightbox").open'), true);
  const firstDesign = await run('document.getElementById("lightbox-image").src');
  await run('document.querySelector(".lightbox-next").click()');
  assert.notEqual(await run('document.getElementById("lightbox-image").src'), firstDesign);
  await call('Input.dispatchKeyEvent', { type:'keyDown', key:'ArrowLeft', code:'ArrowLeft' });
  assert.equal(await run('document.getElementById("lightbox-image").src'), firstDesign);
  await call('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape' });
  await pause(100);
  assert.equal(await run('document.getElementById("gallery-lightbox").open'), false);
  assert.equal(await run('document.activeElement.classList.contains("design-card")'), true);
  await run('document.querySelector(".design-card").click();document.getElementById("lightbox-enquire").click()');
  await pause(150);
  assert.equal(await run('document.getElementById("gallery-lightbox").open'), false);
  assert.equal(await run('location.hash'), '#contact');
  assert.equal(await run('document.activeElement.id'), 'contact-name');
  assert.equal(await run('document.querySelectorAll(".review-card").length'), 5);
  await run('document.querySelector("[data-review-direction=\\"1\\"]").click()');
  await pause(500);
  assert(await run('document.querySelector(".reviews-track").scrollLeft > 0'));
  await run('document.getElementById("ourdesign").scrollIntoView({behavior:"instant"})'); await pause(200); await screenshot('desktop-gallery');
  await run('document.getElementById("testimonials").scrollIntoView({behavior:"instant"})'); await pause(100); await screenshot('desktop-reviews');
  await run('document.querySelector(".faq-list summary").click()');
  assert.equal(await run('document.querySelector(".faq-list details").open'), true);
  for (const [width,height] of [[320,568],[390,844],[600,900],[620,900],[650,900],[768,1024],[844,390],[1024,768],[1440,1000]]) {
    await viewport(width,height); await run("window.scrollTo({top:0,behavior:'instant'})"); await pause(120);
    const overflow = await run('[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().width && (e.getBoundingClientRect().right>innerWidth+1 || e.getBoundingClientRect().left < -1) && getComputedStyle(e).position!=="fixed").map(e=>e.className).filter(Boolean).slice(0,12)');
    assert(await run('document.documentElement.scrollWidth <= innerWidth'), `Horizontal overflow at ${width}: ${overflow}`);
    if (width > 1100) assert(await run('document.querySelector(".brand").getBoundingClientRect().right < document.querySelector(".site-nav").getBoundingClientRect().left'), `Navigation overlaps brand at ${width}`);
    assert(await run('document.querySelector(".brand").getBoundingClientRect().right < document.querySelector(".header-phone").getBoundingClientRect().left'), `Phone overlaps brand at ${width}`);
    assert(await run('document.querySelector(".hero-content .button").getBoundingClientRect().bottom < document.querySelector(".hero-bottom").getBoundingClientRect().top'), `Hero copy overlaps controls at ${width}x${height}`);
    if (width === 390) {
      await screenshot('mobile-shell');
      await run('document.querySelector(".nav-toggle").click()');
      assert.equal(await run('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'), 'true');
      assert.equal(await run('getComputedStyle(document.querySelector(".site-nav")).display'), 'flex');
      await call('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape' });
      assert.equal(await run('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'), 'false');
      await run('document.getElementById("ourdesign").scrollIntoView({behavior:"instant"})'); await pause(120); await screenshot('mobile-work');
      await run('document.querySelector(".design-card").click()'); await pause(120); await screenshot('mobile-lightbox');
      assert(await run('document.getElementById("gallery-lightbox").getBoundingClientRect().right <= innerWidth'), 'Mobile lightbox overflows');
      await run('document.querySelector(".lightbox-close").click()');
    }
  }
  await call('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion', value:'reduce' }] });
  await pause(150);
  assert.equal(await run('document.documentElement.classList.contains("motion-enabled")'), false);
  assert.equal(await run('getComputedStyle(document.querySelector(".scene-complete")).opacity'), '1');
  await run('document.querySelector("[data-stage=\\"0\\"]").click()');
  await pause(150);
  assert.equal(await run('getComputedStyle(document.querySelector(".scene-complete")).opacity'), '0', await run('JSON.stringify({motion:matchMedia("(prefers-reduced-motion: reduce)").matches, inline:document.querySelector(".scene-complete").style.opacity, active:document.querySelector(".scene-step.active").dataset.stage})'));
  await call('Emulation.setEmulatedMedia', { features:[] });
  // Stub the request before submitting: this never contacts the business.
  await run(`window.fetch=async()=>new Response('{}',{status:503,headers:{'content-type':'application/json'}});const f=document.getElementById('consultation-form');f.elements.name.value='Browser Test';f.elements.phone.value='9999999999';f.elements.email.value='test@example.com';f.requestSubmit();`);
  await pause(100);
  assert.match(await run('document.getElementById("form-status").textContent'), /could not be sent/);
  assert.equal(await run('document.getElementById("contact-name").value'), 'Browser Test');
  await run(`window.fetch=async()=>new Response('{"success":true}',{status:200,headers:{'content-type':'application/json'}});document.getElementById('consultation-form').requestSubmit()`);
  await pause(100);
  assert.match(await run('document.getElementById("form-status").textContent'), /has been sent/);
  assert.equal(await run('document.getElementById("contact-name").value'), '');
  for (const path of ['/blogs.html','/blog/modern-kitchen-design-chennai/']) {
    for (const width of [320,390,620,768,1440]) {
      await viewport(width, 1000); await navigate(path);
      assert(await run('document.documentElement.scrollWidth <= innerWidth'), `${path} overflows at ${width}`);
      assert.equal(await run('document.querySelectorAll("h1").length'), 1);
      if (width === 1440) await screenshot(path.includes('modern') ? 'article-desktop' : 'journal-desktop');
      if (width === 390) await screenshot(path.includes('modern') ? 'article-mobile' : 'journal-mobile');
    }
  }
  const redirect = await fetch(origin + '/blog/best-interiors-in-omr/', { redirect:'manual' });
  assert.equal(redirect.status,301);
  const missing = await fetch(origin + '/not-a-real-page'); assert.equal(missing.status,404);
  const privateFile = await fetch(origin + '/content/blog-config.json'); assert.equal(privateFile.status,404);
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: Chrome at 320–1440px; five scroll stages; gallery; mobile menu; reduced motion; FAQ; mocked contact success/failure; journal/article; redirects; private-file exclusion. Screenshots: /tmp/alankaar-review/');
} finally { socket.close(); }
