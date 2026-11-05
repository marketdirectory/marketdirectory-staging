// Original product-grade procedural magnifying glass. No licensed third-party mesh is distributed.
// Refined V12.1 materials: premium champagne brass, softer highlights, warmer walnut handle.
export function createMagnifier(THREE){
 const root=new THREE.Group();root.name='Market Directory / original 3D magnifier';
 const mat=(c,metal=0,rough=.3,rest={})=>new THREE.MeshPhysicalMaterial({color:c,metalness:metal,roughness:rough,clearcoat:.35,clearcoatRoughness:.24,...rest});
 const brass=mat(0xb9966e,.92,.34);
 const brassLight=mat(0xd7c3a3,.78,.26);
 const brassDark=mat(0x8e6d4e,.84,.42);
 const collar=mat(0xc7ab89,.7,.28);
 const walnut=mat(0x4b352a,.18,.48,{clearcoat:.18});
 const leatherRib=mat(0x6b5243,.12,.56,{clearcoat:.1});
 const glass=mat(0xfffcf7,0,.05,{transparent:true,opacity:.12,transmission:.96,ior:1.46,thickness:.22,depthWrite:false,side:THREE.DoubleSide});
 const highlight=mat(0xffffff,0,.08,{transparent:true,opacity:.03,depthWrite:false,side:THREE.DoubleSide});
 const mount=(geometry,material,at=null)=>{const mesh=new THREE.Mesh(geometry,material);if(at)mesh.position.copy(at);mesh.castShadow=material!==glass&&material!==highlight;mesh.receiveShadow=true;root.add(mesh);return mesh};
 // Main ring – a calmer brass tone and subtler layered profile.
 mount(new THREE.TorusGeometry(1.035,.102,26,168),brass);
 mount(new THREE.TorusGeometry(1.03,.034,16,168),brassLight,new THREE.Vector3(0,0,.082));
 mount(new THREE.TorusGeometry(.945,.018,12,168),brassDark,new THREE.Vector3(0,0,.068));
 mount(new THREE.TorusGeometry(1.13,.015,10,168),brassDark,new THREE.Vector3(0,0,-.018));
 mount(new THREE.CircleGeometry(.947,168),glass,new THREE.Vector3(0,0,.003)).renderOrder=3;
 const reflect=mount(new THREE.SphereGeometry(.945,52,26),highlight,new THREE.Vector3(0,0,.006));reflect.scale.z=.038;reflect.renderOrder=4;
 // Neck + handle.
 const axis=new THREE.Vector3(Math.SQRT1_2,-Math.SQRT1_2,0);
 const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
 function shaft(r1,r2,len,from,material){
   const m=mount(new THREE.CylinderGeometry(r1,r2,len,28,1),material,axis.clone().multiplyScalar(from+len/2));
   m.quaternion.copy(quat);return m;
 }
 shaft(.108,.112,.30,1.07,brassDark);
 shaft(.125,.126,.09,1.31,collar);
 shaft(.146,.142,.95,1.40,walnut);
 shaft(.132,.132,.06,2.30,collar);
 shaft(.120,.118,.045,2.35,brassLight);
 for(let i=0;i<5;i++){const ring=shaft(.148,.148,.012,1.54+i*.16,leatherRib);ring.scale.set(1,.46,1)}
 // subtle nose collar where handle meets frame
 const throat=mount(new THREE.CylinderGeometry(.085,.105,.065,22),brass,new THREE.Vector3(.76,-.76,.01));
 throat.quaternion.copy(quat);
 root.rotation.z=.045;
 return root;
}