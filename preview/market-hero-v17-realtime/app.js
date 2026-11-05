import * as THREE from 'three';
import {MARKET} from './scene.js';

const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const clamp=n=>Math.max(0,Math.min(1,n)),ease=(a,b,p)=>{const k=clamp((p-a)/(b-a));return k*k*(3-2*k)},lerp=(a,b,t)=>a+(b-a)*t;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const stage=$('.stage'),journey=$('.journey'),canvas=$('#gl'),status=$('#film-state'),search=$('.search-wrap');
const controls=all('[data-chapter]'),chapter=$('#chapter-heading'),subheading=$('#chapter-subheading'),chapterIndex=$('#chapter-number');
const roles=[['SHOPPER','Find your next favourite place.'],['TRADER','Your next pitch starts here.'],['ORGANISER','Make your market the destination.']];
const state={desired:0,shown:0,role:0,ready:false,frame:0,errors:0,manualRole:null,reduced:motionQuery.matches,quality:'balanced'};
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf2e4d0);scene.fog=new THREE.FogExp2(0xf0ddc2,.0035);scene.add(MARKET.group);
const cam=new THREE.PerspectiveCamera(37,1,.15,130);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.setClearColor(0xe9dfcc,1);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const hemi=new THREE.HemisphereLight(0xe6eefe,0xe3b98f,1.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdb9d,2.65);sun.position.set(-10,19,13);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.near=.5;sun.shadow.camera.far=80;sun.shadow.bias=-.00013;sun.shadow.normalBias=.045;sun.shadow.radius=3;scene.add(sun,sun.target);
sun.target.position.set(0,0,0);
const fill=new THREE.DirectionalLight(0xe4ebff,.55);fill.position.set(13,9,-11);scene.add(fill);
const spot=new THREE.PointLight(0xffc087,10,24,2);spot.position.set(7,9,6);scene.add(spot);
const pointer={x:0,y:0};addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2},{passive:true});
const basePoints=[
 {p:[10.5,7.2,17.4],t:[-1.0,1.8,1.8]},
 {p:[1.4,3.3,11.6],t:[5.0,1.5,6.0]},
 {p:[-.9,3.4,2.1],t:[-4.4,1.6,-2.2]},
 {p:[12.4,21.0,17.1],t:[0,1.0,-1.4]}
];
const vec=p=>new THREE.Vector3(...p);
const cameraCurve=new THREE.CatmullRomCurve3(basePoints.map(x=>vec(x.p)),false,'catmullrom',.25);
const targetCurve=new THREE.CatmullRomCurve3(basePoints.map(x=>vec(x.t)),false,'catmullrom',.25);
let last=performance.now(),lastFrameMs=last,initialized=false,rendering=true;
function resize(){
 const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
 const mobile=innerWidth<720;const maxDpr=mobile?1.3:1.55;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,maxDpr));renderer.setSize(w,h,false);
 const aspect=w/h;
 const baseFov=mobile?52:37;cam.fov=baseFov;cam.aspect=aspect;cam.updateProjectionMatrix();
}
function length(){return Math.max(1,journey.offsetHeight-stage.offsetHeight)}
function progress(){return clamp(-journey.getBoundingClientRect().top/length())}
function roleAt(p){return p<.37?0:p<.75?1:2}
function role(i){
 if(state.role===i)return;
 state.role=i;chapter.textContent=roles[i][0];subheading.textContent=roles[i][1];
 chapterIndex.textContent=String(i+1).padStart(2,'0');
 document.body.dataset.role=roles[i][0].toLowerCase();
 const display=$('.chapter');display.classList.remove('role-enter');void display.offsetWidth;display.classList.add('role-enter');
 controls.forEach((el,j)=>{el.classList.toggle('active',j===i);el.setAttribute('aria-pressed',String(j===i))})
}
function setInterface(p){
 const html=document.documentElement.style;
 const searchEntry=ease(.00,.22,p),searchExit=ease(.80,1,p);
 const headlineEntry=ease(0,.16,p);
 html.setProperty('--v17-p',p.toFixed(4));
 html.setProperty('--v17-search-opacity',(0.85+.15*searchEntry).toFixed(3));
 html.setProperty('--v17-search-y',(39*(1-searchEntry)-8*searchExit).toFixed(2)+'px');
 html.setProperty('--v17-search-scale',(0.935+.065*searchEntry+.025*searchExit).toFixed(4));
 html.setProperty('--v17-title-y',(24*(1-headlineEntry)).toFixed(2)+'px');
 html.setProperty('--v17-underline-offset',(370*(1-ease(.025,.21,p))).toFixed(1));
 html.setProperty('--v17-quick-opacity',(.72+.28*searchEntry).toFixed(3));
 html.setProperty('--v17-quick-y',(16*(1-searchEntry)).toFixed(1)+'px');
 html.setProperty('--v17-scene-glow',Math.sin(Math.PI*p).toFixed(3));
 $('.progress-fill').style.width=(p*100).toFixed(1)+'%';
}
function applyCamera(p){
 const seg=ease(0,.995,p);const point=cameraCurve.getPoint(seg);
 const focus=targetCurve.getPoint(seg);
 cam.position.copy(point);
 // light orbital drift gives the camera measurable parallax but never moves live HTML
 const breadth=Math.sin(seg*Math.PI*2)*.52;
 cam.position.x+=breadth+pointer.x*.25;cam.position.y-=pointer.y*.10;
 cam.lookAt(focus);
}
function updateScroll(){state.desired=progress();setInterface(state.desired);if(!state.reduced)role(roleAt(state.desired))}
function animate(now){
 if(!rendering)return;
 const dt=Math.min(64,now-last);last=now;
 const actual=progress();if(Math.abs(actual-state.desired)>.001){state.desired=actual;setInterface(actual);if(!state.reduced)role(roleAt(actual));}
 state.shown=state.desired; // Scroll position owns camera state: no delayed easing or catch-up lag.
 applyCamera(state.shown);MARKET.update(now);
 renderer.render(scene,cam);
 state.frame++;if(!initialized){initialized=true;state.ready=true;status.textContent='LIVE 3D · INTERACTIVE';status.classList.add('ready');canvas.classList.add('ready')}
 requestAnimationFrame(animate);
}
function jump(i){const p=[.04,.52,.98][i];role(i);state.desired=p;setInterface(p);
 const y=journey.getBoundingClientRect().top+scrollY+length()*p;
 scrollTo({top:y,behavior:state.reduced?'instant':'smooth'});
}
controls.forEach((b,i)=>b.addEventListener('click',()=>jump(i)));
$('.skip').addEventListener('click',()=>{const input=$('.search-field input');input.focus({preventScroll:true});input.scrollIntoView({block:'nearest',behavior:'smooth'})});
$('.near-me').addEventListener('click',()=>{if(!navigator.geolocation){alert('Location is unavailable. Search a town instead.');return}
 navigator.geolocation.getCurrentPosition(pos=>{const u=new URL('https://marketdirectory.co.uk/directory');u.searchParams.set('lat',pos.coords.latitude.toFixed(5));u.searchParams.set('lng',pos.coords.longitude.toFixed(5));location.assign(u.href)},()=>alert('Location was not granted. Search for a town or postcode instead.'),{timeout:9000,enableHighAccuracy:false})});
addEventListener('scroll',updateScroll,{passive:true});addEventListener('resize',()=>{resize();updateScroll()},{passive:true});
motionQuery.addEventListener?.('change',()=>{state.reduced=motionQuery.matches;updateScroll()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!rendering){rendering=true;last=performance.now();requestAnimationFrame(animate)}else if(document.hidden)rendering=false});
search.classList.add('ready');search.inert=false;
window.__MDPreview={version:'v17-three-native',get:()=>({role:roles[state.role][0].toLowerCase(),progress:state.desired,displayedProgress:state.shown,ready:state.ready,frames:state.frame,scrollSpan:length(),searchOpacity:Number(getComputedStyle(search).opacity),canvas:{w:canvas.width,h:canvas.height},stalls:MARKET.stats().stalls,batched:MARKET.stats().batched,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,mode:'real-time WebGL / no video'}),select:jump};
try{resize();updateScroll();requestAnimationFrame(animate)}catch(e){state.errors++;status.textContent='3D unavailable • static fallback';console.error('[V17]',e)}

