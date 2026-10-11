import * as THREE from "three";
import type { Site } from "../../content/types";
import type { TourHotspot } from "./config";

const mat = (color: number, roughness = 0.82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  earth: mat(0xb5a586), road: mat(0x69665b), stone: mat(0xb8b0a0), red: mat(0x9f4738), deepRed: mat(0x71362e), cream: mat(0xe6d7b6), roof: mat(0x343b39), jade: mat(0x567b63), gold: mat(0xd4a43e, 0.33, 0.28), goldLight: mat(0xf2ce69, 0.37, 0.2), blue: mat(0x6d9f9e), pink: mat(0xcf8274), green: mat(0x719171), white: mat(0xf0e8d8), glass: mat(0x547c70, 0.25, 0.15), dark: mat(0x393a33),
};
function box(parent: THREE.Object3D, x:number,y:number,z:number,w:number,h:number,d:number, material:THREE.Material) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r1:number,r2:number,h:number,material:THREE.Material,segments=16) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);mesh.position.set(x,y+h/2,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function sphere(parent:THREE.Object3D,x:number,y:number,z:number,r:number,material:THREE.Material,scale?:[number,number,number]) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),material);mesh.position.set(x,y,z);if(scale)mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function post(parent:THREE.Object3D,x:number,z:number,h:number,material:THREE.Material,r=0.12) { cylinder(parent,x,0,z,r,r,h,material,12); }
function roof(parent:THREE.Object3D,x:number,y:number,z:number,w:number,d:number,material:THREE.Material,peak=0.65) {
  // Four sloped planes form a hipped roof with subtly lifted eaves, rather than a generic flat box.
  const corners=[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]] as const;
  const top=[[-w*.22,peak,-d*.22],[w*.22,peak,-d*.22],[w*.22,peak,d*.22],[-w*.22,peak,d*.22]] as const;
  const positions:number[]=[];
  for(let i=0;i<4;i++){const n=(i+1)%4;positions.push(...corners[i],...corners[n],...top[n],...corners[i],...top[n],...top[i]);}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.material.side=THREE.DoubleSide;mesh.castShadow=true;parent.add(mesh);
  const ridge=box(parent,x,y+peak-.08,z,w*.46,.14,.16,material);
  // Lifted swallowtail ends are the defining silhouette on the Hokkien hall roof.
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const fin=new THREE.Mesh(new THREE.ConeGeometry(.11,.5,5),material);fin.position.set(x+sx*w*.48,y+.25,z+sz*d*.48);fin.rotation.z=sx*-.7;fin.rotation.x=sz*.25;parent.add(fin);
  }
  return ridge;
}
function tree(parent:THREE.Object3D,x:number,z:number,s=1) {
  cylinder(parent,x,0,z,.12*s,.18*s,2.6*s,mat(0x765d43),10);
  for(const [dx,dy,dz,r] of [[0,3.3,0,1.05],[-.6,2.7,.1,.8],[.6,2.75,-.2,.75],[.1,3.9,.1,.72]] as number[][]) sphere(parent,x+dx*s,dy*s,z+dz*s,r*s,mat(0x667d61),[1.1,1,.95]);
}
function thian(parent:THREE.Object3D){
  box(parent,0,-.2,0,18,.2,16,mats.earth);box(parent,0,-.16,8,30,.16,7,mats.road);
  // Three connected halls: entrance, main worship hall and rear hall.
  const halls=[{x:0,z:3.1,w:6.8,d:3.8,h:3.3},{x:0,z:-1.2,w:8.1,d:4.5,h:4},{x:0,z:-5.2,w:6.8,d:3.5,h:3.2}];
  for(const a of halls){
    box(parent,a.x,a.h*.32,a.z,a.w,a.h*.58,a.d,mats.cream);
    for(let i=-2;i<=2;i++)post(parent,i*a.w/5,a.z+a.d*.48,a.h,mats.red,.14);
    box(parent,a.x,a.h*.73,a.z+a.d*.5,a.w,.18,.2,mats.deepRed);
    roof(parent,a.x,a.h,a.z,a.w+1.1,a.d+1,mats.roof,.8);
    // A continuous ceramic ridge and dragon/pearl finials distinguish the temple roof.
    for(const end of [-1,1]){const dragon=sphere(parent,end*(a.w*.43),a.h+1.05,a.z,.22,mats.green,[1.5,.65,.7]);dragon.rotation.z=end*.3; sphere(parent,end*(a.w*.43)+end*.3,a.h+1.3,a.z,.12,mats.goldLight);}
  }
  for(let i=-2;i<=2;i++)post(parent,i*1.2,5,2.6,mats.stone,.16);
  tree(parent,-7,-4,.9);tree(parent,7,-4,.8);
  // Shoreline setting and a small bumboat, reflecting the temple's early Telok Ayer context.
  box(parent,0,-.18,12,30,.12,10,mat(0x728b89));
  const hull=new THREE.Mesh(new THREE.BoxGeometry(2.5,.35,.8),mats.deepRed);hull.position.set(0,.35,11);parent.add(hull);
}
function gopuram(parent:THREE.Object3D,x:number,z:number,tiers:number){
  const colors=[mats.blue,mats.pink,mats.green,mats.goldLight,mats.cream];
  box(parent,x,0,z,3.8,.8,2.5,mats.white);
  for(let i=0;i<tiers;i++){
    const w=3.2-i*.38,h=.86,y=.8+i*.92;
    box(parent,x,y,z,w,h,1.55,colors[i%colors.length]);
    box(parent,x,y+h-.12,z,w+.22,.14,1.72,mats.goldLight);
    // Painted niches and sculpted guardian figures on each receding storey.
    for(let c=-2;c<=2;c++){
      const xx=x+c*w/5;
      box(parent,xx,y+.2,z+.83,.17,.38,.12,mats.cream);
      sphere(parent,xx,y+.62,z+.9,.18,[mats.red,mats.blue,mats.green,mats.gold][(c+i+8)%4],[.72,1.1,.8]);
      const crown=new THREE.Mesh(new THREE.ConeGeometry(.13,.25,5),mats.gold);crown.position.set(xx,y+.88,z+.9);parent.add(crown);
    }
  }
  const topY=.8+tiers*.92;box(parent,x,topY,z,1.15,.45,1.15,mats.pink);
  for(let i=-1;i<=1;i++)sphere(parent,x+i*.38,topY+.55,z,.14,mats.goldLight);
}
function mariamman(parent:THREE.Object3D){
  box(parent,0,-.2,0,20,.2,14,mats.earth);box(parent,0,-.16,8,32,.16,7,mats.road);
  // The 1910 frontage is intentionally three storeys; the present five-tier tower dates to 1925.
  gopuram(parent,0,2.7,3);
  box(parent,0,1.7,-2.3,8,3.4,6,mats.white);roof(parent,0,5.1,-2.3,9,7,mats.roof,.75);
  box(parent,-5,.15,1.8,.45,1.4,9,mats.white);box(parent,5,.15,1.8,.45,1.4,9,mats.white);
  // Jamae Mosque's paired minarets were part of the same historic South Bridge Road view.
  for(const x of [5.2,7.3]){
    box(parent,x,0,-2.8,1.1,.25,1.1,mats.cream);cylinder(parent,x,0,-2.8,.36,.52,4.2,mats.white,8);
    cylinder(parent,x,4.15,-2.8,.42,.36,.3,mats.goldLight,8);cylinder(parent,x,4.45,-2.8,.19,.28,1.3,mats.white,8);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),mats.white);dome.scale.set(1,.7,1);dome.position.set(x,5.9,-2.8);parent.add(dome);
    cylinder(parent,x,6.2,-2.8,.035,.035,.6,mats.gold,8);
  }
  for(let i=-2;i<=2;i++)box(parent,i*1.2,.85,6,.1,.12,.1,mats.dark);
  tree(parent,-7,-3,.75);
}
function onionDome(parent:THREE.Object3D,x:number,z:number){
  const skirt=new THREE.Mesh(new THREE.SphereGeometry(1.55,32,20,0,Math.PI*2,0,Math.PI*.68),mats.gold);skirt.position.set(x,6.15,z);skirt.scale.y=1.18;skirt.castShadow=true;parent.add(skirt);
  cylinder(parent,x,7.72,z,.36,.55,.6,mats.goldLight,24);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(.24,.9,16),mats.goldLight);fin.position.set(x,8.45,z);parent.add(fin);
  // Community-donated glass bottles form the dark band around the dome base.
  for(let i=0;i<20;i++){const a=i*Math.PI*2/20;const b=sphere(parent,x+Math.cos(a)*1.48,5.12,z+Math.sin(a)*1.48,.12,mats.glass,[.65,1.35,.65]);b.rotation.z=Math.cos(a)*.3;}
}
function sultan(parent:THREE.Object3D){
  box(parent,0,-.2,0,22,.2,14,mats.earth);box(parent,0,-.16,8,34,.16,7,mats.road);
  box(parent,0,.25,-1,10,4.1,7,mats.cream);box(parent,0,3.85,2.55,9.3,.32,.45,mats.gold);
  // Arcaded frontage with shaded bays across the prayer hall.
  for(let x=-3.8;x<=3.81;x+=1.9){
    post(parent,x,2.65,3.25,mats.white,.12);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.62,.105,8,20,Math.PI),mats.gold);arch.position.set(x,2.9,2.66);parent.add(arch);
    box(parent,x,.55,2.68,1.02,1.75,.12,mats.blue);
  }
  box(parent,0,4.1,-1,6.2,1.4,5,mats.white);roof(parent,0,5.4,-1,8,6,mats.roof,.52);
  onionDome(parent,0,-1);
  for(const x of [-5.5,5.5])for(const z of [-4,2.8]){
    cylinder(parent,x,0,z,.34,.55,4.7,mats.cream,12);cylinder(parent,x,4.55,z,.52,.34,.28,mats.gold,12);
    cylinder(parent,x,4.83,z,.2,.36,1.8,mats.cream,12);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),mats.gold);dome.position.set(x,6.72,z);dome.scale.y=.65;parent.add(dome);
    cylinder(parent,x,6.92,z,.025,.025,.45,mats.goldLight,8);
  }
  tree(parent,-8,-3,.7);tree(parent,8,-3,.7);
}
export function createHeritageScene(site:Site, hotspots:TourHotspot[]){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xddd1b8);scene.fog=new THREE.Fog(0xddd1b8,27,48);
  scene.add(new THREE.HemisphereLight(0xffedcf,0x534b3b,2.05));
  const sun=new THREE.DirectionalLight(0xffd89b,3.2);sun.position.set(-8,16,11);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xc1d5d0,.8);fill.position.set(9,8,-8);scene.add(fill);
  const root=new THREE.Group();scene.add(root);
  if(site.id==="thian-hock-keng")thian(root);else if(site.id==="sri-mariamman-temple")mariamman(root);else sultan(root);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mats.earth);ground.rotation.x=-Math.PI/2;ground.position.y=-.22;ground.receiveShadow=true;scene.add(ground);
  const positions=new Map<string,THREE.Vector3>();
  for(const h of hotspots)positions.set(h.id,new THREE.Vector3(...h.position));
  return {scene,hotspots,positions};
}
