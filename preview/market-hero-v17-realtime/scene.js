import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const ink=0x182438,orange=0xe65a08,ivory=0xfff1d5;
const rand=(seed)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const R=rand(2026),group=new THREE.Group(),fabricWaves=[],people=[];
const standard=(color,roughness=.77,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const m={
 stone:standard(0xd9c8ad),lightStone:standard(0xf4e8d2),border:standard(0xe9dcc7),
 timber:standard(0x75513d),timberLight:standard(0xa97b53),timberDark:standard(0x493526),
 orange:standard(orange),orangeLight:standard(0xea9251),cream:standard(ivory),
 ivory:standard(0xf8f1e5),clay:standard(0xbc784f),ceramic:standard(0xece6d9,.33),
 ceramic2:standard(0x9ba89c,.38),navy:standard(ink),forest:standard(0x49684e),
 leaves:standard(0x5f7850),leafAlt:standard(0x9ca76c),yellow:standard(0xf2c56b),
 red:standard(0xc94b35),metal:standard(0x7b7367,.34,.58),
 sand:standard(0xdac6a2),glass:standard(0xe2b477,.2,.42)
};
const box=(parent,mat,w,h,d,x,y,z,shadow=true)=>{
 const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);a.position.set(x,y,z);
 a.castShadow=shadow;a.receiveShadow=true;parent.add(a);return a};
const ball=(parent,mat,r,x,y,z,segments=12)=>{
 const a=new THREE.Mesh(new THREE.IcosahedronGeometry(r,segments>12?2:1),mat);a.position.set(x,y,z);a.castShadow=true;parent.add(a);return a};
const cyl=(parent,mat,r1,r2,height,x,y,z)=>{
 const a=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,height,12),mat);a.position.set(x,y,z);a.castShadow=true;parent.add(a);return a};
