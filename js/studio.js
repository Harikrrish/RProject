let roomRecords, layoutRecords, modules;
const readCollection = async path => {const response=await fetch(path,{cache:'no-cache'});if(!response.ok)throw new Error('The design collection could not load.');return response.json();};
const getRooms = () => roomRecords ||= readCollection('/js/studio-rooms.json').catch(error=>{roomRecords=null;throw error;});
const getLayouts = () => layoutRecords ||= readCollection('/js/studio-layouts.json').catch(error=>{layoutRecords=null;throw error;});
const getModules = () => modules ||= Promise.all([import('./vendor/three.module.js'),import('./vendor/OrbitControls.js'),import('./room-layouts.js')]).catch(error=>{modules=null;throw error;});
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const validMode = mode => ['panorama','walkthrough','layout'].includes(mode)?mode:'panorama';

class RoomViewer {
  constructor(element) {
    this.element=element;this.mount=element.querySelector('.viewer-mount');this.start=element.querySelector('.start-viewer');this.status=element.querySelector('.viewer-status');this.tools=element.querySelector('.viewer-tools');
    this.request=0;this.longitude=180;this.latitude=0;this.points=new Map();this.mount.tabIndex=-1;
    this.start.addEventListener('click',async()=>{await this.load(element.dataset.room,element.dataset.mode,element.dataset.design);if(element.dataset.ready==='true')this.mount.focus({preventScroll:true});else this.start.focus({preventScroll:true});});
    element.querySelectorAll('[data-viewer-action]').forEach(button=>button.addEventListener('click',()=>this.action(button.dataset.viewerAction)));
    this.mount.addEventListener('keydown',event=>{const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out','0':'reset'}[event.key];if(action){event.preventDefault();this.action(action);}});
    this.pins=element.querySelector('.walkthrough-pins');
  }
  async prepare() {
    if(this.renderer)return;
    const [THREE,{OrbitControls},{makeRoomLayout}]=await getModules();if(this.renderer)return;
    Object.assign(this,{THREE,OrbitControls,makeRoomLayout});
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.mount.append(this.renderer.domElement);
    const canvas=this.renderer.domElement;
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.cancelMotion();this.onInteract?.();this.status.textContent='The room view paused. Reload this page to try again.';this.element.dataset.ready='false';});
    canvas.addEventListener('pointerdown',event=>{this.onInteract?.();this.cancelMotion();this.mount.focus({preventScroll:true});if(this.mode==='layout')return;canvas.setPointerCapture(event.pointerId);this.points.set(event.pointerId,{x:event.clientX,y:event.clientY});this.pinchDistance=null;});
    canvas.addEventListener('pointermove',event=>{
      if(this.mode==='layout'||!this.points.has(event.pointerId))return;
      const old=this.points.get(event.pointerId);this.points.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(this.points.size===2){const [a,b]=[...this.points.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinchDistance)this.zoom((this.pinchDistance-distance)*.15);this.pinchDistance=distance;}
      else {this.longitude+=(old.x-event.clientX)*.16;this.latitude=Math.max(-75,Math.min(75,this.latitude+(event.clientY-old.y)*.16));this.render();}
    });
    const release=event=>{this.points.delete(event.pointerId);this.pinchDistance=null;};for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
    canvas.addEventListener('wheel',event=>{if(this.mode!=='layout'&&document.activeElement===this.mount){event.preventDefault();this.onInteract?.();this.zoom(event.deltaY*.04);}},{passive:false});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.mount);this.resize();
  }
  cancelMotion() {cancelAnimationFrame(this.motion);clearTimeout(this.moveTimer);this.motion=null;this.mount.classList.remove('is-moving');}
  disposeScene() {
    this.cancelMotion();this.points.clear();this.controls?.dispose();this.controls=null;this.layout=null;this.pins?.replaceChildren();
    if(!this.scene)return;
    const materials=new Set(),textures=new Set(),geometries=new Set();
    this.scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of node.material?(Array.isArray(node.material)?node.material:[node.material]):[])materials.add(material);node.shadow?.dispose();});
    for(const geometry of geometries)geometry.dispose();for(const material of materials){if(material.map)textures.add(material.map);material.dispose();}for(const texture of textures)texture.dispose();this.scene=null;
  }
  async load(id,mode='panorama',designId,waypointId) {
    const request=++this.request;this.cancelMotion();this.onInteract?.();mode=validMode(mode);delete this.element.dataset.error;
    this.status.textContent=mode==='panorama'?'Opening your 4K panorama…':mode==='layout'?'Opening this design’s 3D layout…':'Opening this design’s walkthrough…';this.start.hidden=true;this.tools.hidden=true;this.element.dataset.ready='false';this.mount.tabIndex=-1;
    try {
      const rooms=await getRooms(),room=rooms.find(room=>room.id===id)||rooms[0],design=room.designs.find(design=>design.id===designId)||room.designs[0];
      let profile;
      if(mode!=='panorama'){profile=(await getLayouts()).find(profile=>profile.id===design.layoutId);if(!profile)throw new Error('This design model is unavailable.');}
      await this.prepare();if(request!==this.request)return;
      this.disposeScene();this.room=room;this.design=design;this.mode=mode;this.profile=profile;
      Object.assign(this.element.dataset,{room:room.id,mode,design:design.id});this.element.querySelector('.viewer-poster').src=design.preview;this.element.querySelector('.viewer-poster').alt=design.alt;
      for(const field of ['layoutId','waypoint','cameraPosition','sourceWidth','sourceHeight'])delete this.element.dataset[field];
      this.initialYaw=design.yaw??180;this.initialPitch=design.pitch??0;this.longitude=this.initialYaw;this.latitude=this.initialPitch;
      const THREE=this.THREE;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(mode==='layout'?42:78,1,.05,100);
      if(mode==='panorama') {
        this.renderer.toneMapping=THREE.NoToneMapping;
        const texture=await new THREE.TextureLoader().loadAsync(design.src);if(request!==this.request){texture.dispose();return;}
        texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy();texture.wrapS=THREE.RepeatWrapping;
        this.element.dataset.sourceWidth=String(texture.image.width);this.element.dataset.sourceHeight=String(texture.image.height);
        const geometry=new THREE.SphereGeometry(20,96,64);geometry.scale(-1,1,1);this.scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture})));
      } else {
        this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
        this.scene.background=new THREE.Color(mode==='layout'?'#ede9e0':'#cddbd4');
        this.layout=this.makeRoomLayout(profile);this.scene.add(this.layout.group,this.layout.lights);this.element.dataset.layoutId=this.layout.group.userData.designId;
        const extent=Math.max(profile.envelope.width,profile.envelope.depth);
        this.homePosition=profile.overview?new THREE.Vector3().fromArray(profile.overview.position):new THREE.Vector3(extent*1.12,extent*1.08,extent*1.25);
        if(mode==='layout') {
          this.camera.position.copy(this.homePosition);this.controls=new this.OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.65,0);this.controls.minDistance=extent*.9;this.controls.maxDistance=extent*3;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minPolarAngle=.14;this.controls.enablePan=false;this.controls.enableDamping=false;this.controls.update();this.controls.addEventListener('change',()=>this.render());this.controls.addEventListener('start',()=>this.onInteract?.());
        } else {this.makePins();this.goToViewpoint(waypointId||profile.viewpoints[0].id,false);}
      }
      if(request!==this.request)return;
      this.resize();this.status.textContent='';this.tools.hidden=false;this.element.dataset.ready='true';this.mount.tabIndex=0;
      Object.assign(this.element.dataset,{loadedRoom:room.id,loadedMode:mode,loadedDesign:design.id});
      this.mount.setAttribute('aria-label',`${design.title}: ${mode==='panorama'?'4K panoramic view':mode==='layout'?'3D layout of this design':'walkthrough of this design’s 3D model'}. Drag or use arrow keys to look around.`);
    }catch(error){if(request!==this.request)return;this.status.textContent='This view could not open. Try again, or explore the 4K room images.';this.start.hidden=false;this.start.querySelector('strong').textContent='Try the room view again';this.start.querySelector('small').textContent='Your selected design is saved';this.element.dataset.error='true';}
  }
  makePins() {
    if(!this.pins)return;
    this.profile.viewpoints.forEach((point,index)=>{const button=document.createElement('button');button.type='button';button.dataset.waypoint=point.id;button.setAttribute('aria-label',`Move to ${point.title}`);button.textContent=String(index+1);button.title=point.title;button.addEventListener('click',()=>{this.onInteract?.();this.goToViewpoint(point.id);});this.pins.append(button);});
  }
  goToViewpoint(id,animate=true) {
    if(this.mode!=='walkthrough'||!this.profile)return;
    const point=this.profile.viewpoints.find(point=>point.id===id)||this.profile.viewpoints[0];this.cancelMotion();
    const move=()=>{
      this.camera.position.fromArray(point.position);const target=new this.THREE.Vector3().fromArray(point.target),direction=target.sub(this.camera.position).normalize();
      this.longitude=this.THREE.MathUtils.radToDeg(Math.atan2(direction.z,direction.x));this.latitude=this.THREE.MathUtils.radToDeg(Math.asin(direction.y));this.element.dataset.waypoint=point.id;
      this.render();this.onViewpoint?.(point);this.mount.classList.remove('is-moving');
    };
    // A short fade changes camera station without travelling through furniture.
    if(animate&&!reducedMotion()){this.mount.classList.add('is-moving');this.moveTimer=setTimeout(move,150);}else move();
  }
  lookAtHighlight(highlight,animate=true) {
    if(this.mode!=='panorama'||!this.camera)return;this.cancelMotion();
    const fromYaw=this.longitude,fromPitch=this.latitude,delta=((highlight.yaw-fromYaw)%360+540)%360-180,started=performance.now(),duration=animate&&!reducedMotion()?750:0;
    const frame=now=>{const t=duration?Math.min(1,(now-started)/duration):1,ease=t*t*(3-2*t);this.longitude=fromYaw+delta*ease;this.latitude=fromPitch+(highlight.pitch-fromPitch)*ease;this.render();if(t<1)this.motion=requestAnimationFrame(frame);};this.motion=requestAnimationFrame(frame);
  }
  resize() {
    if(!this.renderer)return;const {width,height}=this.mount.getBoundingClientRect();if(!width||!height)return;
    const budget=this.mode==='panorama'?8294400:4194304,ratio=Math.min(devicePixelRatio||1,this.mode==='panorama'?3:2,Math.sqrt(budget/(width*height)),this.renderer.capabilities.maxTextureSize/Math.max(width,height));
    this.renderer.setPixelRatio(ratio);this.renderer.setSize(width,height,false);
    if(this.camera){this.camera.aspect=width/height;if(this.mode==='layout')this.camera.fov=this.camera.aspect<1?this.THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(this.THREE.MathUtils.degToRad(21))/this.camera.aspect)):42;this.camera.updateProjectionMatrix();this.render();}
  }
  render() {
    if(!this.scene||!this.camera)return;
    if(this.mode!=='layout'){const phi=this.THREE.MathUtils.degToRad(90-this.latitude),theta=this.THREE.MathUtils.degToRad(this.longitude),target=new this.THREE.Vector3(Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta));this.camera.lookAt(target.add(this.camera.position));}
    this.layout?.update(this.camera,this.mode);this.renderer.render(this.scene,this.camera);
    this.element.dataset.cameraPosition=this.camera.position.toArray().map(n=>n.toFixed(3)).join(',');this.element.dataset.lookYaw=String(this.longitude);
    if(this.mode==='walkthrough'&&this.pins){
      const {width,height}=this.mount.getBoundingClientRect(),direction=this.camera.getWorldDirection(new this.THREE.Vector3());
      this.pins.querySelectorAll('[data-waypoint]').forEach(button=>{const point=this.profile.viewpoints.find(point=>point.id===button.dataset.waypoint),position=new this.THREE.Vector3(point.position[0],.06,point.position[2]),facing=position.clone().sub(this.camera.position).dot(direction)>0;position.project(this.camera);button.hidden=!facing||Math.abs(position.x)>.92||Math.abs(position.y)>.86||position.z>1||button.dataset.waypoint===this.element.dataset.waypoint;button.style.left=`${(position.x+1)*width/2}px`;button.style.top=`${(1-position.y)*height/2}px`;});
    }
  }
  zoom(delta) {
    if(!this.camera)return;
    if(this.mode!=='layout'){this.camera.fov=Math.max(60,Math.min(95,this.camera.fov+delta));this.camera.updateProjectionMatrix();}
    else{const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()+delta*.12)));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();}this.render();
  }
  async action(action) {
    this.onInteract?.();this.cancelMotion();
    if(action==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else if(this.element.requestFullscreen)await this.element.requestFullscreen();else this.status.textContent='Turn your device sideways for a wider room view.';}catch{this.status.textContent='Fullscreen is unavailable here. Turn your device sideways for a wider view.';}return;}
    if(!this.camera)return;
    if(action==='reset') {
      if(this.mode==='walkthrough'){this.goToViewpoint(this.profile.viewpoints[0].id);return;}
      this.longitude=this.initialYaw;this.latitude=this.initialPitch;
      if(this.mode==='layout'){this.camera.position.copy(this.homePosition);this.controls.target.set(0,.65,0);this.controls.update();}else{this.camera.fov=78;this.camera.updateProjectionMatrix();}
    }else if(action==='in'||action==='out'){this.zoom(action==='in'?-7:7);return;}
    else if(this.mode!=='layout'){if(action==='left')this.longitude-=15;if(action==='right')this.longitude+=15;if(action==='up')this.latitude=Math.min(75,this.latitude+10);if(action==='down')this.latitude=Math.max(-75,this.latitude-10);}
    else{const offset=this.camera.position.clone().sub(this.controls.target),spherical=new this.THREE.Spherical().setFromVector3(offset);if(action==='left')spherical.theta-=.2;if(action==='right')spherical.theta+=.2;if(action==='up')spherical.phi=Math.max(.14,spherical.phi-.15);if(action==='down')spherical.phi=Math.min(Math.PI*.47,spherical.phi+.15);this.camera.position.copy(this.controls.target).add(new this.THREE.Vector3().setFromSpherical(spherical));this.controls.update();}this.render();
  }
}

