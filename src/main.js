import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const host = document.querySelector('#world');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db8bd);
scene.fog = new THREE.FogExp2(0x9db8bd, 0.0028);

const isMobile = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 1;
const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4;
const lowPower = isMobile || cores <= 4 || memory <= 4;
const pixelRatioCap = lowPower ? 1 : 1.5;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 700);
camera.position.set(78, 72, 92);

const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelRatioCap));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = lowPower ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 24;
controls.maxDistance = 230;
controls.maxPolarAngle = Math.PI * 0.48;

scene.add(new THREE.HemisphereLight(0xd9edee, 0x52634c, 2.1));
const sun = new THREE.DirectionalLight(0xffedcf, 2.3);
sun.position.set(-70, 110, 55);
scene.add(sun);

const WORLD_SEED = 20261102;
function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
const random = seeded(WORLD_SEED);
const rand = (a, b) => a + random() * (b - a);
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function noise(x, z) {
  return Math.sin(x * .071 + Math.cos(z * .053)) * .48
    + Math.sin(z * .113 - x * .047) * .31
    + Math.cos((x + z) * .089) * .21
    + Math.sin(x * .19 + z * .16) * .09;
}

// Continentes com margens irregulares, baías e penínsulas.
const continents = [
  { x: -62, z: -28, rx: 49, rz: 36, h: 1.0 },
  { x: 12, z: -45, rx: 38, rz: 28, h: .8 },
  { x: 62, z: 16, rx: 43, rz: 34, h: 1.05 },
  { x: -28, z: 48, rx: 34, rz: 25, h: .72 },
  { x: 78, z: -62, rx: 19, rz: 15, h: .6 },
  { x: -103, z: 51, rx: 17, rz: 13, h: .55 }
];
function landField(x, z) {
  let field = -10;
  for (const c of continents) {
    const dx = (x - c.x) / c.rx;
    const dz = (z - c.z) / c.rz;
    const angle = Math.atan2(dz, dx);
    const wobble = noise(x + c.x * .3, z - c.z * .2) * .12
      + Math.sin(angle * 5 + c.x) * .035
      + Math.cos(angle * 3 + c.z) * .025;
    const score = (1 - Math.sqrt(dx * dx + dz * dz) + wobble) * c.h;
    field = Math.max(field, score);
  }
  return field;
}
function terrainAt(x, z) {
  const land = landField(x, z);
  if (land < .025) return -2.8;
  const hills = Math.max(0, noise(x * .85, z * .85));
  const ridge = Math.max(0, Math.sin(x * .035 + z * .022) * Math.cos(z * .04));
  return .25 + smooth(.025, .42, land) * (1.8 + hills * 4.8 + ridge * 3.2);
}
function biomeAt(x, z, elevation) {
  const latitude = Math.abs(z) / 82;
  const moisture = noise(x * .55 + 500, z * .55 - 300);
  if (elevation > 6.1) return 'mountain';
  if (latitude > .82) return 'tundra';
  if (latitude < .22 && moisture < -.22) return 'desert';
  if (moisture > -.05 && latitude < .72) return 'forest';
  return 'grassland';
}
const biomeColors = {
  ocean: new THREE.Color(0x397f91),
  desert: new THREE.Color(0xc5ad78),
  grassland: new THREE.Color(0x8da96c),
  forest: new THREE.Color(0x527d55),
  tundra: new THREE.Color(0x9caeaa),
  mountain: new THREE.Color(0x858b87)
};

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(340, 270),
  lowPower ? new THREE.MeshLambertMaterial({ color: 0x397f91 }) :
    new THREE.MeshStandardMaterial({ color: 0x397f91, roughness: .34, metalness: .06 })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -.12;
scene.add(ocean);

