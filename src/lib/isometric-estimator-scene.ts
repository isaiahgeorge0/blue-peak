/* eslint-disable no-var, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - adapted from isometric-estimator.html prototype
import * as THREE from "three";
import type { EstimatorConfig } from "@/lib/isometric-estimator-config";

type AddonMeshRecord = {
  solid: THREE.Group | THREE.Object3D;
  ghost: THREE.Object3D;
  targetScale: number;
  currentScale: number;
  glow: THREE.Material[];
};

/**
 * Mount the isometric estimator scene into a root element that contains the
 * expected markup (canvas + control ids). Returns a dispose function.
 */
export function mountIsometricEstimator(
  root: HTMLElement,
  config: EstimatorConfig,
): () => void {
  const ADDONS = config.addons;
  const SIZE_MULT = config.sizeMult;
  const FINISH_MULT = config.finishMult;

    var state = {
    addons: ADDONS.reduce(function(acc, a){ acc[a.key] = false; return acc; }, {}),
    size: 'standard',
    finish: 'quality'
  };

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
  var scene = new THREE.Scene();

  function makeSkyTexture(topColor, bottomColor){
    var c = document.createElement('canvas'); c.width = 8; c.height = 256;
    var ctx = c.getContext('2d');
    var grad = ctx.createLinearGradient(0,0,0,256);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,8,256);
    var tex = new THREE.CanvasTexture(c);
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  var daySkyTex   = makeSkyTexture('#bcd9ea', '#eef1e9');
  var nightSkyTex = makeSkyTexture('#131c34', '#2a3454');

  scene.background = daySkyTex;
  scene.fog = new THREE.Fog(0xe4e8df, 24, 46);

  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  function resize(){
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // lighting
  var hemi = new THREE.HemisphereLight(0xbfe2f5, 0x2c3020, 0.6);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff3e0, 1.15);
  sun.position.set(9, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;   sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0015;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0x89cff0, 0.18);
  fill.position.set(-8,6,-6);
  scene.add(fill);
  var moon = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), new THREE.MeshBasicMaterial({color:0xeaf0ff}));
  moon.position.set(-9,13,-8);
  moon.visible = false;
  scene.add(moon);

  // a scattering of stars, only shown at night
  var starGeo = new THREE.BufferGeometry();
  var starPos = new Float32Array(220*3);
  for (var si=0; si<220; si++){
    var sa = Math.random()*Math.PI*2, sr = 20+Math.random()*20;
    starPos[si*3]   = Math.cos(sa)*sr;
    starPos[si*3+1] = 8 + Math.random()*22;
    starPos[si*3+2] = Math.sin(sa)*sr - 6;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
  var starMat = new THREE.PointsMaterial({color:0xffffff, size:0.12, transparent:true, opacity:0.85});
  var stars = new THREE.Points(starGeo, starMat);
  stars.visible = false;
  scene.add(stars);

  // ---------- ground: grass texture + a paved path to the door ----------
  function makeGrassTexture(){
    var c = document.createElement('canvas'); c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#4c6b3f';
    ctx.fillRect(0,0,256,256);
    for (var i=0;i<2200;i++){
      var gx = Math.random()*256, gy = Math.random()*256;
      var g = 20 + Math.random()*60;
      ctx.fillStyle = 'rgba('+(50+g*0.4)+','+(90+g)+','+(45+g*0.35)+','+(0.35+Math.random()*0.3)+')';
      ctx.fillRect(gx, gy, 1.6, 1.6);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(14,14);
    return tex;
  }
  var grassTex = makeGrassTexture();
  var groundMat = new THREE.MeshStandardMaterial({map: grassTex, roughness:1, metalness:0});
  var ground = new THREE.Mesh(new THREE.CircleGeometry(18,48), groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  function makePavingTexture(){
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#9d968a';
    ctx.fillRect(0,0,128,128);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (var px=0; px<128; px+=32){ ctx.strokeRect(px,0,32,128); }
    ctx.strokeRect(0,64,128,2);
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1,3);
    return tex;
  }
  // positioned to meet the doorstep — modelRoot sits at world (-4.6, 0, -2.6) and the
  // doorstep spans local x[2.3,3.6] z[-0.42,0], so its outer (world) edge is z=-3.02, x=[-2.3,-1.0]
  var pathMat = new THREE.MeshStandardMaterial({map: makePavingTexture(), roughness:0.95});
  var path = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), pathMat);
  path.rotation.x = -Math.PI/2;
  path.position.set(-1.65, 0.006, -4.32);
  path.receiveShadow = true;
  scene.add(path);

  // a few low-poly trees and a hedge line for scale and context
  function makeTree(x, z, scale){
    var g = new THREE.Group();
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.16,1.1,7), new THREE.MeshStandardMaterial({color:0x4a3626, roughness:0.9}));
    trunk.position.y = 0.55;
    trunk.castShadow = true;
    g.add(trunk);
    var leafMat = new THREE.MeshStandardMaterial({color:0x4d7a3c, roughness:0.85});
    [0,1,2].forEach(function(i){
      var s = 1 - i*0.18;
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.95*s,8,7), leafMat);
      leaf.position.y = 1.3 + i*0.55;
      leaf.castShadow = true;
      g.add(leaf);
    });
    g.position.set(x,0,z);
    g.scale.setScalar(scale);
    return g;
  }
  var treeGroup = new THREE.Group();
  treeGroup.add(makeTree(-9.5, -6.5, 1.15));
  treeGroup.add(makeTree(-8.6, 3.5, 0.9));
  treeGroup.add(makeTree(9.8, 1.5, 1.3));
  scene.add(treeGroup);

  var hedgeMat = new THREE.MeshStandardMaterial({color:0x3f5c34, roughness:0.9});
  function makeHedgeRun(x0,z0,w,d){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w,0.55,d), hedgeMat);
    m.position.set(x0+w/2, 0.275, z0+d/2);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  scene.add(makeHedgeRun(-4.2, -6.8, 9.5, 0.5));
  scene.add(makeHedgeRun(-4.2, -6.8, 0.5, 5.5));

  // ---------- day / night ----------
  var DAYNIGHT = {
    day:   {sunColor:0xfff3e0, sunI:1.15, hemiSky:0xbfe2f5, hemiGround:0x2c3020, hemiI:0.6,  fog:0xe4e8df, ground:0xffffff, fillI:0.18},
    night: {sunColor:0x7f9adf, sunI:0.42, hemiSky:0x3a4a7a, hemiGround:0x181d2c, hemiI:0.5,  fog:0x232c48, ground:0x8a94b5, fillI:0.5}
  };
  var nightGlow = {target:0, value:0};
  function setDayNight(mode){
    dayNightState = mode;
    var c = DAYNIGHT[mode];
    scene.background = mode === 'night' ? nightSkyTex : daySkyTex;
    scene.fog.color.setHex(c.fog);
    sun.color.setHex(c.sunColor);
    sun.intensity = c.sunI;
    hemi.color.setHex(c.hemiSky);
    hemi.groundColor.setHex(c.hemiGround);
    hemi.intensity = c.hemiI;
    fill.intensity = c.fillI;
    groundMat.color.setHex(c.ground);
    moon.visible = mode === 'night';
    stars.visible = mode === 'night';
    nightGlow.target = mode === 'night' ? 1 : 0;
  }
  var dayNightState = 'day';
  setDayNight('day');

  // model root (for size-tier scaling)
  var modelRoot = new THREE.Group();
  scene.add(modelRoot);

  // helper: box from (x0, heightBase, depthBase) footprint using (width, heightSize, depthSize)
  // colorOrMat may be a hex color (builds a new material) or a shared THREE.Material instance
  function boxMesh(x0, hBase, dBase, w, h, d, colorOrMat, opts){
    opts = opts || {};
    var mat;
    if (colorOrMat && colorOrMat.isMaterial){
      mat = colorOrMat;
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: colorOrMat,
        roughness: opts.roughness != null ? opts.roughness : 0.75,
        metalness: opts.metalness != null ? opts.metalness : 0.05,
        emissive: opts.emissive || 0x000000,
        emissiveIntensity: opts.emissiveIntensity || 0
      });
    }
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    mesh.position.set(x0 + w/2, hBase + h/2, dBase + d/2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ---------- procedural textures (canvas, no external assets) ----------
  function makeBrickTexture(){
    var c = document.createElement('canvas'); c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#a3492f';
    ctx.fillRect(0,0,256,256);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    var bw = 34, bh = 15;
    for (var row = 0, y = 0; y < 256 + bh; row++, y += bh){
      var offset = (row % 2) * (bw/2);
      for (var x = -bw + offset; x < 256 + bw; x += bw){
        ctx.strokeRect(x, y, bw, bh);
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.4, 1.4);
    return tex;
  }
  function makeRoofTexture(){
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#2c2e33';
    ctx.fillRect(0,0,128,128);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (var y = 0; y < 128; y += 12){ ctx.fillRect(0, y, 128, 2); }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.6);
    return tex;
  }
  function makeCladdingTexture(){
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#26282d';
    ctx.fillRect(0,0,128,128);
    // vertical board seams
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (var x = 0; x < 128; x += 16){ ctx.fillRect(x, 0, 1.5, 128); }
    // subtle per-board tone variation
    for (var bx = 0; bx < 128; bx += 16){
      var tint = (Math.sin(bx*12.9898) * 43758.5453) % 1;
      tint = (tint + 1) % 1;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.02 + tint*0.035) + ')';
      ctx.fillRect(bx, 0, 16, 128);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (var y = 0; y < 128; y += 42){ ctx.fillRect(0, y, 128, 1); }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  var brickTex = makeBrickTexture();
  var roofTex = makeRoofTexture();
  var claddingTex = makeCladdingTexture();

  var WALL_MAT  = new THREE.MeshStandardMaterial({map: brickTex, roughness:0.92, metalness:0.02});
  var TRIM_MAT  = new THREE.MeshStandardMaterial({color:0xf1ece0, roughness:0.7, metalness:0.02});
  var TRIM_DARK = new THREE.MeshStandardMaterial({color:0x121316, roughness:0.4, metalness:0.25});
  var ROOF_MAT  = new THREE.MeshStandardMaterial({map: roofTex, roughness:0.85, metalness:0.05});
  var DOOR_MAT  = new THREE.MeshStandardMaterial({color:0x2c2320, roughness:0.55, metalness:0.1});
  var GLASS_MAT = new THREE.MeshStandardMaterial({color:0x1b2a33, roughness:0.15, metalness:0.35, emissive:0x0d1a20, emissiveIntensity:0.15});
  function newGlassMat(){ return GLASS_MAT.clone(); } // own instance per pane so panes can be animated independently
  function claddingMat(w, d){
    // own material+texture instance per addon so UV repeat can match its own footprint
    var tex = claddingTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, Math.round((w+d))), 1);
    return new THREE.MeshStandardMaterial({map: tex, roughness:0.55, metalness:0.1});
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
  function addWindow(x, y, z, w, h, axis, sign){
    var group = new THREE.Group();
    var o = 0.03 * sign, o2 = 0.055 * sign; // o2 sits proud of the glass so the mullion never z-fights it
    var glass;
    if (axis === 'z'){
      group.add(boxMesh(x-0.06, y-0.06, z-0.03*sign, w+0.12, h+0.12, 0.06, TRIM_MAT));
      glass = boxMesh(x, y, z+o, w, h, 0.03, newGlassMat());
      group.add(glass);
      group.add(boxMesh(x+w/2-0.03, y, z+o2, 0.06, h, 0.02, TRIM_MAT));
    } else {
      group.add(boxMesh(x-0.03, y-0.06, z-0.06, 0.06, h+0.12, w+0.12, TRIM_MAT));
      glass = boxMesh(x+o, y, z, 0.03, h, w, newGlassMat());
      group.add(glass);
      group.add(boxMesh(x+o2, y, z+w/2-0.03, 0.02, h, 0.06, TRIM_MAT));
    }
    modelRoot.add(group);
    group.userData.glass = glass;
    return group;
  }

  // ---------- main house: walls, roof, chimney, door, windows ----------
  var wallW = 6, wallH = 3, wallD = 5;
  var roofRidgeH = 1.9, roofOv = 0.35;
  modelRoot.add(boxMesh(0, 0, 0, wallW, wallH, wallD, WALL_MAT));
  modelRoot.add(gableRoof(0, wallH, 0, wallW, wallD, roofRidgeH, roofOv, ROOF_MAT));

  modelRoot.add(boxMesh(4.5, wallH+0.6, 1.6, 0.4, 1.6, 0.4, TRIM_MAT, {roughness:0.85}));
  modelRoot.add(boxMesh(4.4, wallH+2.05, 1.5, 0.6, 0.12, 0.6, 0x18191c, {roughness:0.6}));

  modelRoot.add(boxMesh(2.42, 0, -0.02, 1.06, 2.02, 0.03, TRIM_MAT));
  modelRoot.add(boxMesh(2.5, 0, -0.07, 0.9, 1.9, 0.05, DOOR_MAT));
  modelRoot.add(boxMesh(2.3, 0, -0.42, 1.3, 0.07, 0.42, 0xcfc9bd, {roughness:0.9}));

  var frontWindowA = addWindow(0.55, 1.65, 0, 0.85, 1.1, 'z', -1);
  var frontWindowB = addWindow(4.6, 1.65, 0, 0.85, 1.1, 'z', -1);
  var sideWindowA  = addWindow(0, 1.7, 1.55, 0.85, 1.05, 'x', -1);
  var sideWindowB  = addWindow(0, 1.7, 3.25, 0.85, 1.05, 'x', -1);
  var kitchenGlass = frontWindowA.userData.glass; // the glass pane, toggled by kitchen/bath add-on
  // the rest of the main-house windows glow warm at night (kitchenGlass is handled separately above)
  var nightWindowMats = [frontWindowB, sideWindowA, sideWindowB].map(function(w){ return w.userData.glass.material; });

  // add-on groups (modern clad extensions with a glazed face, fascia cap and plinth, contrasting the brick house)
  var addonMeshes = {};
  function makeAddon(key, x0,hBase,dBase, w,h,d, glassAxis, glassSign){
    var group = new THREE.Group();
    var solidGroup = new THREE.Group();
    solidGroup.add(boxMesh(x0,hBase,dBase, w,h,d, claddingMat(w,d), {}));

    // dark fascia cap along the flat roofline — reads as a roof edge without modelling one
    solidGroup.add(boxMesh(x0-0.05, hBase+h, dBase-0.05, w+0.1, 0.08, d+0.1, TRIM_DARK));
    // plinth at the base, grounds the volume (sits proud of grade so its top face never coplanar-fights the ground)
    solidGroup.add(boxMesh(x0-0.03, hBase, dBase-0.03, w+0.06, 0.05, d+0.06, TRIM_DARK));

    var glowMats = []; // only glazing reacts to the finish-tier glow, not cladding/trim/solar
    var gw = Math.min(w,d) * 0.72;
    if (gw > 0.35){
      var glassH = h*0.6, glassY = hBase+0.2, glassMesh;
      if (glassAxis === 'x'){
        var gx = glassSign > 0 ? x0+w : x0;
        var gz0 = dBase+(d-gw)/2;
        glassMesh = boxMesh(gx-0.015, glassY, gz0, 0.03, glassH, gw, newGlassMat());
        solidGroup.add(glassMesh);
        solidGroup.add(boxMesh(gx-0.03, glassY+glassH/2-0.03, gz0-0.02, 0.06, 0.06, gw+0.04, TRIM_DARK));
      } else {
        var gz = glassSign > 0 ? dBase+d : dBase;
        var gx0 = x0+(w-gw)/2;
        glassMesh = boxMesh(gx0, glassY, gz-0.015, gw, glassH, 0.03, newGlassMat());
        solidGroup.add(glassMesh);
        solidGroup.add(boxMesh(gx0-0.02, glassY+glassH/2-0.03, gz-0.03, gw+0.04, 0.06, 0.06, TRIM_DARK));
      }
      glowMats.push(glassMesh.material);
    }
    solidGroup.scale.set(0.001,0.001,0.001);
    var ghost = ghostBox(x0,hBase,dBase, w,h,d);
    group.add(ghost);
    group.add(solidGroup);
    modelRoot.add(group);
    addonMeshes[key] = {solid:solidGroup, ghost:ghost, targetScale:0.001, currentScale:0.001, glow:glowMats};
  }
  makeAddon('extension',   1,0,5,      4,2.2,2.5, 'z', 1);
  makeAddon('side_return', -1.8,0,1,   1.8,2.4,3, 'x', -1);
  makeAddon('loft',        1.6,3.5,1.2, 2.2,1.3,2.2, 'z', 1);
  makeAddon('garden_room', 8,0,1,      3,2.2,3, 'x', 1);

  function ghostBox(x0, hBase, dBase, w, h, d){
    var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
    var mat = new THREE.LineDashedMaterial({color:0xf4f1ea, dashSize:0.14, gapSize:0.1, transparent:true, opacity:0.4});
    var lines = new THREE.LineSegments(geo, mat);
    lines.position.set(x0 + w/2, hBase + h/2, dBase + d/2);
    lines.computeLineDistances();
    return lines;
  }

  // solar — panels mounted flush to the front roof slope, tilted to match its pitch
  (function(){
    function centeredGhost(cx,cy,cz,w,h,d){
      var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
      var mat = new THREE.LineDashedMaterial({color:0xf4f1ea, dashSize:0.14, gapSize:0.1, transparent:true, opacity:0.4});
      var lines = new THREE.LineSegments(geo, mat);
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
    var panelW = 1.6, panelD = 1.35, slopeZ = 1.5, outward = 0.045;
    var frameMat = new THREE.MeshStandardMaterial({color:0x1c1e21, roughness:0.5, metalness:0.3});
    [0.3,2.2,4.1].forEach(function(sx){
      var cx = sx + panelW/2;
      var panelMat = new THREE.MeshStandardMaterial({color:0x141a22, roughness:0.22, metalness:0.55});
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
    solidGroup.scale.set(0.001,0.001,0.001);
    mount.add(ghostGroup);
    mount.add(solidGroup);
    modelRoot.add(mount);
    addonMeshes['solar'] = {solid:solidGroup, ghost:ghostGroup, targetScale:0.001, currentScale:0.001, glow:[]};
  })();

  // center the model root so it orbits nicely
  modelRoot.position.set(-4.6, 0, -2.6);

  // ---------- camera orbit (custom, no extra library) ----------
  var orbit = {
    theta: Math.PI*1.22,  // azimuth — starts facing the door/window side
    phi: 1.0,             // polar angle
    radius: 16,
    target: new THREE.Vector3(0, 1.4, 0)
  };
  var dragging = false, lastX = 0, lastY = 0;
  var idleTimer = null, autoRotate = true;

  function updateCamera(){
    var p = orbit.phi;
    camera.position.set(
      orbit.target.x + orbit.radius * Math.sin(p) * Math.cos(orbit.theta),
      orbit.target.y + orbit.radius * Math.cos(p),
      orbit.target.z + orbit.radius * Math.sin(p) * Math.sin(orbit.theta)
    );
    camera.lookAt(orbit.target);
  }

  function onPointerDown(e){
    dragging = true; autoRotate = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    clearTimeout(idleTimer);
  }
  function onPointerMove(e){
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    orbit.theta -= dx * 0.0065;
    orbit.phi = Math.min(1.45, Math.max(0.5, orbit.phi - dy * 0.0065));
    updateCamera();
  }
  function onPointerUp(){
    dragging = false;
    idleTimer = setTimeout(function(){ autoRotate = true; }, 2600);
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // ---------- controls UI ----------
  var chipWrap = root.querySelector('#addonChips');
  var sizeSeg = root.querySelector('#sizeSeg');
  var finishSeg = root.querySelector('#finishSeg');
  var daynightToggle = root.querySelector('#daynightToggle');
  var ctaBtn = root.querySelector('#ctaBtn');
  var ctaConfirm = root.querySelector('#ctaConfirm');
  var priceOut = root.querySelector('#priceOut');
  var weeksOut = root.querySelector('#weeksOut');
  var costBar = root.querySelector('#costBar');
  var costLegend = root.querySelector('#costLegend');

  // Strict Mode remounts the effect on the same DOM: clear leftovers first.
  if (chipWrap) chipWrap.replaceChildren();
  if (costBar) costBar.replaceChildren();
  if (costLegend) costLegend.replaceChildren();

  var chipHandlers = [];
  ADDONS.forEach(function(a){
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ie-chip';
    chip.setAttribute('aria-pressed','false');
    chip.dataset.key = a.key;
    chip.innerHTML = '<span class="ie-dot"></span><span>'+a.label+'</span><span class="ie-price-tag">+£'+a.price.toLocaleString('en-GB')+'</span>';
    function onChipClick(){
      state.addons[a.key] = !state.addons[a.key];
      render();
    }
    chip.addEventListener('click', onChipClick);
    chipHandlers.push({ chip: chip, handler: onChipClick });
    chipWrap.appendChild(chip);
  });

  function onSizeClick(e){
    var btn = e.target.closest('button[data-size]');
    if(!btn) return;
    state.size = btn.dataset.size;
    render();
  }
  function onFinishClick(e){
    var btn = e.target.closest('button[data-finish]');
    if(!btn) return;
    state.finish = btn.dataset.finish;
    render();
  }
  function onCtaClick(){
    ctaConfirm.classList.add('ie-show');
    window.clearTimeout(ctaBtn._t);
    ctaBtn._t = window.setTimeout(function(){ ctaConfirm.classList.remove('ie-show'); }, 3200);
  }
  function onDayNightClick(e){
    var btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    setDayNight(btn.dataset.mode);
    Array.prototype.forEach.call(daynightToggle.children, function(b){
      b.setAttribute('aria-pressed', b.dataset.mode === btn.dataset.mode ? 'true' : 'false');
    });
  }

  sizeSeg.addEventListener('click', onSizeClick);
  finishSeg.addEventListener('click', onFinishClick);
  ctaBtn.addEventListener('click', onCtaClick);
  daynightToggle.addEventListener('click', onDayNightClick);

  var sizeTargetScale = 1, sizeCurrentScale = 1;
  var FINISH_EMISSIVE = {simple:0, quality:0.18, highend:0.4};
  var finishTarget = FINISH_EMISSIVE.quality;

  function render(){
    Array.prototype.forEach.call(chipWrap.children, function(chip){
      chip.setAttribute('aria-pressed', state.addons[chip.dataset.key] ? 'true' : 'false');
    });
    Array.prototype.forEach.call(sizeSeg.children, function(btn){
      btn.setAttribute('aria-pressed', btn.dataset.size===state.size ? 'true' : 'false');
    });
    Array.prototype.forEach.call(finishSeg.children, function(btn){
      btn.setAttribute('aria-pressed', btn.dataset.finish===state.finish ? 'true' : 'false');
    });

    Object.keys(addonMeshes).forEach(function(key){
      addonMeshes[key].targetScale = state.addons[key] ? 1 : 0.001;
    });
    sizeTargetScale = SIZE_MULT[state.size];
    finishTarget = FINISH_EMISSIVE[state.finish];

    var selected = ADDONS.filter(function(a){ return state.addons[a.key]; });
    var basePrice = selected.reduce(function(s,a){ return s + a.price; }, 0);
    var total = Math.round(basePrice * SIZE_MULT[state.size] * FINISH_MULT[state.finish] / 500) * 500;

    if (selected.length === 0){
      priceOut.textContent = "Select what you're building";
      priceOut.classList.add('ie-muted');
      weeksOut.textContent = '-';
    } else {
      priceOut.classList.remove('ie-muted');
      priceOut.textContent = '£' + total.toLocaleString('en-GB');
      var baseWeeks = 3 + selected.reduce(function(s,a){ return s + a.weeks; }, 0);
      var weeks = Math.round(baseWeeks * SIZE_MULT[state.size]);
      weeksOut.textContent = weeks + ' to ' + (weeks + 2) + ' weeks';
    }

    // cost breakdown bar - proportional segment per selected add-on
    costBar.innerHTML = '';
    costLegend.innerHTML = '';
    if (selected.length){
      selected.forEach(function(a){
        var pct = (a.price / basePrice) * 100;
        var seg = document.createElement('span');
        seg.style.width = pct + '%';
        seg.style.background = a.color;
        costBar.appendChild(seg);

        var item = document.createElement('span');
        item.className = 'ie-item';
        item.innerHTML = '<span class="ie-swatch" style="background:'+a.color+'"></span>'+a.label+' &middot; £'+a.price.toLocaleString('en-GB');
        costLegend.appendChild(item);
      });
    }
  }

  // ---------- animation loop ----------
  var clock = new THREE.Clock();
  var raf = 0;
  var disposed = false;
  function tick(){
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    var dt = Math.min(clock.getDelta(), 0.05);

    if (autoRotate && !dragging){
      orbit.theta += dt * 0.12;
      updateCamera();
    }

    Object.keys(addonMeshes).forEach(function(a){
      var rec = addonMeshes[a];
      rec.currentScale += (rec.targetScale - rec.currentScale) * Math.min(1, dt*6);
      var s = Math.max(0.001, rec.currentScale);
      rec.solid.scale.set(s,s,s);
      rec.ghost.visible = rec.currentScale < 0.98;
      if (rec.ghost.material) rec.ghost.material.opacity = 0.4 * (1 - Math.min(1, rec.currentScale));
      if (rec.ghost.isGroup) {
        rec.ghost.traverse(function(child){
          if (child.material && child.material.opacity != null) {
            child.material.opacity = 0.4 * (1 - Math.min(1, rec.currentScale));
          }
        });
      }
    });

    sizeCurrentScale += (sizeTargetScale - sizeCurrentScale) * Math.min(1, dt*5);
    modelRoot.scale.set(sizeCurrentScale, sizeCurrentScale, sizeCurrentScale);

    nightGlow.value += (nightGlow.target - nightGlow.value) * Math.min(1, dt*3);
    var isNight = nightGlow.value > 0.5;
    var kitchenTarget = isNight ? (0.55 + nightGlow.value*0.35) : (state.addons.kitchen_bath ? 0.9 : 0.15);
    kitchenGlass.material.emissive.setHex(isNight ? 0xffcf8a : 0x89cff0);
    kitchenGlass.material.emissiveIntensity += (kitchenTarget - kitchenGlass.material.emissiveIntensity) * Math.min(1, dt*6);

    nightWindowMats.forEach(function(m){
      m.emissive.setHex(0xffcf8a);
      m.emissiveIntensity += (nightGlow.value*0.7 - m.emissiveIntensity) * Math.min(1, dt*4);
    });

    Object.keys(addonMeshes).forEach(function(a){
      var rec = addonMeshes[a];
      (rec.glow || []).forEach(function(m){
        if (!m) return;
        m.emissive.setHex(0x89cff0);
        m.emissiveIntensity += (finishTarget - m.emissiveIntensity) * Math.min(1, dt*4);
      });
    });

    renderer.render(scene, camera);
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
  render();
  raf = requestAnimationFrame(tick);
  var resizeTimer = setTimeout(resize, 50);

  return function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    clearTimeout(idleTimer);
    if (ctaBtn && ctaBtn._t) window.clearTimeout(ctaBtn._t);

    window.removeEventListener('resize', resize);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('wheel', onWheel);

    sizeSeg.removeEventListener('click', onSizeClick);
    finishSeg.removeEventListener('click', onFinishClick);
    ctaBtn.removeEventListener('click', onCtaClick);
    daynightToggle.removeEventListener('click', onDayNightClick);
    chipHandlers.forEach(function(entry){
      entry.chip.removeEventListener('click', entry.handler);
    });
    if (chipWrap) chipWrap.replaceChildren();
    if (costBar) costBar.replaceChildren();
    if (costLegend) costLegend.replaceChildren();
    if (stageHost) stageHost.replaceChildren();

    disposeObject3D(scene);
    renderer.dispose();
  };
}
