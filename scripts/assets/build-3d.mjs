// Builds the 3D assets as self-contained GLB files in public/assets/3d:
//   heirloom-passport.glb — Heritage Passport with a hinged "FrontCover" node and an "Open" animation
//   rubber-stamp.glb      — wooden rubber stamp used by the stamping animation
//   node scripts/assets/build-3d.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { Document, NodeIO } from "@gltf-transform/core";
import { Resvg } from "@resvg/resvg-js";
import { coverFrontSvg, coverBackSvg, spineSvg, endpaperSvg, identityPageSvg, pageEdgeSvg, LEATHER } from "./lib/passport-art.mjs";
import { encodePng, leatherNormalMap, woodTexture } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "public", "assets", "3d");
mkdirSync(outDir, { recursive: true });

const renderPng = (svg, width) => Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng());

/** Metallic-roughness map from a white-on-black mask: white → polished gold, black → leather. */
function metalRoughFromMask(svg, width) {
  const img = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render();
  const src = img.pixels;
  const px = new Uint8Array(img.width * img.height * 3);
  for (let i = 0, j = 0; i < src.length; i += 4, j += 3) {
    const m = src[i] / 255;
    px[j] = 255; // occlusion (unused)
    px[j + 1] = Math.round((0.82 - 0.5 * m) * 255); // roughness
    px[j + 2] = Math.round(m * 255); // metalness
  }
  return encodePng(img.width, img.height, px, 3);
}

const hex = (h) => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b, 1];
};

/* ---------------------------------------------------------------- */
/* glTF helpers                                                      */
/* ---------------------------------------------------------------- */
function makeDoc(generator) {
  const doc = new Document();
  doc.getRoot().getAsset().generator = generator;
  return { doc, buffer: doc.createBuffer() };
}

function texture(doc, name, png) {
  return doc.createTexture(name).setImage(png).setMimeType("image/png");
}

/**
 * Turn a three.js BufferGeometry into glTF primitives, one per material group.
 * uv1Scale: when set, emits TEXCOORD_1 = planar(position) * scale for tiled detail maps.
 */
function addMesh(ctx, name, geometry, materials, { uv1Scale = 0 } = {}) {
  const { doc, buffer } = ctx;
  const g = geometry.index ? geometry : geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
  const pos = doc.createAccessor(`${name}-pos`).setType("VEC3").setArray(new Float32Array(g.attributes.position.array)).setBuffer(buffer);
  if (!g.attributes.normal) g.computeVertexNormals();
  const nrm = doc.createAccessor(`${name}-nrm`).setType("VEC3").setArray(new Float32Array(g.attributes.normal.array)).setBuffer(buffer);
  const uv0 = g.attributes.uv ? doc.createAccessor(`${name}-uv0`).setType("VEC2").setArray(new Float32Array(g.attributes.uv.array)).setBuffer(buffer) : null;
  let uv1 = null;
  if (uv1Scale) {
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const arr = new Float32Array((p.length / 3) * 2);
    for (let i = 0; i < p.length / 3; i++) {
      const ax = Math.abs(n[i * 3]), ay = Math.abs(n[i * 3 + 1]);
      const [a, b] = ax > 0.6 ? [p[i * 3 + 2], p[i * 3 + 1]] : ay > 0.6 ? [p[i * 3], p[i * 3 + 2]] : [p[i * 3], p[i * 3 + 1]];
      arr[i * 2] = a * uv1Scale;
      arr[i * 2 + 1] = b * uv1Scale;
    }
    uv1 = doc.createAccessor(`${name}-uv1`).setType("VEC2").setArray(arr).setBuffer(buffer);
  }
  const mesh = doc.createMesh(name);
  const groups = g.groups.length ? g.groups : [{ start: 0, count: g.index.count, materialIndex: 0 }];
  const idx = g.index.array;
  for (const grp of groups) {
    const mat = materials[grp.materialIndex ?? 0];
    if (!mat) continue;
    const slice = Uint32Array.from(idx.slice(grp.start, grp.start + grp.count));
    const prim = doc.createPrimitive()
      .setAttribute("POSITION", pos)
      .setAttribute("NORMAL", nrm)
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(slice).setBuffer(buffer))
      .setMaterial(mat);
    if (uv0) prim.setAttribute("TEXCOORD_0", uv0);
    if (uv1) prim.setAttribute("TEXCOORD_1", uv1);
    mesh.addPrimitive(prim);
  }
  return mesh;
}

