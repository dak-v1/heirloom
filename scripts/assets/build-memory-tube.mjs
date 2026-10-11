// Builds the 3D brass-and-glass archive tube used by the memory animation.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "public", "assets", "3d");
mkdirSync(outDir, { recursive: true });

const doc = new Document();
doc.getRoot().getAsset().generator = "Heirloom memory archive tube builder";
const buffer = doc.createBuffer();
const colors = {
  glass: doc.createMaterial("Warm smoked glass").setBaseColorFactor([0.9, 0.66, 0.37, 0.2]).setMetallicFactor(0.14).setRoughnessFactor(0.12).setAlphaMode("BLEND").setDoubleSided(true),
  innerGlass: doc.createMaterial("Inner glass reflection").setBaseColorFactor([1, 0.84, 0.58, 0.1]).setMetallicFactor(0.05).setRoughnessFactor(0.18).setAlphaMode("BLEND").setDoubleSided(true),
  brass: doc.createMaterial("Brushed antique brass").setBaseColorFactor([0.69, 0.4, 0.19, 1]).setMetallicFactor(0.78).setRoughnessFactor(0.27).setEmissiveFactor([0.12, 0.035, 0.01]),
  gold: doc.createMaterial("Polished champagne brass").setBaseColorFactor([0.9, 0.68, 0.35, 1]).setMetallicFactor(0.84).setRoughnessFactor(0.2).setEmissiveFactor([0.18, 0.075, 0.018]),
  dark: doc.createMaterial("Darkened bronze details").setBaseColorFactor([0.2, 0.12, 0.075, 1]).setMetallicFactor(0.7).setRoughnessFactor(0.38),
  light: doc.createMaterial("Warm luminous diffuser").setBaseColorFactor([1, 0.73, 0.35, 0.68]).setMetallicFactor(0.02).setRoughnessFactor(0.2).setAlphaMode("BLEND").setDoubleSided(true).setEmissiveFactor([0.45, 0.2, 0.035]),
};

function addMesh(name, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const indexed = geometry.index ? geometry : geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
  if (!indexed.attributes.normal) indexed.computeVertexNormals();
  const positions = doc.createAccessor(`${name} positions`).setType("VEC3").setArray(new Float32Array(indexed.attributes.position.array)).setBuffer(buffer);
  const normals = doc.createAccessor(`${name} normals`).setType("VEC3").setArray(new Float32Array(indexed.attributes.normal.array)).setBuffer(buffer);
  const indices = doc.createAccessor(`${name} triangles`).setType("SCALAR").setArray(Uint32Array.from(indexed.index.array)).setBuffer(buffer);
  const primitive = doc.createPrimitive().setAttribute("POSITION", positions).setAttribute("NORMAL", normals).setIndices(indices).setMaterial(material);
  const mesh = doc.createMesh(name).addPrimitive(primitive);
  const node = doc.createNode(name).setMesh(mesh).setTranslation(position).setScale(scale);
  return node;
}

function cylinder(name, radiusTop, radiusBottom, height, material, position, radial = 48) {
  return addMesh(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial, 1, false), material, position);
}

function torus(name, radius, tubeRadius, y, material) {
  return addMesh(name, new THREE.TorusGeometry(radius, tubeRadius, 12, 64), material, [0, y, 0], [1, 1, 1]);
}

const scene = doc.createScene("Memory Archive Tube");
const tubeHeight = 3.35;
scene.addChild(addMesh("Hand blown glass chamber", new THREE.CylinderGeometry(0.415, 0.415, tubeHeight, 64, 8, true), colors.glass, [0, tubeHeight / 2, 0]));
scene.addChild(addMesh("Inner glass edge", new THREE.CylinderGeometry(0.392, 0.392, tubeHeight - 0.1, 64, 4, true), colors.innerGlass, [0, tubeHeight / 2, 0]));

