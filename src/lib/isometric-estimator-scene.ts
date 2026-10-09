/* eslint-disable no-var, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - adapted from isometric-estimator.html prototype
import * as THREE from "three";
import type {
  EstimateSummary,
  EstimatorConfig,
  EstimatorSelection,
} from "@/lib/isometric-estimator-config";

// Brand colours: Peak White, Navy and Peak Fleet. three.js materials cannot
// read CSS tokens, so these mirror --peak-white, --navy and --peak-fleet in
// globals.css. Every other colour in the scene is mixed from these three.
const PEAK_WHITE = 0xfefefe;
const NAVY = 0x0e2240;
const PEAK_FLEET = 0x43b7d4;

/** Mix two colours in sRGB, so the result matches what the eye expects. */
function mixColor(a, b, t) {
  var ca = new THREE.Color(a).getRGB({r:0,g:0,b:0}, THREE.SRGBColorSpace);
  var cb = new THREE.Color(b).getRGB({r:0,g:0,b:0}, THREE.SRGBColorSpace);
  return new THREE.Color().setRGB(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
    THREE.SRGBColorSpace
  );
}

/** Seconds an add-on takes to rise into place (or sink away). */
const ADDON_TWEEN_S = 0.4;
/** Seconds the running price takes to count to a new figure. */
const PRICE_TWEEN_S = 0.4;

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
// A size change grows or shrinks the model first, then the fitted camera eases to the new size.
const SIZE_GROW_S = 0.4;
const CAMERA_SETTLE_S = 0.6;

type AddonMeshRecord = {
  solid: THREE.Group | THREE.Object3D;
  ghost: THREE.Object3D;
  /** 1 when selected, 0 when not. */
  target: number;
  /** Linear 0..1 progress towards `target`; eased when applied. */
  progress: number;
  /** How far the add-on sinks below its resting place when hidden. */
  rise: number;
  materials: THREE.Material[];
  glow: THREE.Material[];
  shadowsOn: boolean;
};

export type IsometricEstimatorHandle = {
  /** Push a new selection into the scene; the model and figures update. */
  update: (selection: EstimatorSelection) => void;
  dispose: () => void;
};

/**
 * Mount the isometric estimator scene into a root element that contains the
 * expected markup (#stageHost plus the output ids). The selection is owned by
 * the caller and pushed in with `update`. `onEstimateChange` receives the
 * current estimate after every change.
 */
