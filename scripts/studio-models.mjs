import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const furnitureTypes=new Set(['sofa','armchair','chair','bed','table','round-table','bench','cabinet','wardrobe','shelf','counter','island','desk','tv','artwork','mirror','rug','plant','pendant','lamp','tub','toilet','vanity','shower','altar','screen','railing','pergola','clothing-rack','display-case','sink','hob','fridge','pouf','fan']);
const nonBlocking=new Set(['artwork','mirror','tv','rug','pendant','fan','sink','hob','pergola']);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const color=value=>/^#[0-9a-f]{6}$/i.test(value);
const fail=(id,message)=>{throw new Error(`Design model ${id}: ${message}`);};
export function pointInsideFurniture(position,object,margin=.08) {
  if(nonBlocking.has(object.type)||(object.y!=null&&object.y-(object.height||.8)/2>1.85))return false;
  const angle=(object.rotation||0)*Math.PI/180,dx=position[0]-object.x,dz=position[2]-object.z;
  const x=dx*Math.cos(angle)-dz*Math.sin(angle),z=dx*Math.sin(angle)+dz*Math.cos(angle);
  return Math.abs(x)<(object.width||.6)/2+margin&&Math.abs(z)<(object.depth||.5)/2+margin;
}
export function validateProfile(profile) {
  const {id,envelope:env,objects,openings=[],highlights,viewpoints}=profile;
  if(!/^[a-z0-9-]+$/.test(id)||!env)fail(id,'missing identity or envelope');
  if(!['width','depth','height'].every(key=>finite(env[key])&&env[key]>1&&env[key]<20))fail(id,'invalid room dimensions');
  if(!color(env.wallColor)||!color(env.floorColor))fail(id,'invalid surface color');
  if(!['wood','stone','tile','terrazzo','carpet'].includes(env.floorStyle))fail(id,'invalid floor style');
  for(const value of Object.values(env.wallColors||{}))if(!color(value))fail(id,'invalid wall finish');
  if(!Array.isArray(objects)||objects.length<4)fail(id,'missing furnishings');
  for(const item of objects) {
    if(!furnitureTypes.has(item.type)||!finite(item.x)||!finite(item.z))fail(id,'unknown furnishing or position');
    for(const key of ['width','depth','height'])if(item[key]!=null&&(!finite(item[key])||item[key]<=0))fail(id,`invalid ${item.type} ${key}`);
    for(const key of ['color','accent','baseColor'])if(item[key]!=null&&!color(item[key]))fail(id,`invalid ${item.type} finish`);
    if(item.rotation!=null&&!finite(item.rotation))fail(id,'invalid furniture rotation');
    if(Math.abs(item.x)>env.width/2+.1||Math.abs(item.z)>env.depth/2+.1)fail(id,`furnishing outside room: ${item.type}`);
  }
  for(const opening of openings)if(!['front','back','left','right'].includes(opening.wall)||!['window','door','opening','glass'].includes(opening.type)||!['offset','width','height'].every(key=>finite(opening[key]))||opening.width<=0||opening.height<=0)fail(id,'invalid wall opening');
  if(!Array.isArray(highlights)||highlights.length!==4||new Set(highlights.map(p=>p.id)).size!==4)fail(id,'four distinct panorama highlights required');
  for(const point of highlights)if(!point.id||!point.title||!point.description||!finite(point.yaw)||point.yaw<0||point.yaw>=360||!finite(point.pitch)||Math.abs(point.pitch)>75)fail(id,'invalid panorama highlight');
  if(!Array.isArray(viewpoints)||viewpoints.length!==4||viewpoints[0].id!=='centre'||new Set(viewpoints.map(p=>p.id)).size!==4)fail(id,'four distinct walking viewpoints required');
  if(new Set(viewpoints.map(p=>JSON.stringify(p.position))).size!==4)fail(id,'walking viewpoints must move the camera');
  for(const point of viewpoints){
    if(!point.title||![point.position,point.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(finite)))fail(id,'invalid walking viewpoint');
    if(Math.abs(point.position[0])>env.width/2-.3||Math.abs(point.position[2])>env.depth/2-.3||point.position[1]<1||point.position[1]>1.8)fail(id,`viewpoint outside room: ${point.id}`);
    const collision=objects.find(object=>pointInsideFurniture(point.position,object));if(collision)fail(id,`viewpoint ${point.id} overlaps ${collision.type} at ${collision.x},${collision.z}`);
  }
  if(profile.overview&&!(Array.isArray(profile.overview.position)&&profile.overview.position.length===3&&profile.overview.position.every(finite)))fail(id,'invalid overview camera');
  // Private notes and source inspection commentary never enter the public payload.
  return {id,envelope:env,objects,openings,highlights,viewpoints,...(profile.overview?{overview:profile.overview}:{})};
}
export async function loadStudioModels(root,designs) {
  const folder=join(root,'content/layouts');const files=(await readdir(folder)).filter(file=>file.endsWith('.json')).sort();
  const profiles=(await Promise.all(files.map(async file=>JSON.parse(await readFile(join(folder,file),'utf8'))))).flat();
  if(new Set(profiles.map(p=>p.id)).size!==profiles.length)throw new Error('Duplicate design model IDs.');
  const ids=new Set(designs.map(d=>d.id));if(profiles.length!==ids.size||profiles.some(p=>!ids.has(p.id)))throw new Error('Every panoramic design needs its own matching 3D model and tour.');
  return profiles.map(validateProfile);
}
