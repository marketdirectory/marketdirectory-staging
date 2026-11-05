// Original product-grade procedural magnifying glass. No licensed third-party mesh is distributed.
// A real 3D object: circular barrel, multi-layer metal rim, physical glass, solid neck and grip.
export function createMagnifier(THREE){
 const root=new THREE.Group();root.name='Market Directory / original 3D magnifier';
 const mat=(c,metal=0,rough=.3,rest={})=>new THREE.MeshPhysicalMaterial({color:c,metalness:metal,roughness:rough,clearcoat:.65,clearcoatRoughness:.14,...rest});
 const gold=mat(0xbd8242,.93,.19),goldBright=mat(0xffc776,.83,.14),goldDark=mat(0x704121,.86,.30),blackWood=mat(0x291b1b,.12,.30,{clearcoat:.5}),glass=mat(0xfffbf6,0,.045,{transparent:true,opacity:.15,transmission:.92,ior:1.46,thickness:.26,depthWrite:false,side:THREE.DoubleSide});
 const mount=(geometry,material,at=null)=>{const mesh=new THREE.Mesh(geometry,material);if(at)mesh.position.copy(at);mesh.castShadow=material!==glass;mesh.receiveShadow=true;root.add(mesh);return mesh};
 // Main rim: thick, fully round barrel, polished front, shadowed side, inner golden bevel.
 const rim=mount(new THREE.TorusGeometry(1.03,.122,24,150),gold);
 const front=mount(new THREE.TorusGeometry(1.025,.052,16,150),goldBright,new THREE.Vector3(0,0,.093));
 const interior=mount(new THREE.TorusGeometry(.931,.022,12,150),goldDark,new THREE.Vector3(0,0,.081));
 const outer=mount(new THREE.TorusGeometry(1.145,.018,10,150),goldDark,new THREE.Vector3(0,0,-.028));
 mount(new THREE.CircleGeometry(.94,150),glass,new THREE.Vector3(0,0,.006)).renderOrder=3;
 // Convex micro-reflection within the glass (a real thin disc in 3D space).
 const reflect=mount(new THREE.SphereGeometry(.94,52,26),mat(0xfff8ef,0,.075,{transparent:true,opacity:.036,depthWrite:false,side:THREE.DoubleSide}),new THREE.Vector3(0,0,.007));reflect.scale.z=.043;reflect.renderOrder=4;reflect.castShadow=false;
 // Rigid diagonal shaft with brass fittings and a dark walnut grip.
 const axis=new THREE.Vector3(Math.SQRT1_2,-Math.SQRT1_2,0);
 const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
 function shaft(r1,r2,len,from,material){
   const m=mount(new THREE.CylinderGeometry(r1,r2,len,24,1),material,axis.clone().multiplyScalar(from+len/2));
   m.quaternion.copy(quat);return m;
 }
 shaft(.126,.129,.37,1.05,gold);
 shaft(.144,.14,.105,1.36,goldBright);
 shaft(.16,.16,.080,1.47,goldDark);
 shaft(.155,.127,1.25,1.52,blackWood);
 shaft(.134,.134,.075,2.70,goldDark);
 shaft(.129,.129,.042,2.78,goldBright);
 // subtle engraved grip ribs, actual 3D geometry visible on turn
 for(let i=0;i<7;i++){shaft(.159,.159,.009,1.70+i*.13,goldDark).scale.set(1,.42,1)}
 root.rotation.z=.05;
 return root;
}