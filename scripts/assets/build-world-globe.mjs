// Builds the rotating, stylized globe used by the welcome sequence.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "public", "assets", "3d");
mkdirSync(outDir, { recursive: true });

const WIDTH = 2048;
const HEIGHT = 1024;
const continents = [
  // North America
  [[-168, 66], [-151, 72], [-135, 67], [-126, 59], [-124, 49], [-117, 46], [-122, 37], [-113, 31], [-106, 24], [-98, 20], [-91, 16], [-84, 10], [-78, 8], [-80, 23], [-75, 31], [-80, 43], [-68, 47], [-60, 54], [-77, 61], [-91, 69], [-111, 73], [-132, 70], [-151, 75]],
  // Greenland
  [[-53, 82], [-34, 78], [-24, 70], [-39, 59], [-52, 61], [-63, 69], [-59, 77]],
  // South America
  [[-81, 12], [-71, 10], [-61, 7], [-51, 2], [-45, -5], [-37, -10], [-43, -22], [-50, -31], [-54, -42], [-68, -56], [-73, -40], [-78, -22], [-80, -6]],
  // Europe, Africa and Asia
  [[-10, 36], [-9, 44], [2, 50], [10, 55], [23, 58], [30, 69], [43, 68], [54, 57], [69, 56], [78, 63], [91, 72], [111, 72], [128, 67], [145, 59], [163, 58], [179, 52], [169, 45], [152, 46], [143, 39], [133, 34], [127, 27], [119, 19], [111, 12], [106, 4], [112, -4], [127, -4], [140, -8], [153, -7], [157, -13], [147, -19], [136, -16], [128, -9], [119, -8], [112, -22], [116, -34], [137, -37], [153, -29], [149, -40], [131, -44], [115, -37], [111, -28], [113, -20], [108, -10], [103, -2], [97, 5], [91, 9], [84, 7], [79, 10], [76, 19], [69, 23], [61, 25], [56, 18], [51, 12], [45, 12], [43, 18], [49, 29], [42, 38], [34, 42], [26, 40], [18, 45], [13, 42], [6, 43], [0, 40], [-4, 36]],
  // Japan
  [[130, 31], [134, 34], [139, 37], [143, 43], [145, 42], [142, 35], [137, 33]],
  // Madagascar
  [[49, -13], [51, -17], [49, -25], [46, -22]],
  // Antarctica
  [[-180, -70], [-150, -74], [-120, -71], [-90, -76], [-60, -72], [-30, -75], [0, -70], [30, -74], [60, -71], [90, -76], [120, -72], [150, -75], [180, -70], [180, -90], [-180, -90]],
];

function project(points) {
  return points.map(([lon, lat]) => `${((lon + 180) / 360) * WIDTH},${((90 - lat) / 180) * HEIGHT}`).join(" ");
}

const land = continents.map((points) => `<polygon points="${project(points)}"/>`).join("");
const meridians = Array.from({ length: 24 }, (_, index) => {
  const x = (index * WIDTH) / 24;
  return `<path d="M${x} 0V${HEIGHT}"/>`;
}).join("");
const parallels = Array.from({ length: 11 }, (_, index) => {
  const y = (index * HEIGHT) / 10;
  return `<path d="M0 ${y}H${WIDTH}"/>`;
}).join("");

const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="sea" x2="0" y2="1"><stop stop-color="#d7c393"/><stop offset=".52" stop-color="#a78b5b"/><stop offset="1" stop-color="#6c573b"/></linearGradient>
    <radialGradient id="light"><stop stop-color="#f5e0b1" stop-opacity=".45"/><stop offset="1" stop-color="#d0aa69" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sea)"/>
  <ellipse cx="630" cy="180" rx="850" ry="510" fill="url(#light)"/>
  <g fill="none" stroke="#f1dfb8" stroke-opacity=".36" stroke-width="3">${meridians}${parallels}</g>
  <g fill="#5f6245" stroke="#d7bd85" stroke-width="4" stroke-linejoin="round">${land}</g>
  <g fill="none" stroke="#9e875b" stroke-opacity=".52" stroke-width="2">
    <path d="M822 324l54 38 38 67-20 45 32 55-28 35M1260 252l46 51-21 47 55 32 28 59-36 60M1454 320l-34 37 15 53-51 30"/>
    <path d="M510 205l37 31-12 46 31 22M355 280l45 31-12 43 38 25"/>
  </g>
</svg>`;

const texturePng = Buffer.from(new Resvg(mapSvg).render().asPng());
writeFileSync(path.join(outDir, "world-globe-map.png"), texturePng);

const doc = new Document();
doc.getRoot().getAsset().generator = "Heirloom world globe asset builder";
const buffer = doc.createBuffer();
const map = doc.createTexture("Warm equirectangular world map").setImage(texturePng).setMimeType("image/png");
const material = doc.createMaterial("Antique globe enamel")
  .setBaseColorTexture(map)
  .setMetallicFactor(0.05)
  .setRoughnessFactor(0.78);
const geometry = new THREE.SphereGeometry(1.6, 128, 96);
geometry.computeVertexNormals();

const positions = doc.createAccessor("Globe positions").setType("VEC3").setArray(new Float32Array(geometry.attributes.position.array)).setBuffer(buffer);
const normals = doc.createAccessor("Globe normals").setType("VEC3").setArray(new Float32Array(geometry.attributes.normal.array)).setBuffer(buffer);
const uvs = doc.createAccessor("Globe UVs").setType("VEC2").setArray(new Float32Array(geometry.attributes.uv.array)).setBuffer(buffer);
const rawIndices = geometry.index.array;
const indices = doc.createAccessor("Globe triangles").setType("SCALAR").setArray(new Uint16Array(rawIndices)).setBuffer(buffer);
const primitive = doc.createPrimitive().setAttribute("POSITION", positions).setAttribute("NORMAL", normals).setAttribute("TEXCOORD_0", uvs).setIndices(indices).setMaterial(material);
const mesh = doc.createMesh("Rotating Earth").addPrimitive(primitive);
const globe = doc.createNode("Singapore Heritage Globe").setMesh(mesh);
globe.setExtras({
  description: "A stylized, fully three-dimensional globe with a warm heritage palette and equirectangular world map texture.",
  radius: 1.6,
  singapore: { latitude: 1.35, longitude: 103.82 },
});
doc.createScene("World Intro").addChild(globe);
doc.getRoot().setDefaultScene(doc.getRoot().listScenes()[0]);

const bytes = await new NodeIO().writeBinary(doc);
writeFileSync(path.join(outDir, "world-globe.glb"), bytes);
console.log(`Wrote public/assets/3d/world-globe.glb (${(bytes.byteLength / 1024).toFixed(0)} KB)`);
