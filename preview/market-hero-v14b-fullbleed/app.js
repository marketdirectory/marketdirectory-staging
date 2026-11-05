
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
 const open=step(.22,.79,p),mapFade=1-step(.55,.85,p),mapZoom=1+1.15*step(.15,.78,p);
 const scene=p<.34?0:p<.68?1:2;document.body.dataset.role=['Shopper','Trader','Market organiser'][scene];
 all('.b-audience').forEach((node,i)=>{const on=scene===i;node.classList.toggle('is-current',on);node.setAttribute('aria-pressed',on?'true':'false')});
 $('.b-map-frame').style.opacity=mapFade.toFixed(3);
 $('.b-map-frame').style.transform=`scale(${mapZoom.toFixed(4)}) translate(${(-5*open).toFixed(1)}%,${(5*open).toFixed(1)}%)`;
 const radius=lerp(0,150,open);
 $('.b-portal-photo').style.setProperty('--radius',radius.toFixed(2)+'%');
 $('.b-focus-flash').style.opacity=(.23*(step(.31,.44,p)-step(.48,.57,p))).toFixed(3);
 $('.stage').classList.toggle('portal-active',p>.34||reduced.matches);
 const ct=$('#b-chapter-title'),cs=$('#b-chapter-sub');
 if(p<.34){ct.textContent='MADE FOR DISCOVERERS';cs.textContent='Shop your local independent markets.'}
 else if(p<.68){ct.textContent='MADE FOR TRADERS';cs.textContent='Meet customers at your next market pitch.'}
 else{ct.textContent='MADE FOR ORGANISERS';cs.textContent='Bring your whole market to new audiences.'}
 $('.b-chapter').style.opacity=(step(.24,.39,p)).toFixed(3);
 if(reduced.matches){$('.b-portal-photo').style.setProperty('--radius','150%');$('.b-map-frame').style.opacity='.23';$('.b-focus-flash').style.opacity='0'}
}

all('.b-audience').forEach((v,i)=>v.addEventListener('click',()=>{if(reduced.matches){document.body.dataset.role=['Shopper','Trader','Market organiser'][i];all('.b-audience').forEach((n,j)=>{n.classList.toggle('is-current',j===i);n.setAttribute('aria-pressed',j===i?'true':'false')});return;}const distance=Math.max(1,journey.offsetHeight-innerHeight);scrollTo({top:journey.offsetTop+distance*[.10,.49,.87][i],behavior:'smooth'})}));
request();window.__MDPreview.get=()=>({progress,searchVisible:getComputedStyle(search).opacity,forms:all('form').length,role:document.body.dataset.role||''});
})();
