import * as THREE from 'three';
import './style.css';

const root = document.querySelector('#game-root');
const isMobile = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const cores = navigator.hardwareConcurrency || 4;
const lowPower = isMobile || cores <= 4 || (navigator.deviceMemory || 4) <= 4;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb1b3);
scene.fog = new THREE.Fog(0x9bb1b3, 34, 105);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'low-power', alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !lowPower;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe2f1f1, 0x59645b, 2.1));
const sun = new THREE.DirectionalLight(0xffe6bd, 2.1);
sun.position.set(-18, 28, 14);
sun.castShadow = !lowPower;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mat = (color, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function proceduralTexture(base, accent, kind='sand') {
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
 let seed=kind==='stone'?91:37;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(kind==='stone'){
  for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=48){const ox=(Math.floor(y/32)%2)*24;ctx.fillStyle=rand()>.5?base:accent;ctx.globalAlpha=.22+rand()*.18;ctx.fillRect(x+ox+1,y+1,45,29);ctx.globalAlpha=1;ctx.strokeStyle='#171b1a';ctx.globalAlpha=.3;ctx.strokeRect(x+ox,y,47,31);ctx.globalAlpha=1;}
 } else {
  for(let i=0;i<1800;i++){ctx.globalAlpha=.05+rand()*.12;ctx.fillStyle=rand()>.5?accent:'#25271e';const s=1+rand()*3;ctx.fillRect(rand()*256,rand()*256,s,s);}
  ctx.globalAlpha=1;
 }
 const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);return tex;
}
const sandTexture=proceduralTexture('#88816b','#c5b58c');
sandTexture.repeat.set(12,12);
const stoneTexture=proceduralTexture('#77796f','#b0a58a','stone');stoneTexture.repeat.set(2,1);
const floorMat = mat(0xffffff);floorMat.map=sandTexture;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const arena = new THREE.Group();
scene.add(arena);
const wallMat = mat(0x777c78);
const trimMat = mat(0xc1a66f, .7);
function block(x,y,z,sx,sy,sz,material,group=arena) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.position.set(x,y,z); mesh.castShadow = !lowPower; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
// Arena compacta: ruínas baixas, coberturas e alvos de treino.
for (let i=0;i<24;i++) {
  const a = i / 24 * Math.PI * 2, r = 24;
  block(Math.cos(a)*r, 2.1, Math.sin(a)*r, 7, 4.2, 1.5, wallMat).rotation.y = -a;
}
for (const [x,z] of [[-12,-10],[12,-10],[-12,10],[12,10],[0,-17],[0,17]]) {
  block(x,1.05,z,4.2,2.1,2.2,wallMat);
  block(x,2.2,z,4.4,.18,2.4,trimMat);
}
for (let i=0;i<12;i++) {
  const a=i/12*Math.PI*2;
  const pillar= new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,3.5,7),trimMat);
  pillar.position.set(Math.cos(a)*19,1.75,Math.sin(a)*19); pillar.castShadow=!lowPower; arena.add(pillar);
}
const grid = new THREE.GridHelper(48,24,0x6e766d,0x898b7e);
grid.position.y=.012; scene.add(grid);
const centerRing = new THREE.Mesh(new THREE.RingGeometry(5.8,6,.6,64), new THREE.MeshBasicMaterial({color:0xd8bd7e,side:THREE.DoubleSide}));
centerRing.rotation.x=-Math.PI/2; centerRing.position.y=.025; scene.add(centerRing);

// Player model
const player = new THREE.Group(); scene.add(player);
const bodyMat=mat(0x273c49), vestMat=mat(0x596c58), skinMat=mat(0xc99772), darkMat=mat(0x18232a), helmetMat=mat(0x344b55,.45,.25);
const skinPalette=[{name:'OPERADOR TÁTICO',vest:0x596c58,body:0x273c49},{name:'ÁRTICO',vest:0x547b91,body:0x263e52},{name:'INFERNO',vest:0x8d4239,body:0x42252a},{name:'SOMBRA',vest:0x343b43,body:0x171d25}];
let equippedSkin=Number(localStorage.getItem('empire-skin')||0);
function applySkin(index){equippedSkin=(index+skinPalette.length)%skinPalette.length;const s=skinPalette[equippedSkin];vestMat.color.setHex(s.vest);bodyMat.color.setHex(s.body);localStorage.setItem('empire-skin',String(equippedSkin));const name=document.getElementById('skin-name');if(name)name.textContent=s.name;document.querySelectorAll('.skin-option').forEach((b,i)=>b.classList.toggle('selected',i===equippedSkin));}