const lathe=(parent,mat,profile,x,y,z)=>{
 const geo=new THREE.LatheGeometry(profile.map(([r,yy])=>new THREE.Vector2(r,yy)),18);
 const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
function canvasTexture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex}
function labelTexture(text,bg='#fdf4e3',color='#74533a',width=512){
 return canvasTexture((g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=color;g.font='bold 61px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2,460)},width,128)}
const paving=canvasTexture((g,w,h)=>{
 g.fillStyle='#d4c5ae';g.fillRect(0,0,w,h);const rr=rand(42);
 for(let row=0;row<16;row++)for(let col=0;col<11;col++){
  const x=col*48+(row%2)*24,y=row*32;
  g.fillStyle=['#dfd0b8','#bcae98','#e4d9c9','#c9baa5'][(rr()*4)|0];
  g.fillRect(x+2,y+2,44,28);
  g.fillStyle='rgba(78,64,46,.11)';g.fillRect(x+5,y+26,42,3)
 }
},512,512);paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(1.8,5.2);
const wooden=canvasTexture((g,w,h)=>{g.fillStyle='#9b7554';g.fillRect(0,0,w,h);let rr=rand(97);for(let i=0;i<130;i++){g.strokeStyle=rr()>.5?'rgba(48,26,19,.11)':'rgba(255,239,190,.10)';g.lineWidth=.4+rr()*1.4;g.beginPath();let y=rr()*h;g.moveTo(0,y);g.bezierCurveTo(w*.27,y+rr()*6,w*.64,y-rr()*8,w,y+rr()*9);g.stroke()}},512,512);
m.timberLight.map=wooden;m.timberLight.needsUpdate=true;

function roundSlab(w,d,h,color,bevel=.18){
 const s=new THREE.Shape();const r=.75;
 s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
 s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);
 s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);
 s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
 const geo=new THREE.ExtrudeGeometry(s,{depth:h,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:bevel,bevelSize:bevel,curveSegments:5});
 geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,standard(color,.87));mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
const plinth=roundSlab(19,32,.64,0xcdb69b);
plinth.position.y=-.55;plinth.position.z=-1;group.add(plinth);
const plinthEdge=roundSlab(18.7,31.7,.09,0xe2cfb2,.08);plinthEdge.position.y=.04;plinthEdge.position.z=-1;group.add(plinthEdge);
const lane=new THREE.Mesh(new THREE.PlaneGeometry(4.8,30.3),new THREE.MeshStandardMaterial({map:paving,roughness:1}));
lane.rotation.x=-Math.PI/2;lane.position.set(0,.18,-1);lane.receiveShadow=true;group.add(lane);
for(const x of [-2.49,2.49])box(group,m.lightStone,.14,.14,30.3,x,.22,-1,false);
for(let z=-15;z<14;z+=2.5)for(let side of [-1,1]){box(group,m.sand,.3,.28,.95,side*7.75,.36,z+.7,false)}

function label(parent,txt,w,h,x,y,z,bg='#f8edda',fg='#604736'){
 const tex=labelTexture(txt,bg,fg);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide}));
 mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function ceramic(parent,x,y,z,clr=m.ceramic,s=1){
 const p=[[.01,0],[.23,.01],[.30,.12],[.31,.18],[.23,.27],[.18,.36],[.2,.55],[.28,.61],[.25,.67],[.01,.67]];
 const vase=lathe(parent,clr,p,x,y,z);vase.scale.setScalar(s);return vase
}
function createFlowers(parent,x,y,z,count=11){
 const greens=[m.leaves,m.forest,m.leafAlt],pink=standard(0xd88b7e),lav=standard(0xbb9fb6);
 for(let i=0;i<count;i++){
 const angle=R()*Math.PI*2,rad=R()*.32,s=.6+R()*.8;
 const stem=cyl(parent,greens[i%3],.018,.022,.75*s,x+Math.cos(angle)*rad,y+.40*s,z+Math.sin(angle)*rad);
 stem.rotation.z=(R()-.5)*.28;
 ball(parent,i%3===0?pink:(i%3===1?lav:m.yellow),.095*s,x+Math.cos(angle)*rad,y+.85*s,z+Math.sin(angle)*rad);
 ball(parent,greens[i%3],.11*s,x+(Math.cos(angle)*rad)+.1,y+.54*s,z+Math.sin(angle)*rad);
 }
}
function woodenCrate(parent,x,y,z,fill){
 box(parent,m.timberDark,1,.09,.8,x,y+.05,z);
 for(let ax of [-.45,.45])for(let zz of [-.36,.36])box(parent,m.timberDark,.07,.43,.07,x+ax,y+.25,z+zz);
 for(let zz of [-.39,.39])box(parent,m.timberLight,.94,.16,.06,x,y+.22,z+zz);
 if(fill==='produce')for(let k=0;k<15;k++){const a=R()*Math.PI*2,s=.07+R()*.045;ball(parent,k%3===0?m.red:(k%3===1?m.yellow:m.forest),s,x+(R()-.5)*.77,y+.41+(R()*.11),z+(R()-.5)*.54)}
}
function canopy(parent,accent,w=4.4,d=3.7){
 // Tensioned fabric roof, a raised central seam, angled draped sides and individual colour stripes.
 const edgeY=3.42,ridgeY=3.91,panels=10,matCream=new THREE.MeshStandardMaterial({color:0xffedcf,roughness:1,side:THREE.DoubleSide});
 const accentShade=accent===m.forest?new THREE.MeshStandardMaterial({color:0x587965,roughness:1,side:THREE.DoubleSide}):new THREE.MeshStandardMaterial({color:0xcb683e,roughness:1,side:THREE.DoubleSide});
 for(let k=0;k<panels;k++){
  const vertices=[],uvs=[],idx=[];
  const sx=-w/2+k*w/panels,step=w/panels;
  for(let iz=0;iz<=10;iz++){
   for(let ix=0;ix<=3;ix++){
    const localX=sx+ix*step/3;
    const localZ=-d/2+iz*d/10;
    const arc=1-Math.pow(Math.abs(localX/(w/2)),1.42);
    const wave=Math.sin(iz/10*Math.PI)*.035;
    vertices.push(localX,edgeY+(ridgeY-edgeY)*arc+wave,localZ);
    uvs.push(ix/3,iz/10);
   }
  }
  for(let iz=0;iz<10;iz++)for(let ix=0;ix<3;ix++){
   const a=iz*4+ix,b=a+1,c=a+4,d2=c+1;
   idx.push(a,c,b,b,c,d2)
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(idx);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,k%3===0?accentShade:matCream);
  mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  fabricWaves.push({mesh,base:0,phase:k*.51+R()*2});
 }
 const trim=new THREE.MeshStandardMaterial({color:0xa67554,roughness:.81});
 box(parent,trim,w+.06,.09,.07,0,edgeY-.05,-d/2);
 box(parent,trim,w+.06,.09,.07,0,edgeY-.05,d/2);
 const valanceStripe=new THREE.MeshStandardMaterial({color:accent===m.forest?0x597660:0xca663b,roughness:1});
 for(let j=0;j<panels;j++){
  const xx=-w/2+(j+.5)*w/panels;
  const sidePanel=box(parent,j%3===0?valanceStripe:matCream,w/panels+.006,.34,.07,xx,edgeY-.22,d/2+.035);
  sidePanel.castShadow=true;
  const scallop=ball(parent,j%3===0?valanceStripe:matCream,.155,xx,edgeY-.385,d/2+.043,10);
  scallop.scale.set(w/panels/.31,.44,.19);
 }
 box(parent,trim,.07,.07,d,-w/2,edgeY-.13,0);
 box(parent,trim,.07,.07,d,w/2,edgeY-.13,0);
}

