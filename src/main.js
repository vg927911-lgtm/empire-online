import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const host = document.querySelector('#world');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db8bd);
scene.fog = new THREE.FogExp2(0x9db8bd, 0.009);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 500);
camera.position.set(34, 27, 38);
const isMobile = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 1;
const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4;
const lowPower = isMobile || cores <= 4 || memory <= 4;
const pixelRatioCap = lowPower ? 1 : 1.5;
const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixelRatioCap));
renderer.setClearColor(0x9db8bd, 1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !lowPower;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = lowPower ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 13;
controls.maxDistance = 85;
controls.maxPolarAngle = Math.PI * 0.48;

scene.add(new THREE.HemisphereLight(0xd9edee, 0x52634c, 2));
const sun = new THREE.DirectionalLight(0xffedcf, 3);
sun.position.set(-25, 38, 18);
sun.castShadow = !lowPower;
sun.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
scene.add(sun);

const rand = (a,b) => a + Math.random() * (b-a);
const smooth = (a,b,x) => { const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
function noise(x,z){return Math.sin(x*.21+Math.cos(z*.17))*.8+Math.sin(z*.39-x*.13)*.42+Math.cos((x+z)*.31)*.28;}
function heightAt(x,z){
  const n=noise(x,z);
  const edge=Math.sqrt((x/25)**2+(z/19)**2);
  const mass=1-smooth(.68,1.08,edge+n*.018);
  const hills=Math.max(0,1-Math.sqrt((x+3)**2/210+(z-1)**2/150));
  const ridge=Math.max(0,1-Math.abs(x*.62+z*.28+3)/10);
  return Math.max(-1.8,mass*(1.1+hills*5.5+ridge*2.4+n*.48)-1.35);
}

// Oceano e superfície da ilha
const waterMaterial = lowPower
  ? new THREE.MeshLambertMaterial({ color: 0x397f91 })
  : new THREE.MeshStandardMaterial({ color: 0x397f91, roughness: .32, metalness: .08 });
const water=new THREE.Mesh(new THREE.PlaneGeometry(180,180,1,1),waterMaterial);
water.rotation.x=-Math.PI/2; water.position.y=-.35; water.receiveShadow=!lowPower; scene.add(water);

const divisions=lowPower ? 68 : 120, sizeX=58, sizeZ=46, positions=[], colors=[], indices=[];
const tint=new THREE.Color();
for(let iz=0;iz<=divisions;iz++){
  for(let ix=0;ix<=divisions;ix++){
    const x=(ix/divisions-.5)*sizeX, z=(iz/divisions-.5)*sizeZ, y=heightAt(x,z);
    positions.push(x,y,z);
    if(y<-.1)tint.set(0xb9ad88); else if(y<1.1)tint.set(0x829b62); else if(y<3.5)tint.set(0x648653); else if(y<5.5)tint.set(0x777d68); else tint.set(0xb6b7a8);
    const v=.94+(noise(x*1.7,z*1.7)+1.5)*.035;
    colors.push(tint.r*v,tint.g*v,tint.b*v);
    if(ix<divisions&&iz<divisions){const a=iz*(divisions+1)+ix,b=a+divisions+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
}
const terrainGeometry=new THREE.BufferGeometry();
terrainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
terrainGeometry.setIndex(indices); terrainGeometry.computeVertexNormals();
const terrainMaterial = lowPower
  ? new THREE.MeshLambertMaterial({ vertexColors: true })
  : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
const terrain=new THREE.Mesh(terrainGeometry,terrainMaterial);
terrain.receiveShadow=!lowPower; terrain.castShadow=!lowPower; scene.add(terrain);

// Árvores em instâncias para reduzir o custo de renderização
const trunkGeo=new THREE.CylinderGeometry(.13,.2,1.5,6);
const crownGeo=new THREE.IcosahedronGeometry(1,1);
const treeLimit=lowPower ? 85 : 220;
const trunks=new THREE.InstancedMesh(trunkGeo,new THREE.MeshStandardMaterial({color:0x76523a,roughness:1}),treeLimit);
const crowns=new THREE.InstancedMesh(crownGeo,new THREE.MeshStandardMaterial({color:0x426b45,roughness:1,flatShading:true}),treeLimit);
const dummy=new THREE.Object3D(); let treeCount=0;
for(let i=0;i<2200&&treeCount<treeLimit;i++){
  const x=rand(-23,23),z=rand(-18,18),y=heightAt(x,z);
  if(y<.45||y>4.6||Math.random()<.2)continue;
  const s=rand(.75,1.35);
  dummy.position.set(x,y+.7*s,z); dummy.scale.set(s,s,s); dummy.rotation.y=rand(0,Math.PI*2); dummy.updateMatrix(); trunks.setMatrixAt(treeCount,dummy.matrix);
  dummy.position.y=y+1.75*s; dummy.scale.set(.95*s,rand(1,1.45)*s,.95*s); dummy.updateMatrix(); crowns.setMatrixAt(treeCount,dummy.matrix);
  treeCount++;
}
trunks.count=treeCount; crowns.count=treeCount; trunks.castShadow=!lowPower; crowns.castShadow=!lowPower; scene.add(trunks,crowns);

// Rochas nas regiões elevadas
const rockLimit=lowPower ? 22 : 70;
const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x777d79,roughness:1,flatShading:true}),rockLimit);
let rockCount=0;
for(let i=0;i<600&&rockCount<rockLimit;i++){
  const x=rand(-23,23),z=rand(-18,18),y=heightAt(x,z);
  if(y<1.4||Math.random()<.55)continue;
  dummy.position.set(x,y+.25,z); dummy.scale.set(rand(.25,.8),rand(.2,.65),rand(.25,.75));
  dummy.rotation.set(rand(0,1),rand(0,3),rand(0,1)); dummy.updateMatrix(); rocks.setMatrixAt(rockCount++,dummy.matrix);
}
rocks.count=rockCount; rocks.castShadow=!lowPower; scene.add(rocks);

// Pequenos recifes e ilhotas no horizonte
for(let i=0;i<(lowPower ? 5 : 9);i++){
  const x=rand(-85,85),z=rand(-80,80);
  if(Math.abs(x)<38&&Math.abs(z)<34)continue;
  const island=new THREE.Mesh(new THREE.SphereGeometry(rand(3,7),lowPower ? 10 : 18,lowPower ? 6 : 10),lowPower ? new THREE.MeshLambertMaterial({color:0x718b68}) : new THREE.MeshStandardMaterial({color:0x718b68,roughness:1}));
  island.scale.y=.22; island.position.set(x,-.8,z); scene.add(island);
}

let frameId=0;
function render(){
  frameId=0;
  if(document.hidden) return;
  controls.update();
  renderer.render(scene,camera);
}
function invalidate(){
  if(!document.hidden && frameId===0) frameId=requestAnimationFrame(render);
}
controls.addEventListener('change',invalidate);
function resize(){
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,pixelRatioCap));
  invalidate();
}
addEventListener('resize',resize, { passive: true });
document.addEventListener('visibilitychange', () => {
  if(document.hidden){
    if(frameId) cancelAnimationFrame(frameId);
    frameId=0;
  } else {
    invalidate();
  }
});
invalidate();
setTimeout(()=>loading.classList.add('done'),700);
setTimeout(()=>loading.remove(),1500);
