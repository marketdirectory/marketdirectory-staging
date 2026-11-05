/* Independent progressive enhancement layer. Works when WebGL, Three.js, GSAP or CDN is blocked.
   The full module takes over using the same progress range if it loads. */
(()=>{'use strict';
 const ids=id=>document.getElementById(id),clamp=x=>Math.max(0,Math.min(1,x)),lerp=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,v)=>{let t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const title=ids('line1'),title2=ids('line2');
 let initialized=false,scheduled=false,abort=false;
 function enter(){
  if(abort||window.__v12Ready||initialized)return;
  initialized=true;document.documentElement.classList.add('v12-enhanced');
  if(!reduced.matches){
   const all=[title,title2];const letters=[];
   for(const [j,e] of all.entries()){
    const first=e.firstChild;if(first?.nodeType!==3)continue;
    const raw=first.textContent;first.remove();const wrap=document.createElement('span');wrap.className='title-word';
    [...raw].forEach((ch,i)=>{
     const span=document.createElement('span');span.className='char';span.textContent=ch===' '?'\u00a0':ch;wrap.append(span);letters.push({span,delay:(j?730:160)+i*38});
    });e.prepend(wrap);
   }
   for(const {span,delay} of letters){
    span.animate([{opacity:0,transform:'translateY(85%) rotateX(75deg) scale(.87)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) rotateX(0) scale(1)',filter:'blur(0)'}],{duration:920,delay,easing:'cubic-bezier(.22,1.7,.32,1)',fill:'both'});
   }
   ids('kicker').animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:750,easing:'ease-out',fill:'both'});
  }
  update();
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 }
 function schedule(){if(!scheduled&&!abort){scheduled=true;requestAnimationFrame(update)}}
 function update(){scheduled=false;if(window.__v12Ready){abort=true;return}if(!initialized)return;
  const j=ids('journey'),dist=Math.max(1,j.offsetHeight-innerHeight),p=reduced.matches?1:clamp((scrollY-j.offsetTop)/dist);
  const show=smooth(.12,.295,p),q=smooth(.24,.39,p);
  const search=ids('search-zone');search.style.opacity=show;search.style.transform=`translateY(${lerp(28,0,show)}px) scale(${lerp(.94,1,show)})`;
  search.classList.toggle('is-ready',show>.92);search.inert=show<.92;
  const quick=ids('quick-links');quick.style.opacity=q;quick.style.transform=`translateY(${lerp(14,0,q)}px)`;
  ids('underline-path').style.strokeDashoffset=lerp(660,0,smooth(.28,.49,p));
  const role=p<.28?0:p<.64?1:2, names=['Shopper','Trader','Market organiser'];
  ids('role-label').textContent=names[role];document.querySelectorAll('.role-bars i').forEach((v,i)=>v.classList.toggle('active',i===role));
  ids('progress-fill').style.width=(p*100).toFixed(1)+'%';
  ids('scroll-cue').style.opacity=1-smooth(.05,.2,p);ids('skip').hidden=p>.85||reduced.matches;
  window.__v12FallbackState={progress:p,role:names[role],formActive:show>.92};
 }
 setTimeout(enter,900);
})();