function stall(side,z,kind,sign,accent){
 const parent=new THREE.Group();parent.position.set(side*5.05,.15,z);
 parent.rotation.y=side===1?Math.PI/2:-Math.PI/2;group.add(parent);
 const w=4.3,d=3.5;
 box(parent,m.timberDark,w,.13,d,0,.05,0);
 for(const x of [-1.98,1.98])for(const zz of [-1.53,1.53]){
  box(parent,m.timberLight,.10,3.26,.12,x,1.72,zz);
  box(parent,m.timberDark,.13,.12,.13,x,3.19,zz);
 }
 canopy(parent,accent,w,d);
 box(parent,m.timberLight,w-.13,.20,1.1,0,1.19,.65);
 box(parent,m.timberDark,w-.1,.14,.12,0,.98,1.19);
 box(parent,m.timberLight,w-.26,.12,.95,0,1.12,-1.25);
 // floating sign under canopy; cloth and sign each hold physically in 3D
 const plaque=box(parent,m.timberDark,2.55,.64,.12,0,2.86,1.12);
 label(parent,sign,2.35,.49,0,2.87,1.19,'#f7ead5','#574031');
 // goods and decoration
 if(kind==='ceramic'){
 for(let j=0;j<14;j++){let x=-1.72+(j%7)*.58,z0=j<7?.8:-1.15;
 ceramic(parent,x,j<7?1.31:1.27,z0,j%3===0?m.ceramic2:j%3===1?m.clay:m.ceramic,.55+(j%3)*.18)}
 createFlowers(parent,-1.55,1.32,-1.02,9);
 }else if(kind==='flowers'){
 for(let j=0;j<7;j++){ceramic(parent,-1.62+j*.53,1.33,.75,m.clay,.8);createFlowers(parent,-1.62+j*.53,1.55,.75,6)}
 createFlowers(parent,-.75,1.38,-1.2,12);createFlowers(parent,.9,1.38,-1.2,10);
 }else if(kind==='food'){
 for(let j=0;j<3;j++)woodenCrate(parent,-1.2+j*1.2,1.28,.7,'produce');
 for(let j=0;j<4;j++)woodenCrate(parent,-1.56+j*1.05,.24,-.9,'produce');
 }else{
 for(let j=0;j<5;j++){woodenCrate(parent,-1.6+j*.8,1.28,.64,'produce');ceramic(parent,-1.7+j*.8,1.34,-1.13,j%2?m.ceramic:m.ceramic2,.48)}
 }
 // pendant lights, warm emissive without expensive real light passes
 const bulbMat=new THREE.MeshStandardMaterial({color:0xffebbe,emissive:0xf8ac61,emissiveIntensity:.7});
 for(const x of [-1.2,0,1.2]){box(parent,m.metal,.018,.38,.018,x,3.12,.45,false);ball(parent,bulbMat,.12,x,2.89,.45,16)}
 return parent;
}
const shops=[
 stall(-1,9,'flowers','FLOWERS',m.orange),
 stall(1,7,'ceramic','CERAMICS',m.forest),
 stall(-1,1,'food','PRODUCE',m.orangeLight),
 stall(1,-1,'flowers','BLOOMS',m.orange),
 stall(-1,-7,'ceramic','MAKERS',m.forest),
 stall(1,-9,'food','MARKET DELI',m.orange)
];
function lamppost(x,z){
 const g=new THREE.Group();g.position.set(x,.14,z);group.add(g);
 cyl(g,m.metal,.065,.075,3.0,0,1.5,0);
 const arm=box(g,m.metal,.95,.08,.08,x>0?-.42:.42,2.9,0);
 const glowMat=new THREE.MeshStandardMaterial({color:0xffe5a7,emissive:0xffa64f,emissiveIntensity:.92});
 ball(g,glowMat,.22,x>0?-.85:.85,2.62,0,16);
}
for(let z=-12;z<=12;z+=6){lamppost(-2.72,z);lamppost(2.72,z)}
// Stone shopfront wall behind the final stall rows, to close the market world with spatial depth
const facade=new THREE.Group();facade.position.set(0,0,-16.4);group.add(facade);
box(facade,m.clay,16,4.8,.72,0,2.5,0);
for(let j=0;j<6;j++){
 const x=-6.5+j*2.6;
 box(facade,m.ivory,1.5,2.05,.08,x,2.60,.44,false);
 box(facade,m.navy,1.27,1.73,.09,x,2.60,.52,false);
 box(facade,m.timberLight,.12,1.73,.12,x,2.60,.59,false);
 box(facade,m.timberLight,1.27,.12,.12,x,2.60,.59,false);
}
box(facade,m.lightStone,16.6,.33,1.08,0,4.95,0);