// Broad turned brass ferrules frame the open mouth and receiving throat.
scene.addChild(cylinder("Upper ferrule", 0.49, 0.46, 0.17, colors.brass, [0, 3.32, 0]));
scene.addChild(cylinder("Upper ferrule highlight", 0.495, 0.49, 0.035, colors.gold, [0, 3.405, 0]));
scene.addChild(cylinder("Lower receiving ferrule", 0.47, 0.5, 0.2, colors.brass, [0, 0.075, 0]));
scene.addChild(cylinder("Lower ferrule highlight", 0.5, 0.48, 0.035, colors.gold, [0, 0.17, 0]));
scene.addChild(torus("Top glass seal", 0.42, 0.027, 3.42, colors.gold));
scene.addChild(torus("Top inner lip", 0.36, 0.014, 3.42, colors.dark));
scene.addChild(torus("Lower glass seal", 0.42, 0.027, 0.18, colors.gold));
scene.addChild(torus("Lower inner lip", 0.36, 0.014, 0.18, colors.dark));

// Four slender uprights and three hoops give the glass a real support cage.
for (let index = 0; index < 4; index += 1) {
  const angle = Math.PI / 4 + index * Math.PI / 2;
  const x = Math.cos(angle) * 0.45;
  const z = Math.sin(angle) * 0.45;
  scene.addChild(addMesh(`Cage upright ${index + 1}`, new THREE.CylinderGeometry(0.027, 0.035, 3.18, 12), colors.brass, [x, 1.76, z]));
  scene.addChild(addMesh(`Upright glint ${index + 1}`, new THREE.CylinderGeometry(0.008, 0.008, 3.08, 8), colors.gold, [x * 1.045, 1.76, z * 1.045]));
}
for (const [index, y] of [0.28, 1.76, 3.18].entries()) {
  scene.addChild(torus(`Cage cross band ${index + 1}`, 0.47, 0.022, y, colors.brass));
  scene.addChild(torus(`Band inlay ${index + 1}`, 0.472, 0.008, y + 0.028, colors.gold));
}

// Low, stepped plinth remains open in the centre so the memory orb can rise into it.
scene.addChild(cylinder("Weighted lower plinth", 0.62, 0.72, 0.2, colors.dark, [0, -0.16, 0]));
scene.addChild(cylinder("Bronze plinth band", 0.7, 0.7, 0.055, colors.brass, [0, -0.055, 0]));
scene.addChild(cylinder("Champagne plinth edge", 0.705, 0.69, 0.025, colors.gold, [0, -0.015, 0]));
scene.addChild(torus("Plinth inset ring", 0.56, 0.018, -0.045, colors.gold));

// Small evenly spaced rivets catch the warm lights around the top and foot.
for (let index = 0; index < 12; index += 1) {
  const angle = (index / 12) * Math.PI * 2;
  const x = Math.cos(angle) * 0.486;
  const z = Math.sin(angle) * 0.486;
  scene.addChild(addMesh(`Ferrule rivet ${index + 1}`, new THREE.SphereGeometry(0.024, 12, 8), colors.gold, [x, 3.32, z]));
  scene.addChild(addMesh(`Base rivet ${index + 1}`, new THREE.SphereGeometry(0.022, 12, 8), colors.gold, [Math.cos(angle) * 0.58, -0.08, Math.sin(angle) * 0.58]));
}

// A small translucent inner diffuser creates a warm vertical reflection in the glass.
scene.addChild(addMesh("Inner light diffuser", new THREE.CylinderGeometry(0.035, 0.055, 2.9, 24, 1, true), colors.light, [0, 1.77, 0]));

doc.getRoot().setDefaultScene(scene);
const bytes = await new NodeIO().writeBinary(doc);
const out = path.join(outDir, "memory-archive-tube.glb");
writeFileSync(out, bytes);
console.log(`Wrote ${out} (${(bytes.byteLength / 1024).toFixed(1)} KB)`);
