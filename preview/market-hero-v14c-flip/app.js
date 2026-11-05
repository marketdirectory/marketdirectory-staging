
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
let manualRole=null;
const rotor=$('#c-rotor'),shopper=$('.c-shopper'),organiser=$('.c-organiser');
function render(p){
 let role=p<.34?0:p<.67?1:2;
 if(reduced.matches)role=manualRole??0;
 const names=['Shopper','Trader','Market organiser'];document.body.dataset.role=names[role];
 const first=step(.28,.40,p),second=step(.61,.73,p);
 const angle=180*first+180*second;
 const tilt=7*Math.sin(Math.PI*first)+7*Math.sin(Math.PI*second);
 const pop=1+.035*(Math.sin(Math.PI*first)+Math.sin(Math.PI*second));
 if(reduced.matches){rotor.style.transform='rotateY(0deg)';all('.c-panel').forEach(x=>x.style.transform='rotateY(0deg) translateZ(1px)');}
 else{rotor.style.transform=`rotateY(${-angle.toFixed(3)}deg) rotateX(${tilt.toFixed(2)}deg) scale(${pop.toFixed(3)})`;}
 shopper.style.visibility=reduced.matches?(role===0?'visible':'hidden'):(p<.67?'visible':'hidden');
 organiser.style.visibility=reduced.matches?(role===2?'visible':'hidden'):(p>=.67?'visible':'hidden');
 $('.c-trader').style.visibility=reduced.matches?(role===1?'visible':'hidden'):'visible';
 all('.c-panel').forEach((v,i)=>{const on=i===role;v.classList.toggle('active',on);v.setAttribute('aria-hidden',on?'false':'true')});
 all('.c-role-nav button').forEach((v,i)=>{const on=i===role;v.classList.toggle('active',on);v.setAttribute('aria-pressed',on?'true':'false')});
 $('#c-progress-no').textContent=`0${role+1}`;$('#c-bar').style.width=((role+1)*100/3).toFixed(2)+'%';
 search.style.opacity='1';search.style.transform='none';search.inert=false;search.classList.add('ready');
}
all('.c-role-nav button').forEach((v,i)=>v.addEventListener('click',()=>{
 if(reduced.matches){manualRole=i;render(1);return;}
 const target=[.08,.50,.87][i];
 const distance=Math.max(1,journey.offsetHeight-innerHeight);
 scrollTo({top:journey.offsetTop+distance*target,behavior:reduced.matches?'auto':'smooth'});
}));

request();window.__MDPreview.get=()=>({progress,searchVisible:getComputedStyle(search).opacity,forms:all('form').length,role:document.body.dataset.role||''});
})();
