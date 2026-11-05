// Original miniature market worlds for the three Market Directory audiences.
// All props are procedural Three.js geometry (not flat cards or sprite images).
export function createWorlds(THREE){
 const materials = new Map();
 const mat=(color,roughness=.5,metalness=0)=>{
   const key=`${color}/${roughness}/${metalness}`;
   if(!materials.has(key)) materials.set(key,new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:metalness>.3?.7:.15,clearcoatRoughness:.25}));
   return materials.get(key);
 };
 const M={
  wood:mat('#a67243',.74),woodDark:mat('#765039',.72),woodLight:mat('#d3a278',.66),
  cream:mat('#fff0db',.46),orange:mat('#eb771d',.42),orangeDark:mat('#b74e19',.49),
  gold:mat('#d9a04a',.25,.78),leaf:mat('#5b8a57',.78),leaf2:mat('#90a66a',.78),
  apple:mat('#e64f28',.32),lemon:mat('#e9bc4e',.32),plum:mat('#a05a86',.42),
  sky:mat('#a1c7ae',.65),blue:mat('#588f96',.59),paper:mat('#f9f0dc',.68),
  slate:mat('#373d43',.62),ground:mat('#dfc6a7',.81)
 };
 const add=(g,geom,material,pos=[0,0,0],rot=[0,0,0],scale=null)=>{
   const m=new THREE.Mesh(geom,material);m.position.set(...pos);m.rotation.set(...rot);
   if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 };
 const box=(g,w,h,d,x,y,z,m)=>add(g,new THREE.BoxGeometry(w,h,d),m,[x,y,z]);
 const sphere=(g,r,x,y,z,m,s=12)=>add(g,new THREE.SphereGeometry(r,s,8),m,[x,y,z]);
 const cyl=(g,r,h,x,y,z,m,n=20)=>add(g,new THREE.CylinderGeometry(r,r,h,n),m,[x,y,z]);
 const plank=(g,x,y,z,w,h,d,m)=>box(g,w,h,d,x,y,z,m);
 const base=(g)=>{const floor=cyl(g,.92,.13,0,-.77,-.01,M.woodLight,42);cyl(g,.85,.033,0,-.695,-.01,M.cream,42);return floor};
 const makeCrate=(g,x,y,z,s=.30)=>{
   box(g,s,.20,s*.77,x,y,z,M.wood);
   for(const q of [-.38,.0,.38]){plank(g,x,y+q*s*.2,z+s*.40,s*.96,.022,.03,M.woodLight);plank(g,x,y+q*s*.2,z-s*.40,s*.96,.022,.03,M.woodDark)}
   plank(g,x-s*.40,y,z,.03,.22,s*.78,M.woodLight);plank(g,x+s*.40,y,z,.03,.22,s*.78,M.woodLight)
 };
 const produce=(g,x,y,z,color=M.apple,num=6,rad=.065)=>{
  for(let i=0;i<num;i++){const xx=x+(i%3-1)*rad*1.65, yy=y+Math.floor(i/3)*rad*1.4;
    sphere(g,rad,xx,yy,z+((i*7)%3-1)*.02,color,11);}
 };
 const flower=(g,x,y,z,col=M.plum)=>{
  cyl(g,.036,.14,x,y-.03,z,M.woodDark,9);
  for(let i=0;i<4;i++){const angle=i*Math.PI/2;
    add(g,new THREE.CylinderGeometry(.007,.01,.22,5),M.leaf,[x+Math.cos(angle)*.025,y+.12,z+Math.sin(angle)*.03],[0,0,angle]);
    sphere(g,.044,x+Math.cos(angle)*.052,y+.23,z+Math.sin(angle)*.04,col,9)}
  sphere(g,.027,x,y+.27,z,M.lemon,9);
 };
 const scallop=(g,x,y,z,color)=>{const s=sphere(g,.085,x,y,z,color,12);s.scale.set(1,.43,.42)};
 const awning=(g,x=0,y=.37,z=.06,scale=.95)=>{
  const cols=7,w=(scale*1.34)/cols, left=x-scale*.67;
  plank(g,x,y-.06,z,.036,.68,.035,M.woodDark);
  for(const side of [-1,1])plank(g,x+side*scale*.66,y-.27,z,.036,.9,.04,M.woodDark);
  plank(g,x,y,z,scale*1.45,.06,.47,M.cream);
  for(let i=0;i<cols;i++){
    const cx=left+w*(i+.5);plank(g,cx,y+.013,z,w*.98,.047,.49,i%2?M.cream:M.orange);
    scallop(g,cx,y-.04,z+.252,i%2?M.cream:M.orange)
  }
 };
 const lamp=(g,x,y,z)=>{
   sphere(g,.048,x,y,z,M.gold,10);add(g,new THREE.CylinderGeometry(.008,.008,.25,5),M.woodDark,[x,y+.14,z]);
 };
 const shopper=new THREE.Group();shopper.name='Shopper market vignette';base(shopper);
 // Miniature orchard market discovery: cobbled base, two product crates and flowers.
 plank(shopper,-.08,-.55,.04,1.06,.14,.43,M.wood);
 makeCrate(shopper,-.33,-.37,.36,.35);makeCrate(shopper,.23,-.37,.35,.35);
 produce(shopper,-.33,-.20,.38,M.apple,8,.067);produce(shopper,.23,-.20,.38,M.lemon,7,.058);
 flower(shopper,-.69,-.54,.21,M.plum);flower(shopper,.67,-.53,.13,M.orange);
 for(let i=0;i<5;i++)sphere(shopper,.067,-.54+i*.26,-.13,-.17,i%2?M.leaf:M.leaf2,9);
 // Woven shopper basket, arch handle, gold buckle.
 const basket=box(shopper,.21,.26,.13,.48,-.28,-.16,M.woodLight);
 for(let i=0;i<6;i++)plank(shopper,.39+i*.036,-.28,-.09,.016,.22,.01,M.woodDark);
 const handleCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.40,-.19,-.16),new THREE.Vector3(.40,-.02,-.16),new THREE.Vector3(.57,-.02,-.16),new THREE.Vector3(.57,-.19,-.16)]);
 add(shopper,new THREE.TubeGeometry(handleCurve,16,.018,7,false),M.gold);
 shopper.rotation.x=-.1;
 const trader=new THREE.Group();trader.name='Trader miniature stall';base(trader);
 awning(trader,0,.52,-.04,.90);
 box(trader,1.15,.09,.55,0,-.36,.08,M.woodLight);
 for(const xx of [-.48,.48])box(trader,.053,.60,.06,xx,-.50,.03,M.woodDark);
 makeCrate(trader,-.37,-.20,.36,.27);makeCrate(trader,.00,-.20,.36,.27);makeCrate(trader,.36,-.20,.36,.27);
 produce(trader,-.37,-.05,.38,M.apple,6,.05);produce(trader,0,-.05,.38,M.lemon,6,.05);produce(trader,.36,-.05,.38,M.leaf2,7,.05);
 // Tiny string lights along market awning
 for(let i=0;i<5;i++)lamp(trader,-.5+i*.25,.25,.32);
 // Cashbox: small dark till, brass rim, custom embossed drawer.
 box(trader,.22,.14,.14,.34,-.14,-.19,M.slate);plank(trader,.34,-.10,-.11,.11,.022,.017,M.gold);
 trader.rotation.y=Math.PI;trader.position.z=-.13;
 const organiser=new THREE.Group();organiser.name='Market organiser aerial plan';base(organiser);
 const p=box(organiser,1.43,.055,1.03,0,-.59,.015,M.paper);p.rotation.x=-.24;
 // Walkable street with twelve miniature market stalls and coordinated orange path.
 plank(organiser,0,-.555,.015,.26,.01,.89,M.ground);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const xx=(col-1.5)*.31,zz=(row-1)*.28;const yy=-.48;
  const stall=box(organiser,.21,.12,.16,xx,yy,zz,(row+col)%2?M.orange:M.cream);
  plank(organiser,xx,yy+.075,zz,.24,.018,.19,(row+col)%2?M.orangeDark:M.woodLight);
 }
 for(let i=0;i<5;i++)sphere(organiser,.027,-.6+i*.3,-.37,.4,i%2?M.gold:M.orange,9);
 for(const [x,z] of [[-.64,.26],[.59,-.24],[0,.38]]){
   const pin=sphere(organiser,.073,x,-.17,z,M.orange,12);
   add(organiser,new THREE.ConeGeometry(.075,.18,11),M.orange,[x,-.28,z],[Math.PI,0,0]);sphere(organiser,.021,x,-.157,z,M.paper,9);
 }
 organiser.rotation.x=-.16;
 const worlds=[shopper,trader,organiser];
 // Cull miniatures when edge-on; only one world occupies the glass at a time.
 for(const [idx,w] of worlds.entries()){
   w.name=['Shopper','Trader','Market organiser'][idx];w.scale.setScalar(.83);w.position.z=idx===1?-.16:.16;
 }
 return {worlds,materials};
}