/** Flat rounded-rectangle face with 0–1 UVs (v down, glTF convention), facing +z or −z. */
function roundedFace(w, h, r, { x0 = 0, flip = false, mirrorU = false } = {}) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, -h / 2);
  s.lineTo(x0 + w - r, -h / 2);
  s.quadraticCurveTo(x0 + w, -h / 2, x0 + w, -h / 2 + r);
  s.lineTo(x0 + w, h / 2 - r);
  s.quadraticCurveTo(x0 + w, h / 2, x0 + w - r, h / 2);
  s.lineTo(x0 + r, h / 2);
  s.quadraticCurveTo(x0, h / 2, x0, h / 2 - r);
  s.lineTo(x0, -h / 2 + r);
  s.quadraticCurveTo(x0, -h / 2, x0 + r, -h / 2);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let u = (p.getX(i) - x0) / w;
    if (mirrorU) u = 1 - u;
    uv.setXY(i, u, 1 - (p.getY(i) + h / 2) / h);
  }
  if (flip) {
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0, -1);
  }
  return g;
}

function roundedBoard(w, h, r, depth, x0 = 0) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, -h / 2);
  s.lineTo(x0 + w - r, -h / 2);
  s.quadraticCurveTo(x0 + w, -h / 2, x0 + w, -h / 2 + r);
  s.lineTo(x0 + w, h / 2 - r);
  s.quadraticCurveTo(x0 + w, h / 2, x0 + w - r, h / 2);
  s.lineTo(x0 + r, h / 2);
  s.quadraticCurveTo(x0, h / 2, x0, h / 2 - r);
  s.lineTo(x0, -h / 2 + r);
  s.quadraticCurveTo(x0, -h / 2, x0 + r, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/* ---------------------------------------------------------------- */
/* Heritage Passport                                                 */
/* ---------------------------------------------------------------- */
function buildPassport() {
  const ctx = makeDoc("Heirloom asset pipeline (scripts/assets/build-3d.mjs)");
  const { doc, buffer } = ctx;

  const W = 0.88, H = 1.25, t = 0.03, Pd = 0.08, R = 0.05;
  const T = 2 * t + Pd;

  const leatherNormal = texture(doc, "leather-grain-normal", leatherNormalMap(256));
  const withGrain = (mat, scale = 1) => {
    mat.setNormalTexture(leatherNormal).setNormalScale(0.35 * scale);
    mat.getNormalTextureInfo().setTexCoord(1).setWrapS(10497).setWrapT(10497);
    return mat;
  };

  const leather = withGrain(doc.createMaterial("Leather").setBaseColorFactor(hex(LEATHER)).setRoughnessFactor(0.78).setMetallicFactor(0));
  const coverFront = withGrain(
    doc.createMaterial("CoverFront")
      .setBaseColorTexture(texture(doc, "cover-front", renderPng(coverFrontSvg(), 880)))
      .setMetallicRoughnessTexture(texture(doc, "cover-front-mr", metalRoughFromMask(coverFrontSvg("metal"), 880)))
      .setMetallicFactor(1).setRoughnessFactor(1),
  );
  coverFront.getNormalTextureInfo().setTexCoord(1);
  const coverBack = withGrain(
    doc.createMaterial("CoverBack")
      .setBaseColorTexture(texture(doc, "cover-back", renderPng(coverBackSvg(), 440)))
      .setMetallicRoughnessTexture(texture(doc, "cover-back-mr", metalRoughFromMask(coverBackSvg("metal"), 440)))
      .setMetallicFactor(1).setRoughnessFactor(1),
  );
  const spineMat = withGrain(doc.createMaterial("Spine").setBaseColorTexture(texture(doc, "spine", renderPng(spineSvg(), 128))).setRoughnessFactor(0.7).setMetallicFactor(0.15));
  const endpaper = doc.createMaterial("Endpaper").setBaseColorTexture(texture(doc, "endpaper", renderPng(endpaperSvg(), 704))).setRoughnessFactor(0.92).setMetallicFactor(0);
  const identity = doc.createMaterial("IdentityPage").setBaseColorTexture(texture(doc, "identity-page", renderPng(identityPageSvg(), 880))).setRoughnessFactor(0.9).setMetallicFactor(0);
  const pageEdge = doc.createMaterial("PageEdges").setBaseColorTexture(texture(doc, "page-edges", renderPng(pageEdgeSvg(), 512))).setRoughnessFactor(0.95).setMetallicFactor(0);
  const paper = doc.createMaterial("Paper").setBaseColorFactor(hex("#F4EDDC")).setRoughnessFactor(0.95).setMetallicFactor(0);
  const ribbonMat = doc.createMaterial("Ribbon").setBaseColorFactor(hex("#BC9545")).setRoughnessFactor(0.6).setMetallicFactor(0.05).setDoubleSided(true);

  const rootNode = doc.createNode("Passport");
  const scene = doc.createScene("Scene").addChild(rootNode);
  doc.getRoot().setDefaultScene(scene);
  const zOff = -T / 2;

  // back cover board + its outer (−z) face
  const back = doc.createNode("BackCover").setTranslation([-W / 2, 0, zOff + t / 2]);
  back.setMesh(addMesh(ctx, "BackCoverBoard", roundedBoard(W, H, R, t), [leather, leather], { uv1Scale: 7 }));
  const backFace = doc.createNode("BackCoverFace").setTranslation([0, 0, -t / 2 - 0.0042]);
  backFace.setMesh(addMesh(ctx, "BackCoverFace", roundedFace(W, H, R, { flip: true, mirrorU: true }), [coverBack], { uv1Scale: 7 }));
  back.addChild(backFace);
  rootNode.addChild(back);

  // page block (sides show stacked leaves, top shows the identity page)
  const pw = W - 0.045, ph = H - 0.05;
  const block = new THREE.BoxGeometry(pw, ph, Pd);
  const uv = block.attributes.uv;
  for (let i = 8; i < 16; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); // ±y faces: run leaf lines the same way as ±x
  for (let i = 16; i < 20; i++) uv.setXY(i, uv.getX(i), 1 - uv.getY(i)); // +z face: glTF v-down
  const pages = doc.createNode("PageBlock").setTranslation([-W / 2 + 0.012 + pw / 2, 0, zOff + t + Pd / 2]);
  pages.setMesh(addMesh(ctx, "PageBlock", block, [pageEdge, pageEdge, pageEdge, pageEdge, identity, paper]));
  rootNode.addChild(pages);

  // spine: half cylinder wrapping the left edge
  const spineGeo = new THREE.CylinderGeometry(T / 2, T / 2, H - 0.004, 24, 1, true, Math.PI, Math.PI);
  const sv = spineGeo.attributes.uv;
  for (let i = 0; i < sv.count; i++) sv.setY(i, 1 - sv.getY(i));
  const spine = doc.createNode("Spine").setTranslation([-W / 2, 0, 0]);
  spine.setMesh(addMesh(ctx, "Spine", spineGeo, [spineMat], { uv1Scale: 7 }));
  rootNode.addChild(spine);

  // front cover, hinged on the spine: local x runs 0 → W away from the hinge
  const front = doc.createNode("FrontCover").setTranslation([-W / 2, 0, zOff + t + Pd + t / 2]);
  const frontBoard = doc.createNode("FrontCoverBoard").setMesh(addMesh(ctx, "FrontCoverBoard", roundedBoard(W, H, R, t), [leather, leather], { uv1Scale: 7 }));
  const frontFace = doc.createNode("FrontCoverFace").setTranslation([0, 0, t / 2 + 0.0042]).setMesh(addMesh(ctx, "FrontCoverFace", roundedFace(W, H, R), [coverFront], { uv1Scale: 7 }));
  const innerFace = doc.createNode("FrontCoverInside").setTranslation([0, 0, -t / 2 - 0.0042]).setMesh(addMesh(ctx, "FrontCoverInside", roundedFace(W, H, R, { flip: true, mirrorU: true }), [endpaper]));
  front.addChild(frontBoard).addChild(frontFace).addChild(innerFace);
  rootNode.addChild(front);

  // ribbon bookmark peeking out of the bottom
  const ribbon = doc.createNode("Ribbon").setTranslation([-W / 2 + 0.26, -H / 2 - 0.045, zOff + t + Pd * 0.55]).setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0, 0.1)).toArray());
  const rib = new THREE.PlaneGeometry(0.055, 0.2, 1, 4);
  rib.translate(0, 0, 0);
  ribbon.setMesh(addMesh(ctx, "Ribbon", rib, [ribbonMat]));
  rootNode.addChild(ribbon);

  // "Open" animation: front cover swings to the left around the spine
  const times = [0, 0.18, 0.4, 0.65, 0.9, 1.1];
  const angles = [0, -6, -40, -105, -158, -172];
  const q = [];
  for (const a of angles) q.push(...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(a)).toArray());
  const sampler = doc.createAnimationSampler()
    .setInput(doc.createAccessor().setType("SCALAR").setArray(new Float32Array(times)).setBuffer(buffer))
    .setOutput(doc.createAccessor().setType("VEC4").setArray(new Float32Array(q)).setBuffer(buffer))
    .setInterpolation("LINEAR");
  const channel = doc.createAnimationChannel().setTargetNode(front).setTargetPath("rotation").setSampler(sampler);
  doc.createAnimation("Open").addSampler(sampler).addChannel(channel);

  rootNode.setExtras({
    heirloom: {
      description: "Heirloom Heritage Passport. Tap-to-open: play the 'Open' clip forwards; close by playing it backwards.",
      dimensions: { width: W, height: H, thickness: T, units: "decimetres (88 × 125 mm passport at 10:1)" },
      hingeNode: "FrontCover",
      firstPageNode: "PageBlock",
    },
  });
  return doc;
}