// Malha do planeta: densidade menor no celular.
const segmentsX = lowPower ? 142 : 220;
const segmentsZ = lowPower ? 104 : 164;
const worldWidth = 250;
const worldDepth = 185;
const positions = [];
const colors = [];
const indices = [];
const color = new THREE.Color();
for (let iz = 0; iz <= segmentsZ; iz++) {
  for (let ix = 0; ix <= segmentsX; ix++) {
    const x = (ix / segmentsX - .5) * worldWidth;
    const z = (iz / segmentsZ - .5) * worldDepth;
    const y = terrainAt(x, z);
    const biome = y < 0 ? 'ocean' : biomeAt(x, z, y);
    positions.push(x, y, z);
    color.copy(biomeColors[biome]);
    const variation = .94 + (noise(x * 1.7, z * 1.7) + 1) * .045;
    colors.push(color.r * variation, color.g * variation, color.b * variation);
    if (ix < segmentsX && iz < segmentsZ) {
      const a = iz * (segmentsX + 1) + ix;
      const b = a + segmentsX + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
}
const landGeometry = new THREE.BufferGeometry();
landGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
landGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
landGeometry.setIndex(indices);
landGeometry.computeVertexNormals();
const landMaterial = lowPower
  ? new THREE.MeshLambertMaterial({ vertexColors: true })
  : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
const landMesh = new THREE.Mesh(landGeometry, landMaterial);
scene.add(landMesh);

// Vegetação e depósitos são instâncias para manter poucas chamadas de desenho.
const treeLimit = lowPower ? 280 : 650;
const trunkMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(.16, .23, 1.65, 5),
  new THREE.MeshLambertMaterial({ color: 0x76523a }), treeLimit
);
const crownMesh = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(1, 1),
  new THREE.MeshLambertMaterial({ color: 0x426b45, flatShading: true }), treeLimit
);
const rockLimit = lowPower ? 90 : 190;
const rockMesh = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(1, 1),
  new THREE.MeshLambertMaterial({ color: 0x777d79, flatShading: true }), rockLimit
);
const oreMesh = new THREE.InstancedMesh(
  new THREE.OctahedronGeometry(1, 0),
  new THREE.MeshLambertMaterial({ color: 0x9a8874, flatShading: true }), lowPower ? 34 : 75
);
const dummy = new THREE.Object3D();
let treeCount = 0, rockCount = 0, oreCount = 0;
for (let i = 0; i < (lowPower ? 1800 : 4200); i++) {
  const x = rand(-120, 120), z = rand(-88, 88);
  const y = terrainAt(x, z);
  if (y < .5) continue;
  const biome = biomeAt(x, z, y);
  if (biome === 'forest' && treeCount < treeLimit && random() < .75) {
    const scale = rand(.75, 1.45);
    dummy.position.set(x, y + .72 * scale, z);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.y = rand(0, Math.PI * 2);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(treeCount, dummy.matrix);
    dummy.position.y = y + 1.8 * scale;
    dummy.scale.set(.95 * scale, rand(1, 1.5) * scale, .95 * scale);
    dummy.updateMatrix();
    crownMesh.setMatrixAt(treeCount, dummy.matrix);
    treeCount++;
  } else if ((biome === 'mountain' || biome === 'tundra') && rockCount < rockLimit && random() < .28) {
    dummy.position.set(x, y + .25, z);
    dummy.scale.set(rand(.3, .9), rand(.25, .7), rand(.3, .8));
    dummy.rotation.set(rand(0, 1), rand(0, 3), rand(0, 1));
    dummy.updateMatrix();
    rockMesh.setMatrixAt(rockCount++, dummy.matrix);
  } else if (biome === 'mountain' && oreCount < oreMesh.count && random() < .13) {
    dummy.position.set(x, y + .5, z);
    dummy.scale.set(.45, rand(.55, 1.1), .45);
    dummy.rotation.y = rand(0, 3);
    dummy.updateMatrix();
    oreMesh.setMatrixAt(oreCount++, dummy.matrix);
  }
}
trunkMesh.count = treeCount;
crownMesh.count = treeCount;
rockMesh.count = rockCount;
oreMesh.count = oreCount;
scene.add(trunkMesh, crownMesh, rockMesh, oreMesh);

const seedLabel = document.querySelector('#world-seed');
if (seedLabel) seedLabel.textContent = WORLD_SEED.toString();
const biomeLabel = document.querySelector('#world-biomes');
if (biomeLabel) biomeLabel.textContent = '6 continentes · 5 biomas';
const resourceLabel = document.querySelector('#world-resources');
if (resourceLabel) resourceLabel.textContent = `${treeCount} árvores · ${rockCount} rochas · ${oreCount} minérios`;

let frameId = 0;
function render() {
  frameId = 0;
  if (document.hidden) return;
  controls.update();
  renderer.render(scene, camera);
}
function invalidate() {
  if (!document.hidden && frameId === 0) frameId = requestAnimationFrame(render);
}
controls.addEventListener('change', invalidate);
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelRatioCap));
  invalidate();
}
addEventListener('resize', resize, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  } else invalidate();
});
invalidate();


const authScreen = document.querySelector('#auth-screen');
const authForm = document.querySelector('#auth-form');
const authMessage = document.querySelector('#auth-message');
const authSubmit = document.querySelector('#auth-submit');
const loadingDetail = document.querySelector('#loading-detail');
const VISITOR_KEY = 'empire-online-visitor';
let authMode = 'login';

document.querySelectorAll('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
  authMode = tab.dataset.mode;
  document.querySelectorAll('.auth-tab').forEach(item => item.classList.toggle('active', item === tab));
  authSubmit.innerHTML = authMode === 'login' ? 'ENTRAR NO JOGO <span>↗</span>' : 'CRIAR MINHA CONTA <span>↗</span>';
  document.querySelector('#password').autocomplete = authMode === 'login' ? 'current-password' : 'new-password';
  authMessage.textContent = authMode === 'login' ? 'Entre para continuar sua jornada.' : 'Crie seu acesso para guardar sua civilização.';
}));

authForm.addEventListener('submit', event => {
  event.preventDefault();
  authMessage.textContent = 'O login real ainda será conectado ao servidor. Use o acesso de visitante para testar esta versão.';
});

function enterWorld() {
  loadingDetail.textContent = 'Carregando terreno, biomas e recursos...';
  loading.classList.remove('hidden', 'fade');
  setTimeout(() => {
    authScreen.classList.add('hidden');
    loading.classList.add('fade');
    setTimeout(() => loading.classList.add('hidden'), 600);
  }, 1500);
}

document.querySelector('#guest-entry').addEventListener('click', () => {
  try { localStorage.setItem(VISITOR_KEY, '1'); } catch {}
  enterWorld();
});

const alreadyEntered = (() => {
  try { return localStorage.getItem(VISITOR_KEY) === '1'; } catch { return false; }
})();
setTimeout(() => {
  loading.classList.add('fade');
  setTimeout(() => {
    loading.classList.add('hidden');
    if (!alreadyEntered) authScreen.classList.remove('hidden');
  }, 550);
}, 1600);