export function mountIsometricEstimator(
  root: HTMLElement,
  config: EstimatorConfig,
  initialSelection: EstimatorSelection,
  onEstimateChange?: (estimate: EstimateSummary) => void,
): IsometricEstimatorHandle {
  const ADDONS = config.addons;
  const SIZE_MULT = config.sizeMult;
  const FINISH_MULT = config.finishMult;

  var state = {
    addons: ADDONS.reduce(function(acc, a){ acc[a.key] = false; return acc; }, {}),
    size: 'standard',
    finish: 'quality'
  };

  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reducedMotion = reducedMotionQuery.matches;

  // ---------- three.js scene ----------
  var stageHost = root.querySelector('#stageHost');
  if (!(stageHost instanceof HTMLElement)) {
    throw new Error('Missing #stageHost');
  }
  // Fresh canvas per mount so Strict Mode remounts are not stuck with a
  // disposed WebGL context on a React-owned <canvas>.
  stageHost.replaceChildren();
  var canvas = document.createElement('canvas');
  canvas.className = 'ie-stage-canvas';
  canvas.setAttribute('aria-label', 'Interactive house estimate');
  stageHost.appendChild(canvas);
  // Transparent background: the Frost White stage panel shows through.
  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
  renderer.setClearAlpha(0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  // The stylesheet sets --ie-camera-fit: tight on layouts that want the model framed edge to edge.
  var tightFit = false;
  var stageVisible = true;
  function resize(){
    var w = canvas.clientWidth, h = canvas.clientHeight;
    stageVisible = w > 0 && h > 0;
    if (!stageVisible) return;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    tightFit = getComputedStyle(canvas).getPropertyValue('--ie-camera-fit').trim() === 'tight';
    if (orbit){
      if (tightFit) computeFitDistance();
      updateCamera();
    }
  }
  window.addEventListener('resize', resize);
  var resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(canvas);

  // lighting: one soft neutral key light and a hemisphere fill
  var hemi = new THREE.HemisphereLight(PEAK_WHITE, mixColor(PEAK_WHITE, NAVY, 0.25), 2.3);
  scene.add(hemi);
  // key light on the camera's starting side, so the front walls read white and the shadow falls behind
  var sun = new THREE.DirectionalLight(PEAK_WHITE, 1.6);
  sun.position.set(-9, 14, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;   sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far = 40;
  sun.shadow.radius = 9;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // model root (for size-tier scaling)
  var modelRoot = new THREE.Group();
  scene.add(modelRoot);

  // ---------- ground: a flat pale disc under the house, plus a short path ----------
  // The disc is unlit so it holds its colour exactly; a shadow-only disc on top
  // of it carries the soft shadow from the house.
  var GROUND_CENTER_X = 4.6, GROUND_CENTER_Z = 2.0, GROUND_RADIUS = 7.4;
  var groundMat = new THREE.MeshBasicMaterial({color: mixColor(mixColor(PEAK_WHITE, PEAK_FLEET, 0.2), NAVY, 0.05)});
  var ground = new THREE.Mesh(new THREE.CircleGeometry(GROUND_RADIUS, 96), groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.set(GROUND_CENTER_X, -0.002, GROUND_CENTER_Z);
  modelRoot.add(ground);

  var shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(GROUND_RADIUS, 96),
    new THREE.ShadowMaterial({color: NAVY, opacity: 0.16})
  );
  shadowCatcher.rotation.x = -Math.PI/2;
  shadowCatcher.position.set(GROUND_CENTER_X, 0.004, GROUND_CENTER_Z);
  shadowCatcher.receiveShadow = true;
  modelRoot.add(shadowCatcher);

  // the doorstep spans local x[2.3,3.6] z[-0.42,0]; the path runs out from its front edge
  var pathMat = new THREE.MeshBasicMaterial({color: mixColor(PEAK_WHITE, PEAK_FLEET, 0.07)});
  var path = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), pathMat);
  path.rotation.x = -Math.PI/2;
  path.position.set(2.95, 0.001, -1.37);
  modelRoot.add(path);

  // helper: box from (x0, heightBase, depthBase) footprint using (width, heightSize, depthSize)
  function boxMesh(x0, hBase, dBase, w, h, d, mat){
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    mesh.position.set(x0 + w/2, hBase + h/2, dBase + d/2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ---------- materials: matte, untextured ----------
  function matte(color){
    return new THREE.MeshStandardMaterial({color: color, roughness: 1, metalness: 0});
  }
  var WALL_MAT  = matte(PEAK_WHITE);
  var FRAME_MAT = matte(NAVY);
  var ROOF_MAT  = matte(NAVY);
  var DOOR_MAT  = FRAME_MAT;
  var GLASS_MAT = matte(mixColor(PEAK_WHITE, NAVY, 0.2));
  function newGlassMat(){ return GLASS_MAT.clone(); } // own instance per pane so panes can be animated independently
  // add-ons get their own instances so each can fade on its own
  function addonMat(){ return matte(PEAK_FLEET); }
  function addonGlassMat(){
    var m = matte(mixColor(PEAK_FLEET, PEAK_WHITE, 0.4));
    m.emissive = new THREE.Color(PEAK_FLEET);
    m.emissiveIntensity = 0;
    return m;
  }

  // ---------- pitched gable roof (ridge runs along X) ----------
  function gableRoof(x0, wallTop, z0, width, depth, ridgeH, ov, material){
    var A = [x0-ov, wallTop, z0-ov];
    var B = [x0+width+ov, wallTop, z0-ov];
    var C = [x0+width+ov, wallTop, z0+depth+ov];
    var D = [x0-ov, wallTop, z0+depth+ov];
    var zMid = z0 + depth/2;
    var R1 = [x0-ov, wallTop+ridgeH, zMid];
    var R2 = [x0+width+ov, wallTop+ridgeH, zMid];

    var tris = [
      A,R2,B,  A,R1,R2,   // front slope
      C,R1,D,  C,R2,R1,   // back slope
      D,R1,A,             // left gable end
      B,R2,C              // right gable end
    ];
    var positions = new Float32Array(tris.length * 3);
    var uv = new Float32Array(tris.length * 2);
    for (var i=0;i<tris.length;i++){
      positions[i*3]   = tris[i][0];
      positions[i*3+1] = tris[i][1];
      positions[i*3+2] = tris[i][2];
      uv[i*2]   = tris[i][0] * 0.28;
      uv[i*2+1] = tris[i][2] * 0.28;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    var mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ---------- window unit: frame + glass + mullion ----------
  // axis 'z' = mounted on a front/back wall face (outward normal along Z, sign gives direction)
  // axis 'x' = mounted on a side wall face (outward normal along X, sign gives direction)
  function addWindow(x, y, z, w, h, axis, sign, frameMat){
    frameMat = frameMat || FRAME_MAT;
    var group = new THREE.Group();
    var o = 0.03 * sign, o2 = 0.055 * sign; // o2 sits proud of the glass so the mullion never z-fights it
    var glass;
    if (axis === 'z'){
      group.add(boxMesh(x-0.06, y-0.06, z-0.03*sign, w+0.12, h+0.12, 0.06, frameMat));
      glass = boxMesh(x, y, z+o, w, h, 0.03, newGlassMat());
      group.add(glass);
      group.add(boxMesh(x+w/2-0.03, y, z+o2, 0.06, h, 0.02, frameMat));
    } else {
      group.add(boxMesh(x-0.03, y-0.06, z-0.06, 0.06, h+0.12, w+0.12, frameMat));
      // on the -x face the pane sits proud of the frame slab; flush faces z-fight
      glass = boxMesh(sign > 0 ? x+o : x-0.04, y, z, 0.03, h, w, newGlassMat());
      group.add(glass);
      group.add(boxMesh(x+o2, y, z+w/2-0.03, 0.02, h, 0.06, frameMat));
    }
    // thin frame and glass boxes self-shadow into stripes under the soft shadow map
    group.children.forEach(function(child){ child.castShadow = false; });
    modelRoot.add(group);
    group.userData.glass = glass;
    return group;
  }

  // ---------- main house: walls, roof, chimney, door, windows ----------
  var wallW = 6, wallH = 3, wallD = 5;
  var roofRidgeH = 1.9, roofOv = 0.35;
  modelRoot.add(boxMesh(0, 0, 0, wallW, wallH, wallD, WALL_MAT));
  modelRoot.add(gableRoof(0, wallH, 0, wallW, wallD, roofRidgeH, roofOv, ROOF_MAT));

  modelRoot.add(boxMesh(4.5, wallH+0.6, 1.6, 0.4, 1.6, 0.4, WALL_MAT));
  modelRoot.add(boxMesh(4.4, wallH+2.05, 1.5, 0.6, 0.12, 0.6, FRAME_MAT));

  modelRoot.add(boxMesh(2.42, 0, -0.02, 1.06, 2.02, 0.03, FRAME_MAT));
  modelRoot.add(boxMesh(2.5, 0, -0.07, 0.9, 1.9, 0.05, DOOR_MAT));
  modelRoot.add(boxMesh(2.3, 0, -0.42, 1.3, 0.07, 0.42, WALL_MAT));

  // front window A stands in for the kitchen/bath add-on, so it owns its materials
  var kitchenFrameMat = FRAME_MAT.clone();
  var frontWindowA = addWindow(0.55, 1.65, 0, 0.85, 1.1, 'z', -1, kitchenFrameMat);
  addWindow(4.6, 1.65, 0, 0.85, 1.1, 'z', -1);
  addWindow(0, 1.7, 1.55, 0.85, 1.05, 'x', -1);
  addWindow(0, 1.7, 3.25, 0.85, 1.05, 'x', -1);
  var kitchenGlass = frontWindowA.userData.glass; // the glass pane, toggled by kitchen/bath add-on
  var kitchen = {
    target: 0,
    progress: 0,
    glassFrom: GLASS_MAT.color.clone(),
    glassTo: mixColor(PEAK_FLEET, PEAK_WHITE, 0.4),
    frameFrom: FRAME_MAT.color.clone(),
    frameTo: new THREE.Color(PEAK_FLEET)
  };

  // add-on groups (flat-roofed volumes with a glazed face, fascia cap and plinth), all in Peak Fleet
  var addonMeshes = {};
  var ADDON_RISE = 0.9;
  var GHOST_OPACITY = 0.32; // assigned before makeAddon runs: ghostMat() reads it at construction
  function makeAddon(key, x0,hBase,dBase, w,h,d, glassAxis, glassSign){
    var group = new THREE.Group();
    var solidGroup = new THREE.Group();
    var bodyMat = addonMat();
    var materials = [bodyMat];
    solidGroup.add(boxMesh(x0,hBase,dBase, w,h,d, bodyMat));

    // fascia cap along the flat roofline — reads as a roof edge without modelling one
    solidGroup.add(boxMesh(x0-0.05, hBase+h, dBase-0.05, w+0.1, 0.08, d+0.1, bodyMat));
    // plinth at the base, grounds the volume (sits proud of grade so its top face never coplanar-fights the ground)
    solidGroup.add(boxMesh(x0-0.03, hBase, dBase-0.03, w+0.06, 0.05, d+0.06, bodyMat));

    var glowMats = []; // only glazing reacts to the finish-tier glow
    var gw = Math.min(w,d) * 0.72;
    if (gw > 0.35){
      var glassH = h*0.6, glassY = hBase+0.2, glassMesh;
      var glassMat = addonGlassMat();
      materials.push(glassMat);
      if (glassAxis === 'x'){
        var gx = glassSign > 0 ? x0+w : x0;
        var gz0 = dBase+(d-gw)/2;
        glassMesh = boxMesh(gx-0.015, glassY, gz0, 0.03, glassH, gw, glassMat);
        solidGroup.add(glassMesh);
        solidGroup.add(boxMesh(gx-0.03, glassY+glassH/2-0.03, gz0-0.02, 0.06, 0.06, gw+0.04, bodyMat));
      } else {
        var gz = glassSign > 0 ? dBase+d : dBase;
        var gx0 = x0+(w-gw)/2;
        glassMesh = boxMesh(gx0, glassY, gz-0.015, gw, glassH, 0.03, glassMat);
        solidGroup.add(glassMesh);
        solidGroup.add(boxMesh(gx0-0.02, glassY+glassH/2-0.03, gz-0.03, gw+0.04, 0.06, 0.06, bodyMat));
      }
      glowMats.push(glassMat);
    }
    var ghost = ghostBox(x0,hBase,dBase, w,h,d);
    group.add(ghost);
    group.add(solidGroup);
    modelRoot.add(group);
    addonMeshes[key] = {solid:solidGroup, ghost:ghost, target:0, progress:0, rise:ADDON_RISE, materials:materials, glow:glowMats, shadowsOn:true};
  }
  // The single-storey add-ons share one height below the eaves. The side return
  // and rear extension wrap the back corner together; the garden room stands
  // apart, smaller and lower. The loft is a dormer on the front slope's left
  // half, set back from the eaves with its flat top tucked under the ridge, so
  // the solar array keeps the right half.
  var SINGLE_STOREY_H = 2.3;
  makeAddon('extension',   0,0,5,      4.4,SINGLE_STOREY_H,2.3, 'z', 1);
  makeAddon('side_return', -1.5,0,2.55, 1.5,SINGLE_STOREY_H,2.45, 'x', -1);
  makeAddon('loft',        0.5,3.72,0.9, 2,1.03,1.6, 'z', -1);
  makeAddon('garden_room', 8.2,0,0.8,  2.6,2.1,2.4, 'z', -1);

  function ghostMat(){
    return new THREE.LineDashedMaterial({color:NAVY, dashSize:0.14, gapSize:0.1, transparent:true, opacity:GHOST_OPACITY});
  }
  function ghostBox(x0, hBase, dBase, w, h, d){
    var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
    var lines = new THREE.LineSegments(geo, ghostMat());
    lines.position.set(x0 + w/2, hBase + h/2, dBase + d/2);
    lines.computeLineDistances();
    return lines;
  }

  // solar — panels mounted flush to the front roof slope, tilted to match its pitch
  (function(){
    function centeredGhost(cx,cy,cz,w,h,d){
      var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
      var lines = new THREE.LineSegments(geo, ghostMat());
      lines.position.set(cx,cy,cz);
      lines.computeLineDistances();
      return lines;
    }
    var runToRidge = wallD/2 + roofOv;           // horizontal distance from eave to ridge
    var pitch = Math.atan2(roofRidgeH, runToRidge); // roof pitch angle

    var mount = new THREE.Group();
    mount.position.set(0, wallH, -roofOv);   // pivot along the front eave line
    mount.rotation.x = -pitch;               // tilt to sit flush with the slope

    var solidGroup = new THREE.Group();
    var ghostGroup = new THREE.Group();
    // two by two on the right half of the slope, below the chimney and clear of the loft dormer
    var panelW = 1.3, panelD = 0.82, outward = 0.045;
    var panelMat = addonMat();
    var frameMat = matte(mixColor(PEAK_FLEET, PEAK_WHITE, 0.4));
    [3.05, 4.5].forEach(function(sx){
      [0.81, 1.75].forEach(function(slopeZ){
        var cx = sx + panelW/2;
        var panel = new THREE.Mesh(new THREE.BoxGeometry(panelW,0.04,panelD), panelMat);
        panel.position.set(cx, outward, slopeZ);
        panel.castShadow = true;
        solidGroup.add(panel);
        // slim frame edge + a center mullion so it reads as cells, not a slab
        var frame = new THREE.Mesh(new THREE.BoxGeometry(panelW+0.04,0.03,panelD+0.04), frameMat);
        frame.position.set(cx, outward-0.015, slopeZ);
        solidGroup.add(frame);
        var muln = new THREE.Mesh(new THREE.BoxGeometry(panelW,0.045,0.025), frameMat);
        muln.position.set(cx, outward+0.006, slopeZ);
        solidGroup.add(muln);
        ghostGroup.add(centeredGhost(cx, outward, slopeZ, panelW, 0.08, panelD));
      });
    });
    mount.add(ghostGroup);
    mount.add(solidGroup);
    modelRoot.add(mount);
    addonMeshes['solar'] = {solid:solidGroup, ghost:ghostGroup, target:0, progress:0, rise:0.4, materials:[panelMat, frameMat], glow:[], shadowsOn:true};
  })();

  // center the model root so it orbits nicely
  modelRoot.position.set(-4.6, 0, -2.6);

  var PHI_MIN = 0.5, PHI_MAX = 1.45; // tilt range the drag allows
  var ORBIT_RADIUS = 16;             // starting orbit distance

  // ---------- tight framing: bounds of the house and every add-on outline ----------
  // Corners are kept in modelRoot space at scale 1, relative to the centre of their union.
  var fitCenter = new THREE.Vector3();
  var fitTarget = new THREE.Vector3();
  var fitCorners = [];
  var fitDistance = 16;
  var FIT_MARGIN = 0.94;
  (function(){
    modelRoot.updateMatrixWorld(true);
    var addonGroups = Object.keys(addonMeshes).map(function(key){ return addonMeshes[key].solid.parent; });
    var parts = modelRoot.children.filter(function(child){
      return child !== ground && child !== shadowCatcher && child !== path && addonGroups.indexOf(child) === -1;
    });
    // add-ons are measured by their outline, which matches the volume once it has risen into place
    Object.keys(addonMeshes).forEach(function(key){ parts.push(addonMeshes[key].ghost); });
    var union = new THREE.Box3();
    var boxes = parts.map(function(obj){
      var box = new THREE.Box3().setFromObject(obj);
      box.min.sub(modelRoot.position);
      box.max.sub(modelRoot.position);
      union.union(box);
      return box;
    });
    union.getCenter(fitCenter);
    boxes.forEach(function(box){
      for (var i = 0; i < 8; i++){
        fitCorners.push(new THREE.Vector3(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z
        ).sub(fitCenter));
      }
    });
  })();

  // Smallest camera distance (at scale 1) that keeps every corner in frame at the
  // current tilt, checked across the full turn so spinning never clips.
  var fitPhi = null;
  function computeFitDistance(){
    var phi = orbit.phi;
    var tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * FIT_MARGIN;
    var tanH = tanV * camera.aspect;
    var up = new THREE.Vector3(0, 1, 0);
    var back = new THREE.Vector3(), side = new THREE.Vector3(), lift = new THREE.Vector3();
    var need = 0;
    for (var ti = 0; ti < 72; ti++){
      var theta = ti / 72 * Math.PI * 2;
      back.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      side.crossVectors(up, back).normalize();
      lift.crossVectors(back, side);
      for (var i = 0; i < fitCorners.length; i++){
        var q = fitCorners[i];
        var depth = q.dot(back);
        need = Math.max(
          need,
          depth + Math.abs(q.dot(side)) / tanH,
          depth + Math.abs(q.dot(lift)) / tanV
        );
      }
    }
    fitDistance = need;
    fitPhi = phi;
  }

  // ---------- camera orbit (custom, no extra library) ----------
  var orbit = {
    theta: Math.PI*1.22,  // azimuth — starts facing the door/window side
    phi: 1.0,             // polar angle
    radius: ORBIT_RADIUS,
    target: new THREE.Vector3(0, 1.4, 0)
  };
  var dragging = false, lastX = 0, lastY = 0;
  // Very slow idle spin until the visitor first drags; never with reduced motion.
  var hasDragged = false;
  var autoRotate = !reducedMotion;
  var IDLE_SPIN = 0.05; // radians per second

  // Canvases narrower than this aspect pull the camera back so the full plot stays in frame.
  var FIT_ASPECT = 1.75;
  function updateCamera(){
    var p = orbit.phi;
    var target = orbit.target, r;
    if (tightFit){
      // orbit the centre of the model and follow its size; wheel zoom scales the fitted distance
      if (fitPhi !== p) computeFitDistance();
      var s = cameraScale;
      target = fitTarget.copy(fitCenter).multiplyScalar(s).add(modelRoot.position);
      r = fitDistance * s * orbit.radius / ORBIT_RADIUS;
    } else {
      r = orbit.radius * Math.max(1, FIT_ASPECT / (camera.aspect || FIT_ASPECT));
    }
    camera.position.set(
      target.x + r * Math.sin(p) * Math.cos(orbit.theta),
      target.y + r * Math.cos(p),
      target.z + r * Math.sin(p) * Math.sin(orbit.theta)
    );
    camera.lookAt(target);
  }

  function onPointerDown(e){
    dragging = true; hasDragged = true; autoRotate = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e){
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    orbit.theta -= dx * 0.0065;
    orbit.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, orbit.phi - dy * 0.0065));
    updateCamera();
  }
  function onPointerUp(){
    dragging = false;
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function onReducedMotionChange(e){
    reducedMotion = e.matches;
    autoRotate = !reducedMotion && !hasDragged;
  }
  reducedMotionQuery.addEventListener('change', onReducedMotionChange);

  // ---------- outputs (the selection itself is owned by the caller) ----------
  var priceOut = root.querySelector('#priceOut');
  var weeksOut = root.querySelector('#weeksOut');
  var costBar = root.querySelector('#costBar');
  var costLegend = root.querySelector('#costLegend');

  // Strict Mode remounts the effect on the same DOM: clear leftovers first.
  if (costBar) costBar.replaceChildren();
  if (costLegend) costLegend.replaceChildren();

  // Every add-on is Peak Fleet, so the cost bar tells them apart by tint.
  var COST_TINTS = [100, 78, 60, 46, 35, 26];

  var sizeTargetScale = 1, sizeCurrentScale = 1;
  var cameraScale = 1;   // size the fitted camera is framing; trails the model during a size change
  var sizeTween = null;  // {from, to, cameraFrom, t} while a size change plays
  var FINISH_EMISSIVE = {simple:0, quality:0.18, highend:0.4};
  var finishTarget = FINISH_EMISSIVE.quality;

  var priceShown = null; // figure currently on screen, null while the placeholder shows
  var priceAnim = null;  // {from, to, t} while counting

  function showPrice(value){
    if (priceOut) priceOut.textContent = '£' + value.toLocaleString('en-GB');
  }

  function render(){
    Object.keys(addonMeshes).forEach(function(key){
      addonMeshes[key].target = state.addons[key] ? 1 : 0;
    });
    kitchen.target = state.addons.kitchen_bath ? 1 : 0;
    var nextScale = SIZE_MULT[state.size];
    if (nextScale !== sizeTargetScale){
      sizeTween = {from: sizeCurrentScale, to: nextScale, cameraFrom: cameraScale, t: 0};
      sizeTargetScale = nextScale;
    }
    finishTarget = FINISH_EMISSIVE[state.finish];

    var selected = ADDONS.filter(function(a){ return state.addons[a.key]; });
    var basePrice = selected.reduce(function(s,a){ return s + a.price; }, 0);
    var total = Math.round(basePrice * SIZE_MULT[state.size] * FINISH_MULT[state.finish] / 500) * 500;

    var weeksLabel = null;
    if (selected.length === 0){
      priceAnim = null;
      priceShown = null;
      if (priceOut){
        priceOut.textContent = "Select what you're building";
        priceOut.classList.add('ie-muted');
      }
      if (weeksOut){
        weeksOut.textContent = '-';
        weeksOut.classList.add('ie-muted');
      }
    } else {
      if (priceOut) priceOut.classList.remove('ie-muted');
      if (reducedMotion){
        priceAnim = null;
        priceShown = total;
        showPrice(total);
      } else if (priceShown !== total){
        priceAnim = {from: priceShown === null ? 0 : priceShown, to: total, t: 0};
      }
      var baseWeeks = 3 + selected.reduce(function(s,a){ return s + a.weeks; }, 0);
      var weeks = Math.round(baseWeeks * SIZE_MULT[state.size]);
      weeksLabel = weeks + ' to ' + (weeks + 2) + ' weeks';
      if (weeksOut){
        weeksOut.textContent = weeksLabel;
        weeksOut.classList.remove('ie-muted');
      }
    }

    if (onEstimateChange) {
      onEstimateChange({
        work: selected.map(function(a){ return a.label; }),
        size: state.size,
        finish: state.finish,
        total: selected.length ? total : null,
        weeks: weeksLabel
      });
    }

    // cost breakdown bar - proportional segment per selected add-on
    if (!costBar || !costLegend) return;
    costBar.replaceChildren();
    costLegend.replaceChildren();
    selected.forEach(function(a, i){
      var tint = 'color-mix(in srgb, ' + a.color + ' ' + COST_TINTS[i % COST_TINTS.length] + '%, var(--peak-white))';
      var seg = document.createElement('span');
      seg.style.width = ((a.price / basePrice) * 100) + '%';
      seg.style.background = tint;
      costBar.appendChild(seg);

      var item = document.createElement('span');
      item.className = 'ie-item';
      var swatch = document.createElement('span');
      swatch.className = 'ie-swatch';
      swatch.style.background = tint;
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(a.label + ' · £' + a.price.toLocaleString('en-GB')));
      costLegend.appendChild(item);
    });
  }

  function setShadows(obj, on){
    obj.traverse(function(child){ if (child.isMesh) child.castShadow = on; });
  }

  function setGhostOpacity(ghost, opacity){
    ghost.visible = opacity > 0.005;
    ghost.traverse(function(child){
      if (child.material) child.material.opacity = opacity;
    });
  }

  // Selected add-ons rise into place and fade in; removed ones sink and fade out.
  function applyAddon(rec){
    var e = easeOutCubic(rec.progress);
    rec.solid.visible = rec.progress > 0;
    rec.solid.position.y = -(1 - e) * rec.rise;
    rec.materials.forEach(function(m){
      var transparent = e < 1;
      if (m.transparent !== transparent){
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.opacity = e;
    });
    var shadowsOn = e > 0.5;
    if (shadowsOn !== rec.shadowsOn){
      rec.shadowsOn = shadowsOn;
      setShadows(rec.solid, shadowsOn);
    }
    setGhostOpacity(rec.ghost, GHOST_OPACITY * (1 - e));
  }

  function applyKitchen(){
    var e = easeOutCubic(kitchen.progress);
    kitchenGlass.material.color.lerpColors(kitchen.glassFrom, kitchen.glassTo, e);
    kitchenFrameMat.color.lerpColors(kitchen.frameFrom, kitchen.frameTo, e);
  }

  function stepTowards(current, target, amount){
    return target > current ? Math.min(target, current + amount) : Math.max(target, current - amount);
  }

  /** Jump every animated value to its target (first paint, reduced motion). */
  function snapToTargets(){
    Object.keys(addonMeshes).forEach(function(key){
      var rec = addonMeshes[key];
      rec.progress = rec.target;
      applyAddon(rec);
    });
    kitchen.progress = kitchen.target;
    applyKitchen();
    sizeCurrentScale = cameraScale = sizeTargetScale;
    sizeTween = null;
    modelRoot.scale.setScalar(sizeCurrentScale);
    Object.keys(addonMeshes).forEach(function(key){
      (addonMeshes[key].glow || []).forEach(function(m){ m.emissiveIntensity = finishTarget; });
    });
    if (priceAnim){
      priceShown = priceAnim.to;
      showPrice(priceAnim.to);
      priceAnim = null;
    }
  }

  // ---------- animation loop ----------
  var timer = new THREE.Timer();
  timer.connect(document);
  var raf = 0;
  var disposed = false;
  function tick(timestamp){
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    timer.update(timestamp);
    var dt = Math.min(timer.getDelta(), 0.05);

    if (autoRotate && !dragging){
      orbit.theta += dt * IDLE_SPIN;
      updateCamera();
    }

    var tweenStep = reducedMotion ? 1 : dt / ADDON_TWEEN_S;
    Object.keys(addonMeshes).forEach(function(key){
      var rec = addonMeshes[key];
      if (rec.progress === rec.target) return;
      rec.progress = stepTowards(rec.progress, rec.target, tweenStep);
      applyAddon(rec);
    });
    if (kitchen.progress !== kitchen.target){
      kitchen.progress = stepTowards(kitchen.progress, kitchen.target, tweenStep);
      applyKitchen();
    }

    var previousScale = sizeCurrentScale, previousCamera = cameraScale;
    if (reducedMotion){
      sizeCurrentScale = cameraScale = sizeTargetScale;
      sizeTween = null;
    } else if (sizeTween){
      sizeTween.t += dt;
      var grow = Math.min(1, sizeTween.t / SIZE_GROW_S);
      var settle = Math.min(1, Math.max(0, (sizeTween.t - SIZE_GROW_S) / CAMERA_SETTLE_S));
      sizeCurrentScale = sizeTween.from + (sizeTween.to - sizeTween.from) * easeOutCubic(grow);
      cameraScale = sizeTween.cameraFrom + (sizeTween.to - sizeTween.cameraFrom) * easeInOutCubic(settle);
      if (settle >= 1) sizeTween = null;
    }
    modelRoot.scale.setScalar(sizeCurrentScale);
    if (tightFit && (sizeCurrentScale !== previousScale || cameraScale !== previousCamera)) updateCamera();

    Object.keys(addonMeshes).forEach(function(key){
      (addonMeshes[key].glow || []).forEach(function(m){
        if (reducedMotion) m.emissiveIntensity = finishTarget;
        else m.emissiveIntensity += (finishTarget - m.emissiveIntensity) * Math.min(1, dt*4);
      });
    });

    if (priceAnim){
      priceAnim.t = Math.min(1, priceAnim.t + dt / PRICE_TWEEN_S);
      var value = priceAnim.from + (priceAnim.to - priceAnim.from) * easeOutCubic(priceAnim.t);
      if (priceAnim.t >= 1){
        priceShown = priceAnim.to;
        showPrice(priceAnim.to);
        priceAnim = null;
      } else {
        priceShown = Math.round(value / 100) * 100;
        showPrice(priceShown);
      }
    }

    if (stageVisible) renderer.render(scene, camera);
  }

  function applySelection(selection){
    var picked = {};
    (selection.addons || []).forEach(function(key){ picked[key] = true; });
    ADDONS.forEach(function(a){ state.addons[a.key] = Boolean(picked[a.key]); });
    if (SIZE_MULT[selection.size] != null) state.size = selection.size;
    if (FINISH_MULT[selection.finish] != null) state.finish = selection.finish;
  }

  function onWheel(e){
    e.preventDefault();
    orbit.radius = Math.min(26, Math.max(9, orbit.radius + e.deltaY * 0.012));
    updateCamera();
  }

  canvas.addEventListener('wheel', onWheel, {passive:false});

  function disposeObject3D(obj){
    obj.traverse(function(child){
      if (child.geometry) child.geometry.dispose();
      var mat = child.material;
      if (!mat) return;
      var mats = Array.isArray(mat) ? mat : [mat];
      mats.forEach(function(m){
        if (m.map) m.map.dispose();
        m.dispose();
      });
    });
  }

  resize();
  updateCamera();
  applySelection(initialSelection);
  render();
  snapToTargets();
  updateCamera();
  raf = requestAnimationFrame(tick);
  var resizeTimer = setTimeout(resize, 50);

  function update(selection){
    if (disposed) return;
    applySelection(selection);
    render();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    timer.dispose();

    window.removeEventListener('resize', resize);
    if (resizeObserver) resizeObserver.disconnect();
    reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('wheel', onWheel);

    if (costBar) costBar.replaceChildren();
    if (costLegend) costLegend.replaceChildren();
    if (stageHost) stageHost.replaceChildren();

    disposeObject3D(scene);
    renderer.dispose();
  }

  return { update: update, dispose: dispose };
}