/* ---------------------------------------------------------------- */
/* Rubber stamp                                                      */
/* ---------------------------------------------------------------- */
function buildStampTool() {
  const ctx = makeDoc("Heirloom asset pipeline (scripts/assets/build-3d.mjs)");
  const { doc } = ctx;
  const wood = doc.createMaterial("Wood").setBaseColorTexture(texture(doc, "wood", woodTexture())).setRoughnessFactor(0.55).setMetallicFactor(0);
  const rubber = doc.createMaterial("Rubber").setBaseColorFactor(hex("#3B2A26")).setRoughnessFactor(0.92).setMetallicFactor(0);
  const brass = doc.createMaterial("Brass").setBaseColorFactor(hex("#C9A24E")).setRoughnessFactor(0.32).setMetallicFactor(1);

  const rootNode = doc.createNode("RubberStamp");
  const scene = doc.createScene("Scene").addChild(rootNode);
  doc.getRoot().setDefaultScene(scene);

  const pad = new THREE.BoxGeometry(0.6, 0.05, 0.6);
  rootNode.addChild(doc.createNode("Pad").setTranslation([0, 0.025, 0]).setMesh(addMesh(ctx, "Pad", pad, [rubber, rubber, rubber, rubber, rubber, rubber])));
  const block = new THREE.BoxGeometry(0.64, 0.17, 0.64);
  rootNode.addChild(doc.createNode("Block").setTranslation([0, 0.135, 0]).setMesh(addMesh(ctx, "Block", block, [wood, wood, wood, wood, wood, wood])));
  const band = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32);
  rootNode.addChild(doc.createNode("Ferrule").setTranslation([0, 0.235, 0]).setMesh(addMesh(ctx, "Ferrule", band, [brass, brass, brass])));
  const profile = [
    [0.0, 0.22], [0.07, 0.22], [0.066, 0.26], [0.058, 0.34], [0.064, 0.39], [0.09, 0.42], [0.12, 0.46], [0.135, 0.51],
    [0.13, 0.56], [0.112, 0.6], [0.08, 0.632], [0.04, 0.648], [0.0, 0.652],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const handle = new THREE.LatheGeometry(profile, 40);
  rootNode.addChild(doc.createNode("Handle").setMesh(addMesh(ctx, "Handle", handle, [wood])));
  rootNode.setExtras({ heirloom: { description: "Wooden rubber stamp. Origin at the centre of the rubber face; +y up. Pad is 0.6 × 0.6." } });
  return doc;
}

// Flat cover image: 2D fallback when WebGL is unavailable, and the Home preview.
writeFileSync(path.join(outDir, "passport-cover.png"), renderPng(coverFrontSvg(), 440));
console.log("  wrote public/assets/3d/passport-cover.png");

const io = new NodeIO();
for (const [file, doc] of [["heirloom-passport.glb", buildPassport()], ["rubber-stamp.glb", buildStampTool()]]) {
  const bin = await io.writeBinary(doc);
  writeFileSync(path.join(outDir, file), bin);
  console.log(`  wrote public/assets/3d/${file} (${(bin.byteLength / 1024).toFixed(0)} KB)`);
}
