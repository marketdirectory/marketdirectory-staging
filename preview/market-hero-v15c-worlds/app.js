(()=>{'use strict';
const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const scenes=[
 {key:'shopper',role:'SHOPPER',number:'01',eyebrow:'DISCOVER SOMETHING NEW',title:'Find your next<br>favourite place.',description:'Independent stalls, unexpected treasures and local favourites.',detail:'EXPLORE LOCAL',src:'https://images.unsplash.com/photo-1775328023972-2e94b905b87d?auto=format&fit=crop&w=1200&q=82'},
 {key:'trader',role:'TRADER',number:'02',eyebrow:'GROW YOUR BUSINESS',title:'Your next pitch<br>starts here.',description:'Meet new customers at markets made for your business.',detail:'MAKE YOUR MARK',src:'https://images.unsplash.com/photo-1768321481665-b40705ab11ce?auto=format&fit=crop&w=1200&q=82'},
 {key:'organiser',role:'ORGANISER',number:'03',eyebrow:'BRING PEOPLE TOGETHER',title:'Make your market<br>the destination.',description:'Connect your event with the people who will love it.',detail:'PLAN · PROMOTE · FILL',src:'https://images.unsplash.com/photo-1719934113502-d2968bc999d7?auto=format&fit=crop&w=1200&q=82'}
];
const journey=$('#journey'),stage=$('.stage'),rotor=$('#flip-scene'),front=$('.card-front'),back=$('.card-back'),roleButtons=$$('.role-button'),chapter=$('#chapter-current'),fill=$('#chapter-progress'),rail=$('#rail-fill'),announce=$('.scene-announcement'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,desired=0,running=false,animation=null,transitionTarget=0,manualUntil=0,lastScroll=scrollY,raf=0,progress=0;
const clamp=n=>Math.min(1,Math.max(0,n));
function paint(face,index){
 const x=scenes[index];face.dataset.role=x.key;
 $('.card-index',face).textContent=x.number+' / 03';
 $('.role-pill',face).textContent=x.role;
 $('.detail-caption',face).textContent=x.detail;
 $('.card-eyebrow',face).textContent=x.eyebrow;
 $('.card-title',face).innerHTML=x.title; // authored, fixed strings only
 $('.card-description',face).textContent=x.description;
 const img=$('.scene-photo',face);
 if(img.dataset.role!==x.key){img.dataset.role=x.key;img.src=x.src;img.onerror=()=>face.classList.add('image-failed');img.onload=()=>face.classList.remove('image-failed');}
}
function updateIndicators(n){
 document.body.dataset.activeRole=scenes[n].key;
 chapter.textContent=scenes[n].number;
 fill.style.width=((n+1)/3*100)+'%';
 for(let i=0;i<roleButtons.length;i++){const on=i===n;roleButtons[i].classList.toggle('is-active',on);roleButtons[i].setAttribute('aria-pressed',String(on));}
}
function finish(n){
 if(animation){const done=animation;animation=null;done.onfinish=null;done.oncancel=null;done.cancel();}
 paint(front,n);rotor.style.transform='rotateY(0deg)'; // restore front face after clearing WAAPI forwards fill
 front.setAttribute('aria-hidden','false');back.setAttribute('aria-hidden','true');
 current=n;running=false;animation=null;updateIndicators(n);
 announce.textContent=scenes[n].role.toLowerCase()+' market experience';
 if(desired!==current)start(desired);
}
function start(n,manual=false){
 if(manual)manualUntil=performance.now()+1300;
 desired=n;updateIndicators(n);
 if(running){
  // The latest request takes priority. Continue from the face currently on-screen
  // instead of queueing another full turn behind an obsolete request.
  const t=animation&&typeof animation.currentTime==='number'?animation.currentTime/760:0;
  const visible=t>=.5?transitionTarget:current;
  if(animation){const old=animation;old.onfinish=null;old.oncancel=null;old.cancel();}
  running=false;animation=null;current=visible;paint(front,visible);
  rotor.style.transform='rotateY(0deg)';
  front.setAttribute('aria-hidden','false');back.setAttribute('aria-hidden','true');
 }
 if(n===current){updateIndicators(n);return;}
 if(reduce.matches){finish(n);return;}
 running=true;transitionTarget=n;paint(back,n);
 back.setAttribute('aria-hidden','false');front.setAttribute('aria-hidden','true');
 const angle=n>current?180:-180;
 rotor.style.transform='rotateY(0deg)';
 animation=rotor.animate([
  {transform:'rotateY(0deg) scale(1)',filter:'brightness(1)',offset:0},
  {transform:'rotateY('+(angle*.46)+'deg) scale(.925)',filter:'brightness(.83)',offset:.46},
  {transform:'rotateY('+(angle*.56)+'deg) scale(.925)',filter:'brightness(.83)',offset:.56},
  {transform:'rotateY('+angle+'deg) scale(1)',filter:'brightness(1)',offset:1}
 ],{duration:760,easing:'cubic-bezier(.22,.74,.18,1)',fill:'forwards'});
 animation.onfinish=()=>finish(n);
 animation.oncancel=()=>{running=false;animation=null;front.setAttribute('aria-hidden','false');back.setAttribute('aria-hidden','true');};
}
function progressNow(){
 const range=Math.max(1,journey.offsetHeight-stage.offsetHeight);
 return clamp((scrollY-journey.offsetTop)/range);
}
function updateScroll(){
 raf=0;progress=progressNow();rail.style.width=(progress*100).toFixed(1)+'%';
 const n=progress<.32?0:progress<.65?1:2;
 if(!reduce.matches && performance.now()>manualUntil && Math.abs(scrollY-lastScroll)>3){desired=n;if(n!==current)start(n);}
 lastScroll=scrollY;
}
function onScroll(){if(!raf)raf=requestAnimationFrame(updateScroll);}
roleButtons.forEach((button,i)=>button.addEventListener('click',()=>start(i,true)));
addEventListener('wheel',()=>{manualUntil=0;},{passive:true});
addEventListener('touchstart',()=>{manualUntil=0;},{passive:true});
addEventListener('keydown',event=>{if(['PageUp','PageDown','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))manualUntil=0;});
$('.near-me').addEventListener('click',()=>{
 if(!navigator.geolocation){alert('Location is unavailable. Search for your town instead.');return;}
 navigator.geolocation.getCurrentPosition(pos=>{
  const url=new URL('https://marketdirectory.co.uk/directory');
  url.searchParams.set('lat',pos.coords.latitude.toFixed(5));url.searchParams.set('lng',pos.coords.longitude.toFixed(5));location.assign(url.href);
 },()=>alert('Location access was not granted. Search for a town or postcode instead.'),{timeout:9000,enableHighAccuracy:false});
});
reduce.addEventListener?.('change',()=>{if(reduce.matches&&animation){animation.cancel();running=false;finish(desired);}onScroll();});
document.addEventListener('visibilitychange',()=>{if(animation){document.hidden?animation.pause():animation.play();}});
paint(front,0);paint(back,1);updateIndicators(0);
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});
updateScroll();
// Load the next scene only after first paint; browser owns responsive decoding.
const prefetch=()=>{scenes.slice(1).forEach(s=>{const img=new Image();img.decoding='async';img.src=s.src;});};
if('requestIdleCallback' in window)requestIdleCallback(prefetch,{timeout:2300});else setTimeout(prefetch,1000);
window.__MDPreview={version:'v15c',get:()=>({role:scenes[current].key,desired:scenes[desired].key,progress,animating:running,forms:$$('form').length}),select:n=>{if(Number.isInteger(n)&&n>=0&&n<3)start(n);}};
})();