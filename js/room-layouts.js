import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// Each profile is traced from one selected panorama. Dimensions are estimates,
// while furniture identities, arrangement and finishes belong to that design.
export function makeRoomLayout(profile) {
  if (!profile?.id || !profile.envelope || !Array.isArray(profile.objects)) throw new Error('Missing design model.');
  const group = new THREE.Group(), shell = new THREE.Group(), roof = new THREE.Group();
  group.name = profile.id; group.userData.designId = profile.id; group.add(shell, roof);
  const env = profile.envelope, W = env.width, D = env.depth, H = env.height;
  const materials = new Map(), walls = [], objects = [], wallDecor = [];
  const material = (color = '#ddd3c2', glass = false) => {
    const key = `${color}:${glass}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness:glass?.18:.78, metalness:glass?.12:.02, transparent:glass, opacity:glass?.22:1, depthWrite:!glass, side:THREE.DoubleSide}));
    return materials.get(key);
  };
  const mesh = (geometry, color, parent = group, glass = false) => {
    const object = new THREE.Mesh(geometry, material(color, glass)); object.castShadow = !glass; object.receiveShadow = !glass; parent.add(object); return object;
  };
  function box(w,h,d,x,y,z,color,parent=group,radius=.018,glass=false) {
    const object = mesh(radius ? new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/4,h/4,d/4)) : new THREE.BoxGeometry(w,h,d),color,parent,glass);
    object.position.set(x,y,z); return object;
  }
  function cylinder(r,h,x,y,z,color,parent=group,top=r) {
    const object=mesh(new THREE.CylinderGeometry(top,r,h,24),color,parent);object.position.set(x,y,z);return object;
  }
  function ball(x,y,z,sx,sy,sz,color,parent=group) {
    const object=mesh(new THREE.SphereGeometry(1,16,12),color,parent);object.position.set(x,y,z);object.scale.set(sx,sy,sz);return object;
  }
  const brass='#a88548', ivory='#f4eee3', timber='#8b6647', dark='#333833';
  box(W+.16,.14,D+.16,0,-.07,0,env.floorColor,shell,.025);
  // Code-native surface divisions give the small models readable material scale.
  if(env.floorStyle==='wood') {
    const n=Math.ceil(W/.24);
    for(let i=0;i<n;i++)box(.009,.004,D,-W/2+i*W/n,.003,0,'#9f8b72',shell,0);
    for(let i=0;i<n;i++)for(let j=0;j<Math.ceil(D/1.3);j++)box(W/n-.006,.004,.008,-W/2+(i+.5)*W/n,.004,-D/2+((j+(i%3)/3)*1.3)%D,'#a08c73',shell,0);
  } else if(env.floorStyle!=='carpet') {
    for(let x=-W/2+.8;x<W/2;x+=.8)box(.008,.004,D,x,.004,0,'#d8d0c3',shell,0);
    for(let z=-D/2+.8;z<D/2;z+=.8)box(W,.004,.008,0,.004,z,'#d8d0c3',shell,0);
  }
  const specs={front:{length:W,x:0,z:-D/2,rotation:0,normal:[0,0,-1]},back:{length:W,x:0,z:D/2,rotation:180,normal:[0,0,1]},left:{length:D,x:-W/2,z:0,rotation:90,normal:[-1,0,0]},right:{length:D,x:W/2,z:0,rotation:-90,normal:[1,0,0]}};
  for(const [side,spec] of Object.entries(specs)) {
    if(env.openSides?.includes(side))continue;
    const wall=new THREE.Group();wall.position.set(spec.x,0,spec.z);wall.rotation.y=THREE.MathUtils.degToRad(spec.rotation);shell.add(wall);
    const color=env.wallColors?.[side]||env.wallColor||'#e5ddcf';
    const openings=(profile.openings||[]).filter(o=>o.wall===side).map(o=>({...o,offset:o.offset*(side==='back'||side==='left'?-1:1)})).sort((a,b)=>a.offset-b.offset);
    let cursor=-spec.length/2;
    for(const o of openings) {
      const left=Math.max(-spec.length/2,o.offset-o.width/2),right=Math.min(spec.length/2,o.offset+o.width/2),bottom=o.bottom||0,top=Math.min(H,bottom+o.height);
      if(left>cursor)box(left-cursor,H,.12,(left+cursor)/2,H/2,0,color,wall,.004);
      if(bottom>0)box(right-left,bottom,.12,(left+right)/2,bottom/2,0,color,wall,.004);
      if(top<H)box(right-left,H-top,.12,(left+right)/2,(H+top)/2,0,color,wall,.004);
      const frame=o.color|| (o.type==='door'?timber:'#686a61');
      if(o.type==='door'&&o.variant!=='glass') {
        box(right-left-.04,top-bottom-.025,.048,(left+right)/2,(bottom+top)/2,-.025,frame,wall,.008);
        box(.028,.19,.035,right-.14,1,.038,brass,wall,.005);
      } else if(o.type!=='opening') {
        box(right-left-.03,top-bottom-.03,.015,(left+right)/2,(bottom+top)/2,-.012,'#b9d0c7',wall,0);
        for(const x of [left,(left+right)/2,right])box(.032,top-bottom+.04,.06,x,(bottom+top)/2,.025,frame,wall,.002);
        for(const y of [bottom,top])box(right-left+.04,.035,.07,(left+right)/2,y,.028,frame,wall,.002);
        if(bottom>.2)box(right-left+.1,.045,.18,(left+right)/2,bottom-.025,.065,ivory,wall,.006);
      }
      cursor=Math.max(cursor,right);
    }
    if(cursor<spec.length/2)box(spec.length/2-cursor,H,.12,(cursor+spec.length/2)/2,H/2,0,color,wall,.004);
    box(spec.length,.065,.04,0,.038,.072,ivory,wall,.003);
    walls.push({group:wall,normal:new THREE.Vector3(...spec.normal)});
  }
  box(W,.08,D,0,H+.04,0,env.ceilingColor||ivory,roof,.004);
  for(const object of profile.objects) {
    const part=new THREE.Group(), w=object.width||.6,d=object.depth||.5,h=object.height||.8;
    const c=object.color||'#d7c9b5',a=object.accent||ivory,frame=object.baseColor||timber;
    part.position.set(object.x,0,object.z);part.rotation.y=THREE.MathUtils.degToRad(object.rotation||0);
    part.name=object.id||object.type;part.userData.type=object.type;group.add(part);objects.push(part);
    const b=(bw,bh,bd,x,y,z,color=c,r=.02,g=false)=>box(bw,bh,bd,x,y,z,color,part,r,g);
    const cy=(r,ch,x,y,z,color=c,top=r)=>cylinder(r,ch,x,y,z,color,part,top);
    const sph=(x,y,z,sx,sy,sz,color=c)=>ball(x,y,z,sx,sy,sz,color,part);
    const legs=(height,width=w,depth=d)=>{for(const x of [-width/2+.08,width/2-.08])for(const z of [-depth/2+.08,depth/2-.08])b(.04,height,.04,x,height/2,z,frame,.007);};
    const doors=(width,height,depth,count=Math.max(2,Math.round(width/.55)))=>{
      for(let i=0;i<count;i++) {const x=-width/2+(i+.5)*width/count;b(width/count-.02,height-.055,.022,x,height/2+.035,depth/2+.013,c,.006);b(.012,.16,.025,x+width/count*.3,height*.58,depth/2+.035,brass,.003);}
    };
    const seat=(width=w,depth=d,height=h)=>{
      legs(height*.48,width,depth);b(width,height*.16,depth,0,height*.5,0,c,.06);b(width,height*.49,.105,0,height*.77,-depth/2+.06,c,.045);
    };
    switch(object.type) {
      case 'sofa': {
        legs(.17);b(w,h*.26,d,0,h*.27,0,c,.08);b(w,h*.55,d*.2,0,h*.69,-d*.4,c,.06);
        const count=Math.max(2,Math.round(w/.8));
        for(let n=0;n<count;n++){const x=-w/2+(n+.5)*w/count;b(w/count-.03,.13,d*.71,x,h*.48,d*.07,c,.055);const pillow=b(Math.min(.42,w/count*.7),.35,.16,x,h*.75,-d*.17,n===0?a:c,.045);pillow.rotation.z=(n%2?.1:-.1);}
        for(const x of [-w/2+.065,w/2-.065])b(.14,h*.45,d*.95,x,h*.46,0,c,.055);
        if(object.variant==='curved') {for(const x of [-w*.32,w*.32]){const end=b(w*.32,h*.27,d*.6,x,h*.38,d*.27,c,.09);end.rotation.y=x<0?-.22:.22;}}
        break;
      }
      case 'chair':case 'armchair':seat();if(object.type==='armchair')for(const x of [-w/2+.035,w/2-.035])b(.055,.07,d*.8,x,h*.64,0,frame,.012);break;
      case 'bed': {
        b(w,.24,d,0,.18,0,frame,.035);b(w-.02,.22,d-.035,0,.4,0,ivory,.07);b(w-.04,.075,d*.76,0,.55,d*.105,c,.05);b(w+.05,Math.max(.72,h),.1,0,Math.max(.72,h)/2,-d/2,a,.035);
        const pillows=w>1.4?2:1;for(let i=0;i<pillows;i++)b((w-.2)/pillows-.06,.15,.42,(i-(pillows-1)/2)*(w-.2)/pillows,.6,-d*.32,ivory,.055);
        b(w-.02,.025,.36,0,.606,d*.28,a,.02);break;
      }
      case 'table':case 'desk':case 'round-table': {
        if(object.type==='round-table'||object.shape==='round'||object.shape==='oval'){const top=cy(.5,.065,0,h-.032,0,c);top.scale.set(w,1,d);const base=cy(Math.min(w,d)*.2,h-.07,0,(h-.07)/2,0,frame);if(object.shape==='oval')base.scale.x=1.5;}
        else{b(w,.055,d,0,h-.027,0,c,.022);legs(h-.06);}
        break;
      }
      case 'bench':
        if(object.variant==='banquette'){legs(.36);b(w,.12,d,0,.42,0,c,.035);b(w,h-.36,.12,0,(h+.36)/2,-d/2+.06,c,.045);}
        else{legs(h*.7);b(w,h*.3,d,0,h*.85,0,c,.055);}break;
      case 'pouf':{const top=cy(.5,h,0,h/2,0,c);top.scale.set(w,1,d);break;}
      case 'cabinet':case 'counter':case 'island':case 'fridge': {
        if(object.variant==='plain'||object.variant==='planter') {
          b(w,h,d,0,h/2,0,c,.012);
          if(object.variant==='planter')b(w-.065,.012,Math.max(.08,d-.065),0,h+.002,0,'#544737',.007);
          break;
        }
        b(w,h-.05,d,0,h/2,0,c,.018);doors(w,h-.04,d);b(w+.025,.035,d+.025,0,h+.006,0,a,.009);
        if(object.type==='fridge')b(w-.02,.015,.035,0,h*.58,d/2+.022,'#797d77',0);break;
      }
      case 'wardrobe':case 'shelf':case 'display-case': {
        b(w,h,.045,0,h/2,-d/2,c,.01);for(const x of [-w/2,w/2])b(.04,h,d,x,h/2,0,c,.007);
        const levels=object.count|| (object.type==='shelf'?4:3),open=object.type==='shelf'||object.variant==='open'||object.variant==='glass'||object.type==='display-case';
        for(let i=0;i<=levels;i++)b(w,.035,d,0,.035+i*(h-.07)/levels,0,c,.008);
        if(open){
          const n=Math.max(2,Math.floor(w/.38));
          for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n;if(object.type==='wardrobe'){b(.2,h*.43,.28,x,h*.65,0,i%2?a:'#9d9b87',.025);b(.27,.025,.025,x,h*.89,0,frame,.007);}else for(let level=0;level<Math.min(levels,3);level++)b(.09+(i%3)*.025,.18+(i%2)*.06,d*.5,x,.15+level*(h-.07)/levels,0,i%2?a:'#89907a',.009);}
          if(object.variant==='glass'||object.type==='display-case')b(w-.035,h-.04,.012,0,h/2,d/2+.01,'#b3c0bb',.001,true);
        }else doors(w,h,d,Math.max(2,Math.round(w/.6)));
        break;
      }
      case 'clothing-rack': {
        for(const x of [-w/2,w/2])b(.035,h,.035,x,h/2,0,frame,.006);b(w,.035,.035,0,h,0,frame,.006);
        for(let i=0;i<(object.count||6);i++){const x=-w/2+.13+i*(w-.26)/((object.count||6)-1);b(.2,h*.55,.07,x,h*.64,0,i%2?c:a,.025);}break;
      }
      case 'tv':case 'artwork':case 'mirror': {
        const center=object.y??1.6;b(w+.035,h+.035,.045,0,center,0,frame,.007);
        b(w,h,.015,0,center,.032,object.type==='tv'?'#202724':object.type==='mirror'?'#b9c4bf':c,.004);
        if(object.type==='tv'&&object.variant==='monitor') {
          const desk=profile.objects.filter(item=>item.type==='desk').sort((a,b)=>Math.hypot(a.x-object.x,a.z-object.z)-Math.hypot(b.x-object.x,b.z-object.z))[0];
          const top=desk?.height||.76,stand=Math.max(.07,center-h/2-top);
          b(.035,stand,.035,0,top+stand/2,0,dark,.006);b(.2,.02,.16,0,top+.01,.015,dark,.008);
        }
        if(object.type==='artwork'&&object.variant!=='panel'){const art=cy(Math.min(w,h)*.23,.012,-w*.17,center+h*.07,.049,a);art.rotation.x=Math.PI/2;b(w*.3,h*.6,.016,w*.18,center-h*.03,.05,'#a29378',.05);}
        break;
      }
      case 'rug':b(w,.018,d,0,.023,0,c,.009);for(let i=0;i<4;i++)b(w-.08,.003,.008,0,.034,-d/2+.05+i*.027,a,0);break;
      case 'plant': {
        cy(w*.27,h*.24,0,h*.12,0,a,w*.35);cy(.016,h*.62,0,h*.51,0,frame);
        for(let i=0;i<8;i++){const angle=i*2.4;const leaf=sph(Math.cos(angle)*w*.24,h*(.39+i*.065),Math.sin(angle)*d*.24,w*.18,h*.2,d*.12,i%2?c:'#748064');leaf.rotation.z=Math.cos(angle)*.65;}break;
      }
      case 'pendant': {
        const y=object.y??H-.5;cy(.012,Math.max(.06,H-y-.1),0,(H+y+.1)/2,0,dark);cy(w/2,h,0,y,0,c,w*.3);cy(w*.43,.012,0,y-h/2-.008,0,ivory);break;
      }
      case 'fan': {
        const y=object.y??H-.25;cy(.025,H-y,0,(H+y)/2,0,dark);cy(.09,.1,0,y,0,c);
        for(let i=0;i<3;i++){const blade=new THREE.Group();part.add(blade);blade.rotation.y=i*Math.PI*2/3;box(w*.45,.026,.12,w*.23,y,0,c,blade,.035);}break;
      }
      case 'lamp':cy(.095,.025,0,.014,0,frame);cy(.015,h*.7,0,h*.35,0,frame);cy(w*.5,h*.32,0,h*.82,0,c,w*.3);break;
      case 'vanity': {
        b(w,h*.75,d,0,h*.48,0,c,.014);doors(w,h*.74,d);b(w+.025,.055,d+.03,0,h*.9,0,a,.01);
        const count=object.count||1;for(let i=0;i<count;i++){const x=-w/2+(i+.5)*w/count;b(w/count*.7,.095,d*.7,x,h*.98,.025,ivory,.035);b(w/count*.49,.014,d*.44,x,h*1.035,.05,'#c3c9c0',.028);cy(.017,.23,x,h*1.07,-d*.29,brass);b(.11,.022,.02,x+.035,h*1.18,-d*.29,brass,.005);}break;
      }
      case 'sink': b(w,h,d,0,h/2,0,a,.03);b(w*.76,.014,d*.67,0,h+.006,0,'#9ca8a1',.027);cy(.017,.25,0,h+.125,-d*.4,brass);b(.14,.018,.02,.05,h+.25,-d*.4,brass,.004);break;
      case 'hob':b(w,.018,d,0,.015,0,c,.012);for(const x of [-w*.25,w*.25])for(const z of [-d*.24,d*.24])cy(Math.min(w,d)*.13,.007,x,.029,z,'#85877c');break;
      case 'tub':b(w,h,d,0,h/2,0,c,.13);b(w*.78,.025,d*.81,0,h+.01,0,'#c4d2cb',.12);cy(.025,h+.1,w*.43,(h+.1)/2,-d*.35,brass);b(.18,.025,.02,w*.35,h+.1,-d*.35,brass);break;
      case 'toilet':cy(w*.31,h*.58,0,h*.29,.05,c,w*.43);b(w,h*.19,d*.67,0,h*.61,d*.12,c,.095);b(w*.84,h*.71,d*.25,0,h*.65,-d*.34,c,.03);{const seat=cy(.5,.015,0,h*.71,d*.12,'#c0c9c0');seat.scale.set(w*.68,1,d*.45);}break;
      case 'shower': {
        const fittings=object.accent||brass;
        b(w,h,.016,0,h/2,-d/2,c,.001);
        for(let y=.32;y<h;y+=.32)b(w,.008,.005,0,y,-d/2+.011,'#d5d3c5',0);
        for(let x=-w/2+.24;x<w/2;x+=.24)b(.008,h,.005,x,h/2,-d/2+.011,'#d5d3c5',0);
        b(w,.025,d,0,.022,0,'#b6b4a7',.004);b(.012,h,d,-w/2,h/2,0,'#b7ccc3',.001,true);b(w,h,.012,0,h/2,d/2,'#b7ccc3',.001,true);
        cy(.018,h*.86,w*.25,h*.49,-d*.4,fittings);b(.23,.024,.02,w*.18,h*.91,-d*.4,fittings);cy(.13,.016,w*.07,h*.9,-d*.4,fittings);break;
      }
      case 'altar': {
        b(w,.15,d,0,.075,0,a,.012);b(w*.9,h*.28,d*.84,0,h*.2,-d*.03,c,.018);b(w*.96,.04,d*.9,0,h*.35,-d*.025,a,.01);
        b(w*.85,h*.68,.055,0,h*.66,-d*.42,c,.022);b(w*.48,h*.4,.027,0,h*.68,-d*.38,a,.055);
        cy(.065,h*.13,0,h*.44,0,brass,.035);for(const x of [-w*.3,w*.3]){cy(.04,.025,x,h*.37,.07,brass);cy(.012,h*.22,x,h*.47,.07,brass);cy(.065,.022,x,h*.58,.07,brass);}break;
      }
      case 'screen':for(let i=0;i<(object.count||12);i++)b(w/(object.count||12)*.36,h,d,-w/2+(i+.5)*w/(object.count||12),h/2,0,c,.005);break;
      case 'railing': {
        const spacing=object.variant==='glass'?1.15:.2,posts=Math.ceil(w/spacing);
        for(let i=0;i<=posts;i++)b(.025,h,.025,-w/2+i*w/posts,h/2,0,c,.003);
        if(object.variant==='glass')b(w-.04,h-.08,.012,0,h/2,0,'#b8cbc5',.001,true);
        b(w,.045,.055,0,h,0,c,.005);break;
      }
      case 'pergola': {
        for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])b(.075,h,.075,x,h/2,z,c,.009);
        for(let i=0;i<Math.ceil(d/.27);i++)b(w,.09,.06,0,h,-d/2+i*d/Math.ceil(d/.27),c,.008);break;
      }
      default:throw new Error(`Unsupported furnishing ${object.type}: ${profile.id}`);
    }
    if(object.y!=null&&!['tv','artwork','mirror','pendant','fan'].includes(object.type))part.position.y=object.y-h/2;
    if(object.wallMounted||['tv','artwork','mirror'].includes(object.type)||(object.type==='lamp'&&object.y>1.2)) {
      const nearest=Object.entries(specs).map(([side,spec])=>({side,normal:new THREE.Vector3(...spec.normal),distance:side==='front'?Math.abs(object.z+D/2):side==='back'?Math.abs(object.z-D/2):side==='left'?Math.abs(object.x+W/2):Math.abs(object.x-W/2)})).sort((a,b)=>a.distance-b.distance)[0];
      if(nearest.distance<.35)wallDecor.push({group:part,normal:nearest.normal});
    }
  }
  const lights=new THREE.Group();lights.add(new THREE.HemisphereLight(0xfff7e8,0xb8b8ac,2.8));
  const sun=new THREE.DirectionalLight(0xfff2db,3.2);sun.position.set(-W,9,D);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-W,right:W,top:D,bottom:-D});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;lights.add(sun);
  const fill=new THREE.DirectionalLight(0xffffff,1.6);fill.position.set(W,5,-D);lights.add(fill);
  const interior=new THREE.PointLight(0xfff6e6,22,Math.max(W,D)*2,2);interior.position.set(0,H-.3,0);lights.add(interior);
  return {group,lights,profile,objects,width:W,depth:D,height:H,update(camera,mode='layout') {
    roof.visible=mode==='walkthrough'&&env.ceiling!==false;for(const wall of [...walls,...wallDecor])wall.group.visible=mode==='walkthrough'||camera.position.dot(wall.normal)<=0;
  }};
}
