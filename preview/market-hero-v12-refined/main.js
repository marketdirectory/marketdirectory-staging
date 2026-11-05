import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {createWorlds} from './worlds.js';
import {createMagnifier} from './magnifier.js';
/*
  Market Directory V12 | standalone cinematographic 3D proof
  Three.js r187 + GSAP ScrollTrigger 3.15 pinned through importmap and local file URLs.
  A custom product-quality magnifier is built from original 3D geometry, and all three miniature
  worlds are geometry. The fallback is a single nonanimated poster for no-WebGL devices.
  On integration, port the real search UI/handlers from pages/Home.tsx.
*/
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,q)=>a+(b-a)*q;
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t)};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile=()=>window.innerWidth<=700;
let progress=0;
let renderer,scene,camera,worlds=null,glassPivot=null,productRoot=null,hostRect={w:0,h:0},rendererAvailable=false,visible=true;
let activeRole=0,drawWanted=true,raf=0,lastFrame=-Infinity;
let entryDone=false;
const roleNames=['Shopper','Trader','Market organiser'];
let gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
const markReady=()=>{document.documentElement.classList.add('v12-enhanced');window.__v12Ready=true;};
function applyProgress(p){
 progress=clamp(p);document.documentElement.style.setProperty('--progress',progress.toFixed(3));
 const lensScale=1+0.22*(smooth(.65,.82,progress)-smooth(.84,.985,progress));
 const yaw=Math.PI*2*progress;
 const role=progress<.28?0:progress<.64?1:2;
 if(role!==activeRole){activeRole=role;
  $('role-label').textContent=roleNames[role];
  document.querySelectorAll('.role-bars i').forEach((v,i)=>v.classList.toggle('active',i===role));
 }
 if(glassPivot){
   glassPivot.rotation.set(-.06+Math.sin(progress*Math.PI*2)*.09,yaw,.03*Math.sin(progress*Math.PI*2));
   glassPivot.scale.setScalar(lensScale);
   if(worlds)worlds.forEach((w,i)=>{const on=i===role;w.visible=on;});
 }
 if(camera){camera.position.z=mix(9.8,8.3,smooth(.69,.82,progress)) +mix(0,1.5,smooth(.84,1,progress)); camera.position.x=mix(.0,.30,smooth(.69,.82,progress));camera.lookAt(.12,-.08,0)}
 const reveal=smooth(.12,.295,progress);
 const sr=$('search-zone'),quick=$('quick-links');
 sr.style.opacity=reveal.toFixed(3);
 sr.style.transform=`translateY(${mix(28,0,reveal).toFixed(2)}px) scale(${mix(.94,1,reveal).toFixed(4)})`;
 sr.classList.toggle('is-ready',reveal>.92||reduced.matches);
 sr.inert=!(reveal>.92||reduced.matches);
 quick.style.opacity=smooth(.24,.39,progress).toFixed(3);
 quick.style.transform=`translateY(${mix(14,0,smooth(.24,.39,progress)).toFixed(1)}px)`;
 const underline=$('underline-path');if(entryDone||progress>.32){underline.style.strokeDashoffset=mix(660,0,smooth(.28,.49,progress)).toFixed(1)}
 $('progress-fill').style.width=(progress*100).toFixed(1)+'%';
 $('scroll-cue').style.opacity=(1-smooth(.05,.2,progress)).toFixed(2);
 $('light-trail').style.opacity=(smooth(.71,.80,progress)*(1-smooth(.89,.97,progress))*.62).toFixed(3);
 $('skip').hidden=progress>.85||reduced.matches;
 // Scroll coaxes the typography in subtly after its real page-arrival entrance.
 if(entryDone&&!reduced.matches){document.querySelector('.hero-title').style.transform=`translateY(${(-progress*5).toFixed(2)}px)`;}
 drawWanted=true;requestFrame();
}
function addSoftboxEnvironment(){
 // PMREM from a studio environment gives metals believable reflections rather than flat gold.
 const env=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);
 scene.environment=pmrem.fromScene(env,.04).texture;
 env.dispose();pmrem.dispose();
}
function resize(){
 if(!renderer||!camera)return;
 const r=$('object-zone').getBoundingClientRect();
 const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
 if(w===hostRect.w&&h===hostRect.h)return;
 hostRect={w,h};renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.fov=mobile()?35:31;camera.updateProjectionMatrix();
 drawWanted=true;requestFrame();
}
function requestFrame(){if(!raf&&visible)raf=requestAnimationFrame(frame)}
function frame(now){
 raf=0; if(!visible||!rendererAvailable)return;
 const shouldIdle=(now-lastFrame)>33;
 if(drawWanted||shouldIdle){
  lastFrame=now;drawWanted=false;
  if(productRoot&&!reduced.matches){
    // Tiny breathing motion, independent of scroll but never a distracting spin.
    productRoot.position.y=Math.sin(now*.00085)*.038;
  }
  renderer.render(scene,camera);
 }
 requestFrame();
}
async function initThree(){
 const canvas=$('lens-canvas');
 if(reduced.matches){document.body.classList.add('three-failed');return}
 try{
  const context=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'})||canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance'});
  if(!context)throw new Error('WebGL unavailable; static accessible preview');
  renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  renderer.setClearColor(0xffffff,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile()?1.35:1.85));
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(31,1,.1,60);camera.position.set(0,0,9.8);camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0xffffff,1.02));
  const key=new THREE.DirectionalLight(0xffe3bd,4.1);key.position.set(-4,6,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.002;scene.add(key);
  const fill=new THREE.DirectionalLight(0xd4dfff,2.2);fill.position.set(4,-1,5);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffbd75,3.25);rim.position.set(1,2,-4);scene.add(rim);
  try{addSoftboxEnvironment()}catch(err){console.warn('Environment fallback',err)}
  productRoot=new THREE.Group();scene.add(productRoot);
  glassPivot=new THREE.Group();productRoot.add(glassPivot);
  // Entire solid magnifier, miniature dioramas, rim and handle turn together in real 3D.
  const assembly=createMagnifier(THREE);glassPivot.add(assembly);assembly.rotation.z=-.09;
  const created=createWorlds(THREE);worlds=created.worlds;
  // Role vignettes are actually within and behind the GLB's glass plane.
  for(const [index,world] of worlds.entries()){
    assembly.add(world);
    world.position.z=(index===1?-.20:.20);
    // place the world close to the glass center rather than on the handle
    world.position.y=.06;
  }
  worlds[1].rotation.y=Math.PI;
  resize();applyProgress(progress);
  rendererAvailable=true;document.body.classList.add('three-ready');requestFrame();
  window.__v12Three={renderer,scene,camera,glassPivot,worlds,model:assembly,asset:'original procedural geometry'};
 }catch(err){
  console.warn('V12 immersive preview using accessible static fallback:',err);
  document.body.classList.add('three-failed');document.body.classList.remove('three-ready');
  rendererAvailable=false;
 }
}
function animateIntro(){
 const gsap=window.gsap;
 const t1=$('line1'),t2=$('line2');
 for(const el of [t1,t2]){
   const txt=el.firstChild?.textContent||el.textContent||'';
   el.firstChild?.remove();
   const span=document.createElement('span');span.className='title-word';
   for(const char of txt){
     const child=document.createElement('span');child.className='char';child.textContent=char===' '?'\u00a0':char;
     child.setAttribute('aria-hidden','true');span.appendChild(child);
   }
   el.insertBefore(span,el.firstChild);
 }
 if(!gsap||reduced.matches){entryDone=true;$('underline-path').style.strokeDashoffset=0;return}
 const letters1=[...t1.querySelectorAll('.char')],letters2=[...t2.querySelectorAll('.char')];
 gsap.set([...letters1,...letters2],{opacity:0,yPercent:115,rotationX:80,scale:.80,filter:'blur(6px)',transformPerspective:850});
 gsap.set(['#kicker','#subtitle','#category-rotator'],{opacity:0,y:25});
 // No hidden layout: the *actual characters* emerge visibly over 3 seconds.
 const intro=gsap.timeline({delay:.35,onComplete:()=>{entryDone=true}});
 intro.to('#kicker',{opacity:1,y:0,duration:.75,ease:'power2.out'})
 .to(letters1,{opacity:1,yPercent:0,rotationX:0,scale:1,filter:'blur(0px)',ease:'back.out(1.6)',duration:1.18,stagger:.045},.34)
 .to(letters2,{opacity:1,yPercent:0,rotationX:0,scale:1,filter:'blur(0px)',ease:'back.out(1.7)',duration:1.18,stagger:.055},.83)
 .to('#subtitle',{opacity:1,y:0,duration:.78,ease:'power2.out'},1.35)
 .to('#category-rotator',{opacity:1,y:0,duration:.85,ease:'back.out(1.8)'},1.63);
}
function initScroll(){
 const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
 if(reduced.matches){
  document.querySelector('.journey').style.height='100svh';
  applyProgress(1);$('role-counter').hidden=true;return;
 }
 if(gsap&&ScrollTrigger){
   gsap.registerPlugin(ScrollTrigger);
   const st={p:0};
   const master=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#journey',start:'top top',end:'bottom bottom',scrub:.6,invalidateOnRefresh:true, onRefresh:()=>resize(), onUpdate:(v)=>{window.__v12Progress=v.progress}}});
   master.to(st,{p:1,duration:1,onUpdate:()=>applyProgress(st.p)},0);
   window.__v12ScrollTrigger=master.scrollTrigger;
 }else{
   // Offline / unsupported: native scroll drives the same single progress state.
   let pending=false;
   const update=()=>{pending=false;const j=$('journey'),length=Math.max(1,j.offsetHeight-window.innerHeight),p=clamp((window.scrollY-j.offsetTop)/length);applyProgress(p)};
   window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});update();
 }
}
function initCategories(){
 const categories=["Farmers' markets","Flea markets","Street food","Craft fairs","Car boot sales"];
 let idx=0;setInterval(()=>{
  if(document.hidden||reduced.matches)return;
  const el=$('category-word'),old=idx;idx=(idx+1)%categories.length;
  if(window.gsap){gsap.to(el,{opacity:0,y:-9,duration:.22,onComplete:()=>{el.textContent=categories[idx];gsap.fromTo(el,{opacity:0,y:10},{opacity:1,y:0,duration:.39,ease:'power3.out'})}})}
  else el.textContent=categories[idx];
 },3000);
}
function initObserver(){
 if('IntersectionObserver' in window){new IntersectionObserver(es=>{visible=es.some(x=>x.isIntersecting);if(visible)requestFrame();else if(raf){cancelAnimationFrame(raf);raf=0}},{rootMargin:'100px 0px'}).observe($('stage'))}
 addEventListener('resize',()=>{resize();applyProgress(progress);if(renderer)renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.35:1.85))},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestFrame()});
}
function boot(){
 markReady();
 $('search-zone').inert=true;
 animateIntro();initScroll();initCategories();initObserver();
 if(reduced.matches){document.body.classList.add('three-failed')}else void initThree();
 window.__v12State=()=>({progress,activeRole,role:roleNames[activeRole],ready:rendererAvailable,entryDone,searchForms:document.querySelectorAll('form').length});
}
boot();