// Abstract market visitors: sculpted silhouettes at human scale, never close enough for fake faces.
function visitor(x,z,hue){
 const g=new THREE.Group();g.position.set(x,.18,z);group.add(g);
 const coat=standard(hue),skin=standard(0xb88062);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.22,.33,1.18,9),coat);torso.position.y=1.22;torso.castShadow=true;g.add(torso);
 ball(g,skin,.195,0,2.05,0,20);
 for(let k of [-1,1]){const leg=box(g,m.navy,.14,.75,.19,k*.13,.43,0);leg.rotation.x=k*.08;}
 const tote=box(g,m.cream,.25,.35,.1,.37,1.00,.12,false);
 people.push({g,z,phase:R()*6.3,speed:.025+R()*.03});
}
for(const [x,z,h] of [[-.65,-11,0x3f6571],[.8,-13,0x6a433f]]){
 visitor(x,z,h);people[people.length-1].g.scale.setScalar(.63);
}
// Strung lights across the aisle create the real market's depth and warmth.
const wireMat=standard(0x48382f,.81);
const glowBulb=new THREE.MeshStandardMaterial({color:0xffdfa0,emissive:0xffaf58,emissiveIntensity:1.5,roughness:.25});
for(const z of [10,3,-4,-11]){
 const rope=new THREE.CatmullRomCurve3([new THREE.Vector3(-6,4.06,z),new THREE.Vector3(0,3.75,z),new THREE.Vector3(6,4.06,z)]);
 const line=new THREE.Mesh(new THREE.TubeGeometry(rope,24,.018,6,false),wireMat);line.castShadow=false;group.add(line);
 for(let k=0;k<9;k++){
  const q=rope.getPoint(k/8);
  ball(group,glowBulb,.065,q.x,q.y-.10,q.z,16);
 }
}
// Planters, clay pots and leafy branches complete the little pedestrian high street.
for(const x of [-7.55,7.55])for(const z of [-11,-4,3,10]){
 const y=.22;
 cyl(group,m.clay,.29,.22,.65,x,y+.35,z);
 cyl(group,m.timberDark,.34,.34,.07,x,y+.70,z);
 for(let i=0;i<9;i++){
  const angle=i*2.4+R()*.5,len=.75+R()*.42;
  const px=x+Math.cos(angle)*len*.3,pz=z+Math.sin(angle)*len*.3;
  const leaf=ball(group,i%3===0?m.leafAlt:m.leaves,.25,px,y+.95+R()*.55,pz,12);
  leaf.scale.set(.7,1.3,.5);
 }
}