const body = new THREE.Mesh(new THREE.CapsuleGeometry(.43,.72,4,8),vestMat); body.position.y=1.35; body.castShadow=!lowPower; player.add(body);
const chest = new THREE.Mesh(new THREE.BoxGeometry(.78,.58,.48),bodyMat); chest.position.set(0,1.48,0); player.add(chest);
const head = new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),skinMat); head.position.y=2.05; player.add(head);
const helmet = new THREE.Mesh(new THREE.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI*.55),helmetMat); helmet.position.y=2.1; player.add(helmet);
const legGeo=new THREE.CapsuleGeometry(.17,.58,3,6);
for(const x of [-.22,.22]) { const leg=new THREE.Mesh(legGeo,darkMat); leg.position.set(x,.48,0); player.add(leg); }
const armGeo=new THREE.CapsuleGeometry(.13,.55,3,6);
for(const x of [-.53,.53]) { const arm=new THREE.Mesh(armGeo,vestMat); arm.position.set(x,1.42,0); arm.rotation.z=x*.35; player.add(arm); }
const gun = new THREE.Group(); player.add(gun);
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(.16,.17,.82),darkMat); gunBody.position.set(.42,1.46,-.52); gun.add(gunBody);
const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.46,8),helmetMat); gunBarrel.rotation.x=Math.PI/2; gunBarrel.position.set(.42,1.47,-1.12); gun.add(gunBarrel);
player.position.set(0,0,9);

const weapons=[
 {name:'RIFLE',type:'AR · AUTOMÁTICO',mag:30,reserve:120,capacity:30,damage:24,head:96,rate:125,spread:.018},
 {name:'PISTOLA',type:'PISTOLA · SEMI',mag:12,reserve:60,capacity:12,damage:32,head:128,rate:280,spread:.012},
 {name:'SHOTGUN',type:'12G · CURTO ALCANCE',mag:6,reserve:36,capacity:6,damage:18,head:54,rate:650,spread:.075}
];
let weaponIndex=0, ammo=30, reserve=120, hp=200, armor=100, kills=0, elapsed=0, lastShot=0, isPaused=false, isAiming=false, isCrouched=false, isMoving=false;
const keys={};
const bots=[];
const raycaster=new THREE.Raycaster();
const clock=new THREE.Clock();
let yaw=0, pitch=-.12, verticalVelocity=0, onGround=true, reloadUntil=0;
const tempV=new THREE.Vector3();

function makeBot(x,z,index){
 const group=new THREE.Group(); scene.add(group); group.position.set(x,0,z);
 const botBody=new THREE.Mesh(new THREE.CapsuleGeometry(.4,.7,4,8),mat(index%2?0x8b6548:0x576c74)); botBody.position.y=1.32; botBody.castShadow=!lowPower; group.add(botBody);
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.72,.62,.44),mat(0x35454b)); torso.position.y=1.42; group.add(torso);
 const botHead=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),skinMat); botHead.position.y=2.04; group.add(botHead);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8,0,Math.PI*2,0,Math.PI*.55),mat(0x283e48)); cap.position.y=2.1; group.add(cap);
 const plate=new THREE.Mesh(new THREE.BoxGeometry(1.05,.09,.08),mat(0x5a342a)); plate.position.set(0,2.42,0); group.add(plate);
 group.userData={hp:100,alive:true,parts:{head:[botHead,cap],chest:torso},index,baseX:x,baseZ:z,phase:index*1.7};
 bots.push(group);
}
[[-8,-14],[8,-14],[-17,0],[17,0],[-8,15],[8,15]].forEach((p,i)=>makeBot(p[0],p[1],i));