for(const element of document.querySelectorAll('[data-viewer]')) {
  const viewer=new RoomViewer(element);if(!document.body.classList.contains('studio-page'))continue;
  const select=document.getElementById('studio-room'),buttons=[...document.querySelectorAll('[data-view-mode]')],picker=document.getElementById('studio-design-picker'),strip=document.getElementById('studio-design-strip');
  const tourPanel=document.getElementById('studio-tour-panel'),tourStops=document.getElementById('tour-stops'),play=document.getElementById('tour-play'),tourTitle=document.getElementById('tour-title'),tourDetail=document.getElementById('tour-detail'),plan=document.getElementById('tour-plan');
  const defaultRoom=element.dataset.room;let room=defaultRoom,mode='panorama',designId='',updateRequest=0,currentDesign,profile,stopIndex=-1,timer,playing=false,pendingPoint='';
  const stopPlaying=()=>{clearTimeout(timer);playing=false;play.textContent='Play tour';play.setAttribute('aria-pressed','false');};
  viewer.onInteract=stopPlaying;
  const saveLink=()=>{const query=new URLSearchParams({room,mode,design:designId});if(mode==='walkthrough'&&element.dataset.waypoint)query.set('point',element.dataset.waypoint);window.history.replaceState(null,'',`/studio.html?${query}`);};
  const stops=()=>mode==='walkthrough'?profile?.viewpoints||[]:currentDesign?.highlights||[];
  const markStop=index=>{stopIndex=index;tourStops.querySelectorAll('button').forEach((button,n)=>button.setAttribute('aria-pressed',String(n===index)));const stop=stops()[index];tourDetail.textContent=stop?`${index+1} of ${stops().length} · ${stop.title}${stop.description?' — '+stop.description:''}`:mode==='walkthrough'?'Choose a numbered viewpoint to move through this design.':'Choose a detail or play a guided look around this room.';plan.querySelectorAll('[data-plan-point]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.planPoint===stop?.id)));};
  viewer.onViewpoint=point=>{markStop(stops().findIndex(stop=>stop.id===point.id));saveLink();};
  const goStop=index=>{const points=stops();if(!points.length||element.dataset.ready!=='true')return;index=(index+points.length)%points.length;markStop(index);if(mode==='walkthrough')viewer.goToViewpoint(points[index].id);else viewer.lookAtHighlight(points[index]);};
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!playing)return;if(stopIndex>=stops().length-1){stopPlaying();return;}goStop(stopIndex+1);schedule();},5000);};
  play.addEventListener('click',()=>{if(playing){stopPlaying();viewer.cancelMotion();return;}if(element.dataset.ready!=='true')return;playing=true;play.textContent='Pause tour';play.setAttribute('aria-pressed','true');if(stopIndex<0||stopIndex>=stops().length-1)goStop(0);schedule();});
  for(const direction of ['previous','next'])document.getElementById(`tour-${direction}`).addEventListener('click',()=>{stopPlaying();goStop(stopIndex+(direction==='next'?1:-1));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPlaying();viewer.cancelMotion();}});
  const drawPlan=()=>{
    plan.replaceChildren();plan.hidden=mode!=='walkthrough';if(plan.hidden||!profile)return;
    const {width,depth}=profile.envelope,svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${depth}`);svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
    for(const object of profile.objects){if(['pendant','fan','artwork','mirror','tv','rug','lamp'].includes(object.type))continue;const rect=document.createElementNS(svgNS,'rect'),w=object.width||.6,d=object.depth||.5;rect.setAttribute('x',object.x+width/2-w/2);rect.setAttribute('y',object.z+depth/2-d/2);rect.setAttribute('width',w);rect.setAttribute('height',d);rect.setAttribute('rx','.04');rect.setAttribute('fill',object.color||'#b5a188');rect.setAttribute('transform',`rotate(${-(object.rotation||0)} ${object.x+width/2} ${object.z+depth/2})`);svg.append(rect);}
    plan.append(svg);profile.viewpoints.forEach((point,index)=>{const button=document.createElement('button');button.type='button';button.dataset.planPoint=point.id;button.textContent=String(index+1);button.setAttribute('aria-label',`Move to ${point.title}`);button.style.left=`${(point.position[0]/width+.5)*100}%`;button.style.top=`${(point.position[2]/depth+.5)*100}%`;button.addEventListener('click',()=>{stopPlaying();goStop(index);});plan.append(button);});
  };
  const update=async({scroll=false,history=true,autoplay=false}={})=>{
    const request=++updateRequest;stopPlaying();viewer.cancelMotion();element.dataset.ready='false';const rooms=await getRooms();if(request!==updateRequest)return;
    const current=rooms.find(entry=>entry.id===room)||rooms.find(entry=>entry.id===defaultRoom)||rooms[0];room=current.id;const designs=current.designs,currentSelected=designs.find(entry=>entry.id===designId)||designs[0];designId=currentSelected.id;currentDesign=currentSelected;
    if(mode!=='panorama'){profile=(await getLayouts()).find(item=>item.id===designId);if(request!==updateRequest)return;}else profile=null;
    select.value=room;buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.viewMode===mode)));document.querySelectorAll('[data-select-room]').forEach(card=>card.setAttribute('aria-current',String(card.dataset.selectRoom===room)));
    picker.hidden=designs.length<2;const signature=room+':'+designs.map(entry=>entry.id).join(',');
    if(strip.dataset.collection!==signature){strip.replaceChildren();strip.dataset.collection=signature;for(const option of designs){const button=document.createElement('button');button.type='button';button.dataset.selectDesign=option.id;const image=document.createElement('img');image.src=option.preview;image.alt='';image.width=160;image.height=80;image.loading='lazy';const text=document.createElement('span');text.textContent=option.title;const quality=document.createElement('small');quality.textContent='4K · Walkthrough · 3D';button.append(image,text,quality);button.addEventListener('click',()=>{designId=option.id;pendingPoint='';update().catch(showError);});strip.append(button);}}
    strip.querySelectorAll('[data-select-design]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.selectDesign===designId)));
    const selectedCard=strip.querySelector('[aria-pressed="true"]');if(selectedCard){const cardBox=selectedCard.getBoundingClientRect(),stripBox=strip.getBoundingClientRect();strip.scrollLeft+=cardBox.left-stripBox.left-(stripBox.width-cardBox.width)/2;}
    document.getElementById('studio-design-count').textContent=`${designs.length} designs to explore`;
    document.getElementById('studio-view-title').textContent=currentDesign.title;
    const provenance=currentDesign.kind==='existing-visualisation'?'From the Alankaar visualisation collection.':'AI-generated design concept.';
    document.getElementById('studio-view-description').textContent=mode==='panorama'?`${provenance} 4K source image. Drag to look around, or take the guided tour.`:mode==='walkthrough'?'Move between numbered viewpoints in a 3D interpretation of this selected design. Proportions are approximate.':'Furniture, finishes and arrangement modelled from this selected panorama. Proportions are approximate. Drag to orbit the room.';
    tourPanel.hidden=mode==='layout';tourTitle.textContent=mode==='walkthrough'?'Walk through this design':'Take a guided look';play.disabled=true;stopIndex=-1;tourStops.replaceChildren();
    stops().forEach((stop,index)=>{const button=document.createElement('button');button.type='button';button.textContent=`${index+1}. ${stop.title}`;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{stopPlaying();goStop(index);});tourStops.append(button);});drawPlan();markStop(-1);
    if(history)saveLink();if(scroll)document.querySelector('.studio-explorer').scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
    await viewer.load(room,mode,designId,pendingPoint);if(request!==updateRequest)return;pendingPoint='';play.disabled=element.dataset.ready!=='true';if(autoplay&&mode!=='layout'&&!reducedMotion())play.click();
  };
  const showError=()=>{viewer.status.textContent='The design could not load. Refresh to try again.';};
  select.addEventListener('change',()=>{room=select.value;designId='';pendingPoint='';update().catch(showError);});
  buttons.forEach(button=>button.addEventListener('click',()=>{if(mode===button.dataset.viewMode)return;mode=validMode(button.dataset.viewMode);pendingPoint='';update().catch(showError);}));
  document.querySelectorAll('[data-select-room]').forEach(card=>card.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();room=card.dataset.selectRoom;designId='';pendingPoint='';update({scroll:true}).catch(showError);}));
  document.querySelectorAll('[data-open-tour]').forEach(link=>link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();const query=new URL(link.href).searchParams;room=query.get('room');designId=query.get('design');mode=validMode(query.get('mode'));pendingPoint='';update({scroll:true,autoplay:true}).catch(showError);}));
  const query=new URLSearchParams(location.search);room=query.get('room')||room;mode=validMode(query.get('mode'));designId=query.get('design')||'';pendingPoint=query.get('point')||'';update({history:false,autoplay:query.get('tour')==='1'}).catch(showError);
}