const floorDust=new THREE.BufferGeometry(),points=new Float32Array(140*3);
for(let i=0;i<140;i++){points[i*3]=(R()-.5)*17;points[i*3+1]=.45+R()*4.3;points[i*3+2]=(R()-.5)*27}
floorDust.setAttribute('position',new THREE.BufferAttribute(points,3));
const dust=new THREE.Points(floorDust,new THREE.PointsMaterial({color:0xffd7a1,size:.085,transparent:true,opacity:.49,depthWrite:false}));group.add(dust);


// Bake and batch stationary geometry by material. Crucial: stalls contain hundreds of
// separate pots, flowers and timber details; without merging these trigger >1000 draw calls.
// Moving visitors, fabric roofs and drifting particles remain individually animated.
function combineStaticMeshes(){
 group.updateMatrixWorld(true);
 const dynamic=new Set(fabricWaves.map(f=>f.mesh));
 for(const entry of people)entry.g.traverse(o=>dynamic.add(o));
 const sets=new Map();
 group.traverse(obj=>{
  if(!obj.isMesh||dynamic.has(obj)||Array.isArray(obj.material))return;
  const key=obj.material.uuid;
  if(!sets.has(key))sets.set(key,{material:obj.material,items:[]});
  sets.get(key).items.push(obj);
 });
 let mergedCount=0;
 for(const {material,items} of sets.values()){
  if(items.length<2)continue;
  const geos=[],valid=[];
  for(const obj of items){
   try{
    const original=obj.geometry;
    let geo=original.index?original.toNonIndexed():original.clone();
    if(!geo.getAttribute('normal'))geo.computeVertexNormals();
    const size=geo.getAttribute('position').count;
    if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(size*2),2));
    for(const attr of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(attr))geo.deleteAttribute(attr);
    geo.clearGroups();
    geo.applyMatrix4(obj.matrixWorld);
    geos.push(geo);valid.push(obj);
   }catch(e){console.warn('[V17] could not prepare static mesh',e)}
  }
  if(geos.length<2)continue;
  const merged=mergeGeometries(geos,false);
  if(!merged){console.warn('[V17] batch failed',material.uuid);continue}
  const batch=new THREE.Mesh(merged,material);
  batch.castShadow=valid.some(o=>o.castShadow);
  batch.receiveShadow=valid.some(o=>o.receiveShadow);
  batch.frustumCulled=false;
  valid.forEach(o=>o.removeFromParent());
  group.add(batch);mergedCount+=valid.length;
  geos.forEach(geo=>geo.dispose());
 }
 return mergedCount;
}
const staticBatched=combineStaticMeshes();

export const MARKET={group,
update(now){
 const t=now*.001;
 for(const v of fabricWaves)v.mesh.position.y=v.base+Math.sin(t*1.28+v.phase)*.022;
 for(const p of people){p.g.position.z=p.z+Math.sin(t*p.speed*23+p.phase)*.19;p.g.rotation.y=Math.sin(t*.37+p.phase)*.35;}
 dust.rotation.y=Math.sin(t*.16)*.008;
 },
center:new THREE.Vector3(0,1.5,0),
stats:()=>({stalls:shops.length,drawObjects:group.children.length,batched:staticBatched})
};