const $=id=>document.getElementById(id);
const ui={
 hp:$('hp-text'),hpFill:$('hp-fill'),armor:$('armor-text'),ammo:$('ammo'),reserve:$('reserve'),
 weapon:$('weapon-name'),type:$('weapon-type'),kills:$('kills'),targets:$('target-count'),timer:$('timer'),
 hit:$('hitmarker'),damage:$('damage-layer'),toast:$('toast')
};
function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),1500);}
function refreshHud(){
 ui.hp.textContent=hp+'/200';ui.hpFill.style.width=(hp/200*100)+'%';ui.armor.textContent=armor;
 ui.ammo.textContent=ammo;ui.reserve.textContent=reserve;ui.weapon.textContent=weapons[weaponIndex].name;ui.type.textContent=weapons[weaponIndex].type;
 ui.kills.textContent=String(kills).padStart(2,'0');const mk=document.getElementById('menu-kills');if(mk)mk.textContent=String(kills).padStart(2,'0');ui.targets.textContent=String(bots.filter(b=>b.userData.alive).length).padStart(2,'0');
}
function showDamage(value,headshot,point){
 const el=document.createElement('div');el.className='damage-number'+(headshot?' headshot':'');el.textContent=(headshot?'✦ ':'')+value+(headshot?' CAPA':'');
 const projected=point.clone().project(camera);
 el.style.left=((projected.x*.5+.5)*innerWidth)+'px';el.style.top=((-projected.y*.5+.5)*innerHeight)+'px';
 ui.damage.appendChild(el);setTimeout(()=>el.remove(),900);
}
function switchWeapon(index){weaponIndex=(index+weapons.length)%weapons.length;ammo=weapons[weaponIndex].mag;reserve=weapons[weaponIndex].reserve;refreshHud();toast('Equipado: '+weapons[weaponIndex].name);}
function reload(){
 const w=weapons[weaponIndex];if(ammo>=w.capacity||reserve<=0||reloadUntil>performance.now())return;
 reloadUntil=performance.now()+1250;toast('Recarregando...');
 setTimeout(()=>{if(isPaused)return;const take=Math.min(w.capacity-ammo,reserve);ammo+=take;reserve-=take;reloadUntil=0;refreshHud();},1250);
}
function shoot(){
 const now=performance.now(),w=weapons[weaponIndex];
 if(isPaused||now-lastShot<w.rate||now<reloadUntil)return;
 if(ammo<=0){toast('Sem munição — recarregue');return;}
 lastShot=now;ammo--;refreshHud();
 const origin=camera.position.clone();const dir=new THREE.Vector3();camera.getWorldDirection(dir);
 const spread=isAiming?w.spread*.45:w.spread;
 dir.x+=(Math.random()-.5)*spread;dir.y+=(Math.random()-.5)*spread;dir.z+=(Math.random()-.5)*spread;dir.normalize();
 raycaster.set(origin,dir);raycaster.far=55;
 const targets=[];
 for(const bot of bots)if(bot.userData.alive)targets.push(...bot.children);
 const hits=raycaster.intersectObjects(targets,false);
 if(hits.length){
  const hit=hits[0],bot=bots.find(b=>b.children.includes(hit.object));
  if(bot){
   const isHead=bot.userData.parts.head.includes(hit.object);
   const damage=isHead?w.head:w.damage;
   bot.userData.hp-=damage;
   const worldPoint=hit.point.clone();showDamage(damage,isHead,worldPoint);
   ui.hit.classList.remove('show');void ui.hit.offsetWidth;ui.hit.classList.add('show');
   if(bot.userData.hp<=0){bot.userData.alive=false;bot.visible=false;kills++;toast(isHead?'CAPA! ALVO ELIMINADO':'ALVO ELIMINADO');}
  }
 } else {
  const wallHits=raycaster.intersectObjects(arena.children,false);
 }
}
function resetTraining(){
 for(const bot of bots){bot.userData.hp=100;bot.userData.alive=true;bot.visible=true;bot.position.set(bot.userData.baseX,0,bot.userData.baseZ);}
 player.position.set(0,0,9);hp=200;armor=100;kills=0;elapsed=0;switchWeapon(0);isPaused=false;$('pause-screen').classList.add('hidden');refreshHud();toast('Treinamento reiniciado');
}

