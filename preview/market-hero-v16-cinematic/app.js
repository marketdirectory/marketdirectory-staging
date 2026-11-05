(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)],clamp=n=>Math.max(0,Math.min(1,n));
const journey=$('.journey'),stage=$('.stage'),film=$('#film'),status=$('#film-state'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const chapters=all('[data-chapter]'),counter=$('#chapter-number'),heading=$('#chapter-heading'),subtitle=$('#chapter-subheading');
const roles=[['SHOPPER','Find your next favourite place.'],['TRADER','Your next pitch starts here.'],['ORGANISER','Make your market the destination.']];
const targets=[.025,.505,.975],state={p:0,role:0,frames:[],cache:new Map(),pending:new Map(),ready:false,drawn:-1,frame:0,errors:0,raf:0,paused:false};
let filmW=0,filmH=0;
function span(){return Math.max(1,journey.offsetHeight-stage.offsetHeight)}
function progress(){return clamp(-journey.getBoundingClientRect().top/span())}
function roleFrom(p){return p<.35?0:p<.78?1:2}
function select(i){state.role=i;heading.textContent=roles[i][0];subtitle.textContent=roles[i][1];counter.textContent=String(i+1).padStart(2,'0');document.body.dataset.role=roles[i][0].toLowerCase();chapters.forEach((b,k)=>{b.classList.toggle('active',i===k);b.setAttribute('aria-pressed',String(i===k))})}
function resize(){}
function paintFilm(){if(!state.ready||reduced.matches)return;const t=state.p*Math.max(.1,(film.duration||7.76)-.045);if(Math.abs(t-(state.lastSeek??-1))>.04){state.lastSeek=t;try{film.currentTime=t;state.frame=Math.round(t*24)}catch{state.errors++}}}
function prepareFilm(){film.muted=true;film.playsInline=true;film.pause();film.addEventListener('loadedmetadata',()=>{state.ready=true;state.frames=Array.from({length:Math.round((film.duration||7.76)*24)});film.classList.add('ready');status.textContent='V16 · CINEMATIC REVIEW';status.classList.add('ready');paintFilm()});film.addEventListener('error',()=>{state.errors++;state.ready=false;status.textContent='VIDEO UNAVAILABLE · PHOTO FALLBACK'});film.load()}
function update(){state.raf=0;const p=reduced.matches?state.p:progress();state.p=p;
 document.documentElement.style.setProperty('--film-p',p.toFixed(4));
 $('.progress-fill').style.width=(p*100).toFixed(1)+'%';
 if(!reduced.matches)select(roleFrom(p));
 paintFilm();}
function requestUpdate(){if(!state.raf)state.raf=requestAnimationFrame(update);}
function jump(i){if(!Number.isInteger(i)||i<0||i>2)return;
 state.p=targets[i];select(i);
 if(!reduced.matches){const top=journey.getBoundingClientRect().top+scrollY;scrollTo({top:top+span()*targets[i],behavior:'instant'});}update();}
chapters.forEach((b,i)=>b.addEventListener('click',()=>jump(i)));
$('.skip').addEventListener('click',()=>$('.search-field input').focus({preventScroll:true}));
$('.near-me').addEventListener('click',()=>{if(!navigator.geolocation){alert('Location is unavailable. Search for your town instead.');return;}navigator.geolocation.getCurrentPosition(pos=>{const url=new URL('https://marketdirectory.co.uk/directory');url.searchParams.set('lat',pos.coords.latitude.toFixed(5));url.searchParams.set('lng',pos.coords.longitude.toFixed(5));location.assign(url.href);},()=>alert('Location was not granted. Search for a town or postcode instead.'),{timeout:9000,enableHighAccuracy:false});});
const search=$('.search-wrap');search.classList.add('ready');search.style.opacity='1';search.style.transform='none';search.inert=false;
addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',()=>{resize();requestUpdate();},{passive:true});
reduced.addEventListener?.('change',()=>{state.p=0;select(0);requestUpdate();});
document.addEventListener('visibilitychange',()=>{state.paused=document.hidden;if(!state.paused)requestUpdate();});
window.__MDPreview={version:'v16-film',get:()=>({role:roles[state.role][0].toLowerCase(),progress:state.p,forms:all('form').length,scrollSpan:span(),frames:state.frames.length,frame:state.frame,filmReady:state.ready,mediaErrors:state.errors,searchVisible:getComputedStyle(search).opacity}),select:jump};
resize();update();prepareFilm();
})();