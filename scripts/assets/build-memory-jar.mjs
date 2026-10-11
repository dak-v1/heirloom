// Builds the clear, threaded mason jar that holds approved shared memories.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "public", "assets", "3d");
mkdirSync(outDir, { recursive: true });

const doc = new Document();
doc.getRoot().getAsset().generator = "Heirloom clear memory jar builder";
const buffer = doc.createBuffer();
const glass = doc.createMaterial("Clear jar glass")
  .setBaseColorFactor([0.91, 0.96, 0.98, 0.12])
  .setMetallicFactor(0.01)
  .setRoughnessFactor(0.045)
  .setAlphaMode("BLEND")
  .setDoubleSided(true);
const glassRidge = doc.createMaterial("Raised glass threads and rim")
  .setBaseColorFactor([0.82, 0.9, 0.94, 0.48])
  .setMetallicFactor(0.025)
  .setRoughnessFactor(0.11)
  .setAlphaMode("BLEND")
  .setDoubleSided(true);
const reflection = doc.createMaterial("Soft glass reflections")
  .setBaseColorFactor([0.96, 0.98, 0.98, 0.54])
  .setMetallicFactor(0.01)
  .setRoughnessFactor(0.16)
  .setAlphaMode("BLEND")
  .setDoubleSided(true)
  .setEmissiveFactor([0.07, 0.085, 0.09]);
const edgeReflection = doc.createMaterial("Cool gray glass edge reflections")
  .setBaseColorFactor([0.4, 0.46, 0.49, 0.44])
  .setMetallicFactor(0.01)
  .setRoughnessFactor(0.2)
  .setAlphaMode("BLEND")
  .setDoubleSided(true);

function addMesh(name, geometry, material) {
  const indexed = geometry.index ? geometry : geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
  if (!indexed.attributes.normal) indexed.computeVertexNormals();
  const positions = doc.createAccessor(`${name} positions`).setType("VEC3").setArray(new Float32Array(indexed.attributes.position.array)).setBuffer(buffer);
  const normals = doc.createAccessor(`${name} normals`).setType("VEC3").setArray(new Float32Array(indexed.attributes.normal.array)).setBuffer(buffer);
  const indices = doc.createAccessor(`${name} triangles`).setType("SCALAR").setArray(Uint32Array.from(indexed.index.array)).setBuffer(buffer);
  const primitive = doc.createPrimitive().setAttribute("POSITION", positions).setAttribute("NORMAL", normals).setIndices(indices).setMaterial(material);
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive));
}

const scene = doc.createScene("Clear Mason Jar for Memory Orbs");
// A solid, hollow lathed profile leaves real glass thickness around the lip and base.
// Its silhouette follows a familiar pantry jar: rounded foot, broad straight body,
// softly rolled shoulders and a narrower threaded mouth.
const profile = [
  new THREE.Vector2(0, 0.07),
  new THREE.Vector2(0.7, 0.07),
  new THREE.Vector2(0.82, 0.1),
  new THREE.Vector2(0.91, 0.2),
  new THREE.Vector2(0.94, 0.35),
  new THREE.Vector2(0.94, 2.02),
  new THREE.Vector2(0.92, 2.16),
  new THREE.Vector2(0.84, 2.26),
  new THREE.Vector2(0.72, 2.36),
  new THREE.Vector2(0.69, 2.48),
  new THREE.Vector2(0.69, 2.81),
  new THREE.Vector2(0.73, 2.86),
  new THREE.Vector2(0.73, 2.93),
  new THREE.Vector2(0.67, 2.98),
  new THREE.Vector2(0.61, 2.93),
  new THREE.Vector2(0.61, 2.5),
  new THREE.Vector2(0.65, 2.4),
  new THREE.Vector2(0.77, 2.29),
  new THREE.Vector2(0.85, 2.13),
  new THREE.Vector2(0.87, 0.38),
  new THREE.Vector2(0.84, 0.25),
  new THREE.Vector2(0.73, 0.17),
  new THREE.Vector2(0, 0.17),
];
scene.addChild(addMesh("Clear glass jar vessel", new THREE.LatheGeometry(profile, 112), glass));

function torus(name, radius, tube, y, material) {
  const mesh = addMesh(name, new THREE.TorusGeometry(radius, tube, 12, 112), material);
  mesh.setTranslation([0, y, 0]);
  return mesh;
}

// Three raised glass threads and a rolled lip make the screw-top neck recognizable.
scene.addChild(torus("Lower jar screw thread", 0.704, 0.022, 2.53, glassRidge));
scene.addChild(torus("Middle jar screw thread", 0.704, 0.022, 2.66, glassRidge));
scene.addChild(torus("Upper jar screw thread", 0.704, 0.022, 2.79, glassRidge));
scene.addChild(torus("Rounded glass mouth rim", 0.7, 0.046, 2.925, glassRidge));

// Two curved, pale reflections give the transparent walls a little depth without tinting them brown.
for (const [index, angle] of [0.72, 2.42].entries()) {
  const points = [];
  for (let step = 0; step <= 18; step += 1) {
    const y = 0.38 + step * 0.092;
    const radius = y > 1.95 ? 0.94 - (y - 1.95) * 0.64 : 0.94;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  scene.addChild(addMesh(`Glass reflection ${index + 1}`, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, index === 0 ? 0.02 : 0.012, 8, false), index === 0 ? edgeReflection : reflection));
}

doc.getRoot().setDefaultScene(scene);
const bytes = await new NodeIO().writeBinary(doc);
const out = path.join(outDir, "memory-glass-jar.glb");
writeFileSync(out, bytes);
console.log(`Wrote ${out} (${(bytes.byteLength / 1024).toFixed(1)} KB)`);
