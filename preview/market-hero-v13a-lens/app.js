
(()=>{'use strict';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,p)=>a+(b-a)*p,step=(a,b,v)=>{let n=clamp((v-a)/(b-a));return n*n*(3-2*n)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');const journey=$('.journey');const search=$('.search-wrap');const cue=$('.scroll-cue');const progressLine=$('.progress-fill');
let progress=0,requested=false;window.__MDPreview={concept:document.body.dataset.concept,progress:0};
function currentProgress(){if(reduced.matches)return 1;const length=Math.max(1,journey.offsetHeight-innerHeight);return clamp((scrollY-journey.offsetTop)/length)}
function update(){requested=false;progress=currentProgress();window.__MDPreview.progress=progress;document.documentElement.style.setProperty('--p',progress.toFixed(4));
const r=step(.1,.27,progress);search.style.opacity=r.toFixed(3);search.style.transform=`translateY(${lerp(22,0,r).toFixed(1)}px) scale(${lerp(.98,1,r).toFixed(3)})`;search.classList.toggle('ready',r>.85||reduced.matches);search.inert=!(r>.85||reduced.matches);
if(reduced.matches){search.style.opacity='1';search.style.transform='none';search.inert=false;search.classList.add('ready')}
cue.style.opacity=(1-step(.02,.15,progress)).toFixed(3);progressLine.style.width=(progress*100).toFixed(1)+'%';$('.skip').hidden=progress>.85||reduced.matches;
render(progress);
}
function request(){if(!requested){requested=true;requestAnimationFrame(update)}}
addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});reduced.addEventListener?.('change',request);
$('.skip').addEventListener('click',()=>{const end=journey.offsetTop+Math.max(1,journey.offsetHeight-innerHeight);scrollTo({top:end,behavior:reduced.matches?'auto':'smooth'})});
$('.near-me').addEventListener('click',()=>{if(!navigator.geolocation){alert('Location is unavailable in this browser. Search for your town instead.');return}navigator.geolocation.getCurrentPosition(pos=>{const u=new URL('https://marketdirectory.co.uk/directory');u.searchParams.set('lat',pos.coords.latitude.toFixed(5));u.searchParams.set('lng',pos.coords.longitude.toFixed(5));location.href=u.href},()=>alert('Location access was not granted. Search for a town or postcode instead.'),{timeout:9000,enableHighAccuracy:false})});
function render(p){
 const turn=reduced.matches?0:lerp(-9,351,p);
 document.documentElement.style.setProperty('--yaw',turn.toFixed(2)+'deg');
 $('.lens-body').classList.toggle('readable-back',p>.265&&p<.745);
 const role=p<.32?0:p<.64?1:2;
 const data=[['Shopper','Discover places worth the journey.',"SEE WHAT'S OUT THERE"],['Trader','Find the perfect place to trade.',"A PLACE FOR YOUR BUSINESS"],['Market organiser','Bring your community together.',"MAKE SOMETHING HAPPEN"]][role];
 document.body.dataset.role=data[0];$('#role-name').textContent=data[0];$('#role-context').textContent=data[1];$('#lens-caption').textContent=data[2];$('#role-index').textContent=`0${role+1} / 03`;
 all('.lens-scene').forEach((node,i)=>node.classList.toggle('active',i===role));
 // In real-world optical objects rotation happens around the solid axis, not 2D spinning in place.
 $('.a-map-layer').style.transform=`rotate(-4deg) scale(${lerp(1.02,1.105,step(0,.92,p)).toFixed(4)})`;
 $('.a-orbit').style.opacity=(.45-.20*step(.45,1,p)).toFixed(3);
}

request();window.__MDPreview.get=()=>({progress,searchVisible:getComputedStyle(search).opacity,forms:all('form').length,role:document.body.dataset.role||''});
})();
