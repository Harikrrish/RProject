Three.js 0.186.0, MIT licence (see LICENSE).
Primary source: https://github.com/mrdoob/three.js/tree/r186
Distribution: https://registry.npmjs.org/three/-/three-0.186.0.tgz

Files retained: build/three.module.js, build/three.core.js,
examples/jsm/controls/OrbitControls.js, examples/jsm/geometries/RoundedBoxGeometry.js.
Addon imports of 'three' were changed to './three.module.js'.
All four files were minified as ES modules with esbuild 0.28.2:
esbuild <files> --minify --format=esm --outdir=<output> --legal-comments=inline
The original licence is retained separately and in the renderer modules.

The homepage imports the renderer only when a visitor starts the room viewer.
Room layouts are original procedural models in ../room-layouts.js.
No runtime CDN, tracking service, npm install or API key is needed for the viewer.
