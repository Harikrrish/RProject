// Run an isolated Chrome with --remote-debugging-port=9333 and npm run dev first.
// Uses native CDP: no downloaded browser driver or site dependency is needed.
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const origin = process.env.SITE_URL || 'http://127.0.0.1:4173';
const cdp = process.env.CDP_URL || 'http://127.0.0.1:9333';
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
const viewport = (width, height, deviceScaleFactor = 1) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile: width <= 600 });
const screenshot = async name => writeFile(`/tmp/alankaar-review/${name}.png`, Buffer.from((await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false })).data, 'base64'));
const ready = async (room, mode, design) => {
  for (let i=0;i<80;i++) {
    if (await run(`(!${JSON.stringify(design)} || document.querySelector('[data-viewer]').dataset.loadedDesign===${JSON.stringify(design)}) && document.querySelector('[data-viewer]').dataset.ready==='true' && document.querySelector('[data-viewer]').dataset.loadedRoom===${JSON.stringify(room)} && document.querySelector('[data-viewer]').dataset.loadedMode===${JSON.stringify(mode)}`)) return;
    await pause(100);
  }
  assert.fail(`Room failed to load: ${room}/${mode}: ${await run('document.querySelector(".viewer-status").textContent')}`);
};
const until = async (expression, message, timeout = 3000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await run(expression)) return; await pause(80); }
  assert.fail(message);
};
const cameraAt = async point => {
  await until(`document.querySelector('[data-viewer]').dataset.waypoint===${JSON.stringify(point.id)}`, `Viewpoint did not change to ${point.id}`);
  const position = await run("document.querySelector('[data-viewer]').dataset.cameraPosition.split(',').map(Number)");
  point.position.forEach((value, index) => assert(Math.abs(position[index] - value) < .003, `Wrong camera position for ${point.id}: ${position}`));
};
// Crop to the canvas so changed titles or pressed buttons cannot fake a changed model.
const canvasFingerprint = async () => {
  const clip = await run("(() => {const r=document.querySelector('.viewer-mount canvas').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()");
  const { data } = await call('Page.captureScreenshot', { format:'png', clip, captureBeyondViewport:true });
  return createHash('sha256').update(data).digest('hex');
};
try {
  await mkdir('/tmp/alankaar-review',{recursive:true});await call('Runtime.enable');await call('Page.enable');
  const rooms=await(await fetch(origin+'/js/studio-rooms.json')).json();
  const profiles=await(await fetch(origin+'/js/studio-layouts.json')).json();
  const profileById = new Map(profiles.map(profile => [profile.id, profile]));
  const totalDesigns = rooms.reduce((total, room) => total + room.designs.length, 0);
  assert.equal(rooms.length,12,'Every category needs an interactive view');
  assert.equal(totalDesigns,40);
  assert.equal(profileById.size,totalDesigns,'Every design needs its own walking model');
  const featured = rooms.find(room => room.width >= 3840) || rooms.find(room => room.id === 'living-rooms') || rooms[0];
  const bedrooms = rooms.find(room => room.id === 'bedrooms');
  await viewport(1440,1000);await navigate('/studio.html');await ready(featured.id,'panorama');
  assert.equal(await run('document.querySelectorAll(".studio-room-card").length'),12);
  await screenshot('studio-desktop-panorama');
  await run("window.__studioTestCanvas=document.querySelector('.viewer-mount canvas')");
  // Switch alternatives within each category in all modes, rather than checking one generic category model.
  for (const mode of ['panorama','layout','walkthrough']) {
    const currentRoom = await run("document.querySelector('[data-viewer]').dataset.loadedRoom");
    await run(`document.querySelector('[data-view-mode="${mode}"]').click()`);await ready(currentRoom,mode);
    for(const room of rooms) {
      await run(`document.getElementById('studio-room').value=${JSON.stringify(room.id)};document.getElementById('studio-room').dispatchEvent(new Event('change'))`);
      await ready(room.id,mode);
      const rendered = new Set();
      for (const design of room.designs) {
        await run(`document.querySelector('[data-select-design="${design.id}"]').click()`);
        await ready(room.id,mode,design.id);
        assert.equal(await run('document.getElementById("studio-design-picker").hidden'),false,`${mode}: design picker hidden`);
        assert.equal(await run(`document.querySelector('[data-select-design="${design.id}"]').getAttribute('aria-pressed')`),'true');
        assert.equal(await run('document.querySelectorAll(".viewer-mount canvas").length'),1);
        assert(await run("window.__studioTestCanvas===document.querySelector('.viewer-mount canvas')"),'Switching leaked/replaced the canvas');
        if (mode === 'panorama') {
          assert.equal(await run("Number(document.querySelector('[data-viewer]').dataset.sourceWidth)"),design.width);
          assert.equal(await run("Number(document.querySelector('[data-viewer]').dataset.sourceHeight)"),design.height);
          assert.equal(await run('document.querySelectorAll("#tour-stops button").length'),4);
        } else {
          assert.equal(design.layoutId,design.id);
          assert.equal(await run("document.querySelector('[data-viewer]').dataset.layoutId"),design.id);
          const fingerprint = await canvasFingerprint();
          assert(!rendered.has(fingerprint),`${mode} reused an identical canvas for ${design.id}`);
          rendered.add(fingerprint);
          if (mode === 'walkthrough') {
            const points = profileById.get(design.id).viewpoints;
            await cameraAt(points[0]);
            assert.equal(await run('document.querySelectorAll("#tour-stops button").length'),4);
            assert.deepEqual(await run("[...document.querySelectorAll('.walkthrough-pins [data-waypoint]')].map(button=>button.dataset.waypoint)"),points.map(point=>point.id));
            assert.deepEqual(await run("[...document.querySelectorAll('#tour-plan [data-plan-point]')].map(button=>button.dataset.planPoint)"),points.map(point=>point.id));
            await run('document.querySelectorAll("#tour-stops button")[1].click()');await cameraAt(points[1]);
            await run(`document.querySelector('#tour-plan [data-plan-point="${points[2].id}"]').click()`);await cameraAt(points[2]);
            await run(`document.querySelector('.walkthrough-pins [data-waypoint="${points[3].id}"]').click()`);await cameraAt(points[3]);
            assert.equal(await run('new URL(location.href).searchParams.get("point")'),points[3].id);
          }
        }
      }
      if(mode!=='panorama'&&['living-rooms','kitchens','pooja','bedrooms','bathrooms'].includes(room.id))await screenshot(`studio-${mode}-${room.id}`);
    }
  }
  await run('document.querySelector("[data-view-mode=panorama]").click()');await ready(rooms.at(-1).id,'panorama');
  // Keyboard and button controls must change the visible canvas, not only UI state.
  await run('document.querySelector(".viewer-mount").focus({preventScroll:true})');
  const before=(await call('Page.captureScreenshot',{format:'png'})).data;
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await pause(80);
  assert.notEqual((await call('Page.captureScreenshot',{format:'png'})).data,before,'Panorama did not rotate');
  await run('document.querySelector("[data-viewer-action=reset]").click()');
  // Rapid selection while textures are loading must finish on the latest choice.
  await run(`for(const id of ['kitchens','bedrooms','pooja']){document.getElementById('studio-room').value=id;document.getElementById('studio-room').dispatchEvent(new Event('change'));}`);
  await ready('pooja','panorama');assert.equal(await run('document.querySelectorAll(".viewer-mount canvas").length'),1);
  for(const [width,height] of [[320,568],[390,844],[600,900],[768,1024],[844,390],[1024,768],[1440,1000]]) {
    await viewport(width,height);await pause(120);
    for (const mode of ['walkthrough','layout','panorama']) {
      await run(`document.querySelector('[data-view-mode="${mode}"]').click()`);await ready('pooja',mode);
      assert(await run('document.documentElement.scrollWidth<=innerWidth'),`${mode} overflow at ${width}`);
      assert(await run('document.querySelector(".header-phone").getBoundingClientRect().right<=innerWidth'),`Phone hidden at ${width}`);
      assert.equal(await run('document.getElementById("studio-design-picker").hidden'),false);
      if (mode === 'walkthrough') assert(await run("[...document.querySelectorAll('#tour-plan button')].every(button=>{const r=button.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})"),`Tour plan controls overflow at ${width}`);
      if(width===390){await run('window.scrollTo({top:0,behavior:"instant"})');await screenshot(`studio-mobile-${mode}`);}
    }
  }
  await navigate('/studio.html?room=pooja&mode=layout');await ready('pooja','layout');
  assert.equal(await run('document.getElementById("studio-room").value'),'pooja');
  await navigate('/studio.html?room=unknown&mode=invalid');await ready(featured.id,'panorama');
  // Deep links and the design picker retain a selected design across view modes.
  const selected = bedrooms.designs[2];
  await navigate(`/studio.html?room=bedrooms&mode=panorama&design=${selected.id}`);
  await ready('bedrooms','panorama',selected.id);
  assert.equal(await run(`document.querySelector('[data-select-design="${selected.id}"]').getAttribute('aria-pressed')`),'true');
  await run('document.querySelector("[data-view-mode=layout]").click()');await ready('bedrooms','layout',selected.id);
  assert.equal(await run('document.getElementById("studio-design-picker").hidden'),false);
  assert.equal(await run("document.querySelector('[data-viewer]').dataset.layoutId"),selected.id);
  const selectedPoints = profileById.get(selected.id).viewpoints;
  await navigate(`/studio.html?room=bedrooms&mode=walkthrough&design=${selected.id}&point=${selectedPoints[2].id}`);
  await ready('bedrooms','walkthrough',selected.id);await cameraAt(selectedPoints[2]);
  assert.equal(await run(`document.querySelector('#tour-plan [data-plan-point="${selectedPoints[2].id}"]').getAttribute('aria-pressed')`),'true');
  await navigate(`/studio.html?room=bedrooms&mode=walkthrough&design=${selected.id}&point=unknown`);
  await ready('bedrooms','walkthrough',selected.id);await cameraAt(selectedPoints[0]);
  // Automatic tours advance the camera; manual navigation and keyboard input stop them.
  await run('document.getElementById("tour-play").click()');
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'true');
  await until(`document.querySelector('[data-viewer]').dataset.waypoint===${JSON.stringify(selectedPoints[1].id)}`,'Playing walkthrough did not advance',6500);
  await cameraAt(selectedPoints[1]);
  await run('document.getElementById("tour-next").click()');await cameraAt(selectedPoints[2]);
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'false');
  await pause(5300);await cameraAt(selectedPoints[2]);
  await run('document.getElementById("tour-play").click()');
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'true');
  await run('document.getElementById("tour-play").click()');
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'false');
  await run('document.getElementById("tour-play").click();document.querySelector(".viewer-mount").focus({preventScroll:true})');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'false');
  // Reduced motion prevents automatic tour start and removes the viewpoint fade.
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate(`/studio.html?room=bedrooms&mode=walkthrough&design=${selected.id}&tour=1`);
  await ready('bedrooms','walkthrough',selected.id);await cameraAt(selectedPoints[0]);
  assert.equal(await run('document.getElementById("tour-play").getAttribute("aria-pressed")'),'false');
  assert.equal(await run('document.querySelectorAll("#tour-stops button")[1].click();document.querySelector(".viewer-mount").classList.contains("is-moving")'),false);
  await cameraAt(selectedPoints[1]);
  await call('Emulation.setEmulatedMedia',{features:[]});
  await run('document.querySelector("[data-view-mode=panorama]").click()');await ready('bedrooms','panorama',selected.id);
  const originalYaw = await run("Number(document.querySelector('[data-viewer]').dataset.lookYaw)");
  const detailIndex = selected.highlights.findIndex(point => Math.abs(((point.yaw-originalYaw)%360+540)%360-180)>20);
  assert(detailIndex>=0,'Guided details must look around the room');
  await run(`document.querySelectorAll('#tour-stops button')[${detailIndex}].click()`);
  await until(`Math.abs(((Number(document.querySelector('[data-viewer]').dataset.lookYaw)-${selected.highlights[detailIndex].yaw})%360+540)%360-180)<.1`,'Panorama highlight did not rotate the view');
  assert.deepEqual(await run("document.querySelector('[data-viewer]').dataset.cameraPosition.split(',').map(Number)"),[0,0,0],'A panorama highlight must rotate without claiming camera movement');
  for (const [width,height,dpr] of [[390,844,3],[768,1024,2],[1440,1000,2]]) {
    await viewport(width,height,dpr);await pause(180);
    const raster = await run(`(() => { const c=document.querySelector('.viewer-mount canvas'), box=c.getBoundingClientRect();return {width:c.width,height:c.height,cssWidth:box.width,cssHeight:box.height,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
    assert.equal(raster.overflow,false,`Design picker overflow at ${width}`);
    assert(raster.width >= raster.cssWidth * 1.9,`High-density view is undersampled at ${width}`);
    assert(raster.width * raster.height <= 8294400,'Panorama exceeded its rendering budget');
    await run('document.querySelector(".studio-main-view").scrollIntoView({behavior:"instant",block:"center"})');
    await screenshot(`studio-4k-${width}`);
  }
  await viewport(1440,1000);
  await navigate('/studio.html?room=bedrooms&design=unknown');await ready('bedrooms','panorama',bedrooms.designs[0].id);
  await navigate('/');await run('document.getElementById("virtual-studio").scrollIntoView({behavior:"instant"})');await pause(150);await screenshot('homepage-360-desktop');
  assert(await run('document.getElementById("virtual-studio").offsetTop<document.getElementById("ourdesign").offsetTop'),'360 section is buried below gallery');
  assert.equal(await run('document.querySelectorAll(".viewer-mount canvas").length'),0,'Homepage must not load WebGL before visitor starts view');
  await run('document.querySelector(".start-viewer").click()');await ready(featured.id,'panorama');assert(await run('document.activeElement.classList.contains("viewer-mount")'),'Starting the panorama should focus keyboard controls');
  await viewport(390,844);await run('document.getElementById("virtual-studio").scrollIntoView({behavior:"instant"})');await pause(100);await screenshot('homepage-360-mobile');
  // Missing selected model data must fail visibly, never silently show a generic category room.
  const missingModel = await call('Page.addScriptToEvaluateOnNewDocument',{source:`const fetchOriginal=window.fetch;window.fetch=async function(input,...args){const url=typeof input==='string'?input:input.url;if(String(url).includes('/js/studio-layouts.json'))return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});return fetchOriginal.call(this,input,...args);}`});
  await navigate(`/studio.html?room=${featured.id}&mode=walkthrough&design=${featured.designs[0].id}`);
  await until("document.querySelector('[data-viewer]').dataset.error==='true'",'Missing model did not report an error');
  assert.equal(await run("document.querySelector('[data-viewer]').dataset.ready"),'false');
  assert.equal(await run("document.querySelector('[data-viewer]').dataset.layoutId"),undefined);
  assert.equal(await run('document.querySelector(".start-viewer").hidden'),false);
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:missingModel.identifier});
  // A browser without WebGL keeps the preview and a usable, retryable explanation.
  const blocked = await call('Page.addScriptToEvaluateOnNewDocument',{source:`const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args)}`});
  await navigate('/studio.html');await pause(800);
  assert.match(await run('document.querySelector(".viewer-status").textContent'),/could not open/);
  assert.equal(await run('document.querySelector(".start-viewer").hidden'),false);
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log(`PASS: all ${totalDesigns} panoramas, matching 3D layouts and walkthroughs across ${rooms.length} categories; distinct model canvases; four camera stops and guided highlights per design; tour play/manual pause and reduced motion; point deep links; native 4K dimensions and retina buffers; one reused canvas; 320–1440px; lazy homepage; missing-model and WebGL fallbacks.`);
} finally {socket.close();}
