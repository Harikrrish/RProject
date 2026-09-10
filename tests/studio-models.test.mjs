import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { loadStudioModels, validateProfile, pointInsideFurniture } from '../scripts/studio-models.mjs';
import { makeRoomLayout } from '../js/room-layouts.js';

const root = resolve(import.meta.dirname, '..');
const readJSON = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const rooms = await readJSON('content/panoramas.json');
const designs = rooms.flatMap(room => room.designs);
let models;
const getModels = () => models ||= loadStudioModels(root, designs);
const rounded = number => Math.round(number * 1e6) / 1e6;

test('Every panorama publishes its own model, four highlights and four safe walking viewpoints', async () => {
  const profiles = await getModels();
  const published = await readJSON('js/studio-layouts.json');
  const publicRooms = await readJSON('js/studio-rooms.json');
  assert.equal(profiles.length, 40);
  assert.deepEqual(profiles.map(p => p.id).sort(), designs.map(d => d.id).sort());
  assert.deepEqual(published, profiles, 'Published models must match validated source profiles');
  for (const design of publicRooms.flatMap(room => room.designs)) {
    const profile = profiles.find(profile => profile.id === design.id);
    assert.equal(design.layoutId, design.id, `Generic category model assigned to ${design.id}`);
    assert.deepEqual(design.highlights, profile.highlights, `Wrong guided details: ${design.id}`);
    assert(!Object.hasOwn(profile, 'notes'), 'Private inspection notes leaked into public models');
    assert.equal(profile.highlights.length, 4);
    assert.equal(profile.viewpoints.length, 4);
    assert.deepEqual(profile.viewpoints[0].position, [0, 1.5, 0], `Camera anchor changed: ${design.id}`);
    assert.equal(new Set(profile.viewpoints.map(point => JSON.stringify(point.position))).size, 4);
    for (const point of profile.viewpoints) {
      assert(Math.abs(point.position[0]) <= profile.envelope.width / 2 - .4 + 1e-6, `${design.id}/${point.id} is too close to a side wall`);
      assert(Math.abs(point.position[2]) <= profile.envelope.depth / 2 - .4 + 1e-6, `${design.id}/${point.id} is too close to an end wall`);
      assert.equal(point.position[1], 1.5);
      assert(point.position.some((value, index) => Math.abs(value - point.target[index]) > .05), `Empty look direction: ${design.id}/${point.id}`);
      for (const object of profile.objects) assert(!pointInsideFurniture(point.position, object), `${design.id}/${point.id} collides with ${object.type}`);
    }
    for (const highlight of profile.highlights) {
      assert(highlight.title.trim() && highlight.description.trim());
      assert(highlight.yaw >= 0 && highlight.yaw < 360 && Math.abs(highlight.pitch) <= 25, `Invalid tour direction: ${design.id}/${highlight.id}`);
    }
  }
});

test('Every selected design creates distinct geometry and finishes with its actual object placements', async () => {
  const fingerprints = new Set();
  for (const profile of await getModels()) {
    const layout = makeRoomLayout(profile);
    const hash = createHash('sha256');
    try {
      assert.equal(layout.group.userData.designId, profile.id);
      assert.equal(layout.objects.length, profile.objects.length);
      for (const [index, object] of layout.objects.entries()) {
        const source = profile.objects[index];
        assert.equal(object.userData.type, source.type, `Wrong object type: ${profile.id}/${index}`);
        assert.equal(object.position.x, source.x);
        assert.equal(object.position.z, source.z);
        assert.equal(rounded(object.rotation.y), rounded((source.rotation || 0) * Math.PI / 180));
        hash.update(JSON.stringify({ type:object.userData.type, position:object.position.toArray(), rotation:object.rotation.toArray() }));
        object.traverse(mesh => {
          if (!mesh.isMesh) return;
          const positions = mesh.geometry.getAttribute('position');
          assert(positions?.count > 0, `Empty geometry: ${profile.id}/${source.type}`);
          assert([...positions.array].every(Number.isFinite), `Invalid vertices: ${profile.id}/${source.type}`);
          hash.update(Buffer.from(positions.array.buffer, positions.array.byteOffset, positions.array.byteLength));
          hash.update(JSON.stringify({ position:mesh.position.toArray(), rotation:mesh.rotation.toArray(), scale:mesh.scale.toArray(), color:mesh.material.color.getHexString(), opacity:mesh.material.opacity }));
        });
      }
      const fingerprint = hash.digest('hex');
      assert(!fingerprints.has(fingerprint), `Repeated rendered furniture geometry and colors: ${profile.id}`);
      fingerprints.add(fingerprint);
    } finally {
      const materials = new Set();
      layout.group.traverse(object => { object.geometry?.dispose(); if (object.material) materials.add(object.material); });
      for (const material of materials) material.dispose();
      layout.lights.traverse(light => light.shadow?.dispose());
    }
  }
  assert.equal(fingerprints.size, designs.length);
  assert.throws(() => makeRoomLayout('living-rooms'), /Missing design model/);
  assert.throws(() => makeRoomLayout({ id:'shops' }), /Missing design model/);
});