// Camera isometric TPS, kept behind player.
function updateCamera(){
 const distance=isAiming?4.3:6.7;
 const target=new THREE.Vector3(player.position.x,player.position.y+(isCrouched?1.35:1.65),player.position.z);
 const horizontal=Math.cos(pitch)*distance;
 camera.position.set(target.x+Math.sin(yaw)*horizontal,target.y+Math.sin(-pitch)*distance+1.05,target.z+Math.cos(yaw)*horizontal);
 camera.lookAt(target.x-Math.sin(yaw)*1.8,target.y+.12,target.z-Math.cos(yaw)*1.8);
}
function movePlayer(dt){
 const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joyY;
 const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joyX;
 const len=Math.hypot(forward,side);isMoving=len>.08;
 if(len>.08){
  const f=forward/Math.max(1,len),s=side/Math.max(1,len);
  const speed=(keys.ShiftLeft?8.5:5.2)*(isCrouched?.48:1);
  const dx=(Math.sin(yaw)*f+Math.cos(yaw)*s)*speed*dt;
  const dz=(-Math.cos(yaw)*f+Math.sin(yaw)*s)*speed*dt;
  player.position.x=THREE.MathUtils.clamp(player.position.x+dx,-21,21);
  player.position.z=THREE.MathUtils.clamp(player.position.z+dz,-21,21);
  player.rotation.y=yaw+Math.atan2(s,f);
 }
 verticalVelocity-=19*dt;player.position.y=Math.max(0,player.position.y+verticalVelocity*dt);
 if(player.position.y===0){verticalVelocity=0;onGround=true;}
}
function animateBots(t){
 for(const bot of bots){if(!bot.userData.alive)continue;const p=bot.userData.phase;bot.position.x=bot.userData.baseX+Math.sin(t*.55+p)*.55;bot.position.z=bot.userData.baseZ+Math.cos(t*.42+p)*.35;bot.rotation.y=Math.atan2(player.position.x-bot.position.x,player.position.z-bot.position.z);}
}
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 if(!isPaused){
  elapsed+=dt;const mins=String(Math.floor(elapsed/60)).padStart(2,'0'),secs=String(Math.floor(elapsed%60)).padStart(2,'0');ui.timer.textContent=mins+':'+secs;
  movePlayer(dt);animateBots(elapsed);
 }
 updateCamera();renderer.render(scene,camera);
}
let joyX=0,joyY=0,joyPointer=null;
const joystick=$('joystick'),knob=$('joy-knob');
function setJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}joyX=dx/max;joyY=dy/max;knob.style.transform='translate('+dx+'px,'+dy+'px)';}
joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);setJoy(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)setJoy(e);});
function endJoy(){joyPointer=null;joyX=joyY=0;knob.style.transform='translate(0,0)';}
joystick.addEventListener('pointerup',endJoy);joystick.addEventListener('pointercancel',endJoy);

let lookPointer=null,lastLookX=0,lastLookY=0;
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button===0){if(!isMobile)shoot();return;}
 if(isMobile&&e.clientX>innerWidth*.35){lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);}
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!isMobile&&!isPaused&&document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0024;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0018,-.55,.35);}
 if(e.pointerId===lookPointer){yaw-=(e.clientX-lastLookX)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastLookY)*.004,-.55,.35);lastLookX=e.clientX;lastLookY=e.clientY;}
});
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null;});
renderer.domElement.addEventListener('click',()=>{if(!isMobile&&!isPaused)renderer.domElement.requestPointerLock?.();});
$('fire-btn').addEventListener('pointerdown',e=>{e.preventDefault();shoot();});
$('reload-btn').addEventListener('click',reload);
$('weapon-btn').addEventListener('click',()=>switchWeapon(weaponIndex+1));
$('jump-btn').addEventListener('click',()=>{if(onGround&&!isPaused){verticalVelocity=7.2;onGround=false;}});
$('crouch-btn').addEventListener('click',()=>{isCrouched=!isCrouched;$('crouch-btn').classList.toggle('active',isCrouched);});
$('aim-btn').addEventListener('click',()=>{isAiming=!isAiming;$('aim-btn').classList.toggle('active',isAiming);});
$('pause-btn').addEventListener('click',()=>{isPaused=true;$('pause-screen').classList.remove('hidden');});
$('resume-btn').addEventListener('click',()=>{isPaused=false;$('pause-screen').classList.add('hidden');});
$('reset-btn').addEventListener('click',resetTraining);
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'&&onGround){verticalVelocity=7.2;onGround=false;}if(e.code==='KeyR')reload();if(e.code==='Digit1')switchWeapon(0);if(e.code==='Digit2')switchWeapon(1);if(e.code==='Digit3')switchWeapon(2);if(e.code==='Escape'){isPaused=!isPaused;$('pause-screen').classList.toggle('hidden',!isPaused);}});
window.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,lowPower?1:1.5));});
refreshHud();updateCamera();animate();
setTimeout(()=>$('boot-screen').classList.add('gone'),850);
