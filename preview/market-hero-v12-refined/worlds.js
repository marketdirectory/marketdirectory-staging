// Original miniature market worlds for the three Market Directory audiences.
// Refined V12.1: clearer, more recognisable scenes for shopper, trader and organiser.
export function createWorlds(THREE){
 const materials = new Map();
 const mat=(color,roughness=.5,metalness=0,extra={})=>{
   const key=`${color}/${roughness}/${metalness}/${JSON.stringify(extra)}`;
   if(!materials.has(key)) materials.set(key,new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:metalness>.2?.35:.08,clearcoatRoughness:.28,...extra}));
   return materials.get(key);
 };
 const M={
   walnut:mat('#72513c',.74), wood:mat('#a87a55',.7), woodLight:mat('#d3a37d',.64), cream:mat('#fff3e0',.45),
   orange:mat('#ea7720',.38), orangeDeep:mat('#c85b16',.44), red:mat('#e85b35',.34), gold:mat('#ddb25d',.26,.58),
   green:mat('#74a05f',.72), mint:mat('#a9c8aa',.72), paper:mat('#f8efdd',.72), slate:mat('#3f4650',.62),
   path:mat('#ead8c0',.82), pin:mat('#f18028',.34)
 };
 const add=(g,geom,material,pos=[0,0,0],rot=[0,0,0],scale=null)=>{const m=new THREE.Mesh(geom,material);m.position.set(...pos);m.rotation.set(...rot);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const box=(g,w,h,d,x,y,z,m,rot=[0,0,0])=>add(g,new THREE.BoxGeometry(w,h,d),m,[x,y,z],rot);
 const sphere=(g,r,x,y,z,m,s=12)=>add(g,new THREE.SphereGeometry(r,s,8),m,[x,y,z]);
 const cyl=(g,r,h,x,y,z,m,n=22,rot=[0,0,0])=>add(g,new THREE.CylinderGeometry(r,r,h,n),m,[x,y,z],rot);
 const cone=(g,r,h,x,y,z,m,n=18,rot=[0,0,0])=>add(g,new THREE.ConeGeometry(r,h,n),m,[x,y,z],rot);
 const plank=(g,x,y,z,w,h,d,m,rot=[0,0,0])=>box(g,w,h,d,x,y,z,m,rot);
 const base=(g)=>{cyl(g,.88,.11,0,-.77,-.01,M.woodLight,42);cyl(g,.80,.026,0,-.70,-.01,M.cream,42)};
 const fruitPile=(g,x,y,z,cols)=>{
   const colors=[M.orange,M.red,M.gold,M.green];
   cols.forEach((c,idx)=>sphere(g,.052,x+idx*.11,y,z+(idx%2)*.01,colors[c],12));
 };
 const signPost=(g,x,y,z,label='')=>{
   cyl(g,.018,.28,x,y-.02,z,M.walnut,8);box(g,.18,.085,.018,x,y+.10,z,M.paper);box(g,.145,.02,.012,x,y+.10,z+.012,M.orangeDeep);
 };
 const shopper=new THREE.Group();shopper.name='Shopper market vignette';base(shopper);
 // Basket of produce + a simple shopping bag: very legible at a glance.
 box(shopper,.44,.12,.26,0,-.50,.10,M.woodLight);
 for(const x of [-.17,-.05,.07,.19]) plank(shopper,x,-.50,.22,.02,.14,.02,M.walnut);
 for(const x of [-.17,-.05,.07,.19]) plank(shopper,x,-.50,-.02,.02,.14,.02,M.walnut);
 plank(shopper,0,-.42,.10,.46,.024,.28,M.walnut);
 fruitPile(shopper,-.17,-.34,.11,[0,1,2]);
 fruitPile(shopper,.02,-.34,.10,[3,2,0]);
 fruitPile(shopper,.21,-.34,.11,[1,0,3]);
 box(shopper,.20,.24,.07,.42,-.42,-.10,M.orange);
 const bagCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.35,-.30,-.10),new THREE.Vector3(.35,-.16,-.10),new THREE.Vector3(.49,-.16,-.10),new THREE.Vector3(.49,-.30,-.10)]);
 add(shopper,new THREE.TubeGeometry(bagCurve,18,.015,6,false),M.cream);
 signPost(shopper,-.55,-.46,.02);
 shopper.rotation.x=-.12;
 shopper.position.z=.12;

 const trader=new THREE.Group();trader.name='Trader miniature stall';base(trader);
 // Front-on striped awning stall with produce crates.
 for(const x of [-.46,.46]) box(trader,.05,.58,.05,x,-.45,.03,M.walnut);
 box(trader,1.04,.08,.42,0,-.34,.05,M.woodLight);
 box(trader,1.10,.05,.46,0,.10,.05,M.cream);
 const colors=[M.orange,M.cream,M.orange,M.cream,M.orange];
 colors.forEach((c,i)=>box(trader,.19,.15,.44,-.38+i*.19,.18,.05,c,[0,0,.02*(i-2)]));
 colors.forEach((c,i)=>cyl(trader,.09,.05,-.38+i*.19,.08,.24,c,18,[Math.PI/2,0,0]));
 for(const x of [-.30,0,.30]){box(trader,.22,.13,.18,x,-.18,.14,M.wood);fruitPile(trader,x-.05,-.09,.16,[0,1,3]);}
 signPost(trader,.58,-.38,-.05);
 for(let i=0;i<4;i++){sphere(trader,.036,-.33+i*.22,.00,.28,M.gold,10);cyl(trader,.006,.11,-.33+i*.22,.06,.28,M.walnut,7);}
 trader.rotation.y=Math.PI;
 trader.position.z=-.18;

 const organiser=new THREE.Group();organiser.name='Market organiser miniature plan';base(organiser);
 // Stylised market plan board: clipboard/map with stalls and a large locator pin.
 const board=box(organiser,1.05,.72,.06,0,-.33,.03,M.paper,[-.16,0,0]);
 box(organiser,.22,.06,.08,0,.04,.07,M.woodLight,[-.16,0,0]);
 // path and stall blocks on the board
 plank(organiser,0,-.33,.095,.18,.018,.44,M.path,[-.16,0,0]);
 for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const x=(col-1)*.24,z=(row-.5)*.22;
   box(organiser,.14,.06,.10,x,-.27,z+.07,(row+col)%2?M.orange:M.cream,[-.16,0,0]);
 }
 // map pin
 sphere(organiser,.11,0,-.20,.16,M.pin,14); cone(organiser,.09,.20,0,-.33,.16,M.pin,16,[Math.PI,0,0]); sphere(organiser,.032,0,-.19,.18,M.paper,10);
 // small corner tabs and stand
 for(const x of [-.43,.43]) cyl(organiser,.015,.52,x,-.55,.00,M.walnut,8,[0,0,.02*(x<0?-1:1)]);
 plank(organiser,0,-.77,.00,1.10,.05,.20,M.woodLight);
 organiser.rotation.x=-.18;
 organiser.position.z=.13;

 const worlds=[shopper,trader,organiser];
 for(const w of worlds){w.scale.setScalar(.92)}
 return {worlds,materials};
}