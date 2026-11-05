(()=>{'use strict';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],clamp=n=>Math.max(0,Math.min(1,n));
const journey=$('.journey'),stage=$('.stage'),canvas=$('#film'),ctx=canvas.getContext('2d',{alpha:false}),status=$('#film-state'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const chapters=all('[data-chapter]'),heading=$('#chapter-heading'),subtitle=$('#chapter-subheading'),counter=$('#chapter-number');
const roles=[['SHOPPER','Find your next favourite place.'],['TRADER','Your next pitch starts here.'],['ORGANISER','Make your market the destination.']];
const targets=[.02,.50,.98],state={p:0,role:0,raf:0,manifest:null,cache:new Map(),pending:new Set(),errors:0,frame:0,drawn:-1,shown:false,paused:false,tier:'desktop',drawnTier:null,requests:0};
function span(){return Math.max(1,journey.offsetHeight-stage.offsetHeight)}
function progress(){return clamp(-journey.getBoundingClientRect().top/span())}
function roleFrom(p){return p<.35?0:p<.78?1:2}
function select(i){state.role=i;heading.textContent=roles[i][0];subtitle.textContent=roles[i][1];counter.textContent=String(i+1).padStart(2,'0');document.body.dataset.role=roles[i][0].toLowerCase();chapters.forEach((b,k)=>{b.classList.toggle('active',k===i);b.setAttribute('aria-pressed',String(k===i))})}
function resize(){const dpr=Math.min(1.5,devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;state.drawn=-1}}
function key(t,i){return t+':'+i}
function at(t,n){return Math.floor(n/(state.manifest.layout[t][0]*state.manifest.layout[t][1]))}
function limit(t){const keys=[...state.cache.keys()].filter(x=>x.startsWith(t+':'));const max=t==='proxy'?3:3;while(keys.length>max){const victim=keys.shift();if(victim===key(t,at(t,state.frame)))continue;const old=state.cache.get(victim);old?.close?.();state.cache.delete(victim)}}
function load(t,i){const m=state.manifest;if(!m||i<0||i>=m.urls[t].length||state.paused)return;const k=key(t,i);if(state.cache.has(k)||state.pending.has(k)||state.pending.size>=5)return;state.pending.add(k);state.requests++;
const img=new Image();img.decoding='async';img.onload=async()=>{let asset=img;try{if(typeof createImageBitmap==='function')asset=await createImageBitmap(img)}catch{}state.pending.delete(k);state.cache.set(k,asset);limit(t);paint();};img.onerror=()=>{state.pending.delete(k);state.errors++;if(!state.shown)status.textContent='FILM ASSET UNAVAILABLE · STATIC FALLBACK'};img.src=m.urls[t][i]}
function draw(t,idx,n){const m=state.manifest,im=state.cache.get(key(t,idx));if(!im)return false;const [w,h]=m.frameSize[t],[cols,rows]=m.layout[t],nLocal=n%(cols*rows);
const sc=Math.max(canvas.width/w,canvas.height/h),dw=w*sc,dh=h*sc;
ctx.drawImage(im,(nLocal%cols)*w,Math.floor(nLocal/cols)*h,w,h,(canvas.width-dw)/2,(canvas.height-dh)/2,dw,dh);
state.drawn=n;state.drawnTier=t;canvas.classList.add('ready');state.shown=true;status.classList.add('ready');return true}
function paint(){if(!state.manifest||reduced.matches||state.paused||!ctx)return;const m=state.manifest;resize();const n=Math.min(m.count-1,Math.max(0,Math.round(state.p*(m.count-1))));state.frame=n;
const tier=innerWidth<=720?'mobile':'desktop';state.tier=tier;const hi=at(tier,n),low=at('proxy',n);
if(!draw(tier,hi,n)&&!draw('proxy',low,n)){load('proxy',low);load(tier,hi)}
load(tier,hi);load('proxy',low);
if(state.pending.size<4)load(tier,hi+(state.p<.5?1:-1));
if(state.pending.size<4)load('proxy',low+(state.p<.5?1:-1))}
function update(){state.raf=0;state.p=reduced.matches?state.p:progress();document.documentElement.style.setProperty('--film-p',state.p.toFixed(4));$('.progress-fill').style.width=(state.p*100).toFixed(1)+'%';if(!reduced.matches)select(roleFrom(state.p));paint()}
function requestUpdate(){if(!state.raf)state.raf=requestAnimationFrame(update)}
function jump(i){state.p=targets[i];select(i);if(!reduced.matches){const top=journey.getBoundingClientRect().top+scrollY;scrollTo({top:top+span()*targets[i],behavior:'instant'})}requestUpdate()}
chapters.forEach((b,i)=>b.addEventListener('click',()=>jump(i)));
$('.skip').addEventListener('click',()=>$('.search-field input').focus({preventScroll:true}));
$('.near-me').addEventListener('click',()=>{if(!navigator.geolocation){alert('Location unavailable. Search a town instead.');return}navigator.geolocation.getCurrentPosition(pos=>{const u=new URL('https://marketdirectory.co.uk/directory');u.searchParams.set('lat',pos.coords.latitude.toFixed(5));u.searchParams.set('lng',pos.coords.longitude.toFixed(5));location.assign(u.href)},()=>alert('Location was not granted. Search for a town or postcode instead.'),{timeout:9000,enableHighAccuracy:false})});
const search=$('.search-wrap');search.classList.add('ready');search.style.opacity='1';search.style.transform='none';search.inert=false;
addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',()=>{resize();requestUpdate()},{passive:true});reduced.addEventListener?.('change',()=>{state.p=0;select(0);requestUpdate()});
document.addEventListener('visibilitychange',()=>{state.paused=document.hidden;if(!state.paused)requestUpdate()});
window.__MDPreview={version:'v16-atlas',get:()=>({role:roles[state.role][0].toLowerCase(),progress:state.p,forms:all('form').length,scrollSpan:span(),frames:state.manifest?.count||0,frame:state.frame,renderedFrame:state.drawn,filmReady:state.shown,mediaErrors:state.errors,searchVisible:getComputedStyle(search).opacity,quality:state.drawnTier,atlasesLoaded:state.cache.size,pending:state.pending.size,requests:state.requests}),select:jump};
async function start(){if(reduced.matches)return;try{const resp=await fetch('./film-atlas.json');if(!resp.ok)throw Error('Atlas manifest missing');const m=await resp.json();if(!m.ready||m.count!==94||!m.urls?.proxy||!m.urls?.desktop||!m.urls?.mobile)throw Error('Invalid atlas');state.manifest=m;resize();load('proxy',0);load('proxy',1);load('proxy',2);load(innerWidth<=720?'mobile':'desktop',0);update()}catch(e){status.textContent='FILM ASSET UNAVAILABLE · PHOTO FALLBACK';state.errors++}}
resize();update();start();
})();