test('Retail, bathroom, kitchen and renovation models retain the selected room identity', async () => {
  const profiles = new Map((await getModels()).map(profile => [profile.id, profile]));
  const count = (id, type) => profiles.get(id).objects.filter(object => object.type === type).length;
  assert.equal(count('shops-4k-01', 'clothing-rack'), 3);
  assert.equal(count('shops-4k-01', 'display-case'), 0);
  assert(count('shops-4k-02', 'display-case') >= 5);
  assert.equal(count('shops-4k-02', 'clothing-rack'), 0);
  assert.equal(count('shops-4k-03', 'table'), 4);
  assert.equal(count('shops-4k-03', 'chair'), 4);
  assert.equal(count('shops-4k-03', 'bench'), 1);
  assert.equal(count('shops-4k-03', 'clothing-rack'), 0);
  for (const number of ['01', '02', '03']) {
    const bathroom = `bathrooms-4k-${number}`, kitchen = `kitchens-4k-${number}`;
    assert.equal(count(bathroom, 'tub'), number === '01' ? 1 : 0);
    for (const type of ['vanity', 'shower', 'toilet']) assert.equal(count(bathroom, type), 1);
    for (const type of ['sink', 'hob', 'fridge']) assert.equal(count(kitchen, type), 1);
    for (const type of ['bed', 'sofa', 'island']) assert.equal(count(kitchen, type), 0);
  }
  assert.equal(profiles.get('bathrooms-4k-01').objects.find(object => object.type === 'vanity').count, 2);
  assert(count('kitchens-4k-01', 'counter') >= 4, 'The white kitchen needs its peninsula');
  assert.equal(count('kitchens-4k-02', 'chair'), 2, 'Breakfast seating was lost');
  assert.equal(count('kitchens-4k-03', 'counter'), 2, 'The walnut kitchen has two opposing runs');
  assert.equal(count('living-rooms-4k-01', 'tv'), 1);
  assert.equal(count('living-rooms-4k-02', 'tv'), 0);
  assert.equal(count('living-rooms-4k-03', 'tv'), 0);
  assert(count('renovation-4k-01', 'sofa') > 0);
  assert.equal(count('renovation-4k-01', 'bed'), 0);
  for (const type of ['sink', 'hob', 'fridge']) assert.equal(count('renovation-4k-02', type), 1);
  assert.equal(count('renovation-4k-02', 'bed'), 0);
  assert.equal(count('renovation-4k-03', 'bed'), 1);
  assert(count('renovation-4k-03', 'wardrobe') > 0);
  assert.equal(count('renovation-4k-03', 'hob'), 0);
  for (const id of ['bedroom-suite-01','bedroom-suite-03','renovation-4k-03']) {
    assert.equal(count(id,'vanity'),0,'A bedroom dressing desk must not become a bathroom basin');
    assert(count(id,'desk')>0,'The dry dressing furniture must remain');
  }
  assert.equal(profiles.get('shops-4k-03').objects.find(item=>item.type==='bench').variant,'banquette');
  assert.equal(profiles.get('balconies-4k-02').objects.find(item=>item.type==='counter').variant,'planter');
  assert(profiles.get('balconies-4k-03').objects.filter(item=>item.type==='counter').every(item=>item.variant==='plain'));
  assert.equal(profiles.get('balconies-4k-01').objects.find(item=>item.type==='railing').variant,'glass');
  assert.equal(profiles.get('balconies-4k-03').openings.find(item=>item.type==='door').variant,'glass');

});

test('Profile validation rejects unusable stops and furniture collision accounts for rotation', async () => {
  const seed = (await readJSON('content/layouts/living-retail.json'))[0];
  assert.doesNotThrow(() => validateProfile(seed));
  for (const change of [
    profile => { profile.objects[0].type = 'unknown-furniture'; },
    profile => { profile.objects[0].x = 100; },
    profile => { profile.viewpoints[1].position = [...profile.viewpoints[0].position]; },
    profile => { profile.viewpoints[1].position = [100, 1.5, 0]; },
    profile => { profile.objects[0].x = 0; profile.objects[0].z = 0; },
    profile => { profile.highlights[1].id = profile.highlights[0].id; },
    profile => { profile.highlights[0].yaw = 360; },
    profile => { profile.viewpoints[1].target = [0, NaN, 0]; }
  ]) {
    const changed = structuredClone(seed); change(changed);
    assert.throws(() => validateProfile(changed), /Design model/);
  }
  const cabinet = { type:'cabinet', x:1, z:2, width:2, depth:.5, height:1, rotation:90 };
  assert(pointInsideFurniture([1, 1.5, 2.8], cabinet));
  assert(!pointInsideFurniture([1.8, 1.5, 2], cabinet));
  assert(!pointInsideFurniture([1, 1.5, 2], { ...cabinet, y:2.5 }));
  assert(!pointInsideFurniture([1, 1.5, 2], { ...cabinet, type:'rug' }));
});

test('Model loading rejects missing, duplicate and unrelated designs instead of using a category fallback', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'alankaar-model-test-'));
  t.after(() => rm(temporary, { recursive:true, force:true }));
  await mkdir(join(temporary, 'content/layouts'), { recursive:true });
  const seed = (await readJSON('content/layouts/living-retail.json'))[0];
  const save = records => writeFile(join(temporary, 'content/layouts/models.json'), JSON.stringify(records));
  await save([seed]);
  const [loaded] = await loadStudioModels(temporary, [{ id:seed.id }]);
  assert(!Object.hasOwn(loaded, 'notes'));
  await assert.rejects(loadStudioModels(temporary, [{ id:seed.id }, { id:'missing-design' }]), /Every panoramic design/);
  await save([seed, seed]);
  await assert.rejects(loadStudioModels(temporary, [{ id:seed.id }]), /Duplicate design model IDs/);
  await save([{ ...seed, id:'living-rooms' }]);
  await assert.rejects(loadStudioModels(temporary, [{ id:seed.id }]), /Every panoramic design/);
});
