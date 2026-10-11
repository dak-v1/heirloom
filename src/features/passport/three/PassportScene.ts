// The interactive 3D Heritage Passport (public/assets/3d/heirloom-passport.glb).
//
// One continuous scene: the closed book (drag to turn it, tap to open), the cover
// swinging open, leaves turning with a paper curl, the camera zooming onto one page,
// a ghost stamp that can be dragged on the page, and the wooden rubber stamp
// (rubber-stamp.glb) pressing the impression in. React owns the state (which spread,
// what is placed where); this class only renders it and reports gestures.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { COVER_INSIDE, LEAVES, PAGE_ASPECT, PASSPORT_LAYOUT, SPREADS, STAMP_ASPECT, STAMPABLE_PAGE_IDS } from "../../../content/passport";
import { bendColumns, easeInOut, leafPose } from "./curl";
import { PageArt, loadImage, type IdentityValues, type InkStamp } from "./pageArt";

export type Focus = "spread" | "left" | "right";
/** browse: tap edges / swipe to turn, tap a page or stamp. place: drag the ghost. locked: no input. */
export type Mode = "browse" | "place" | "locked";

export interface ViewState {
  open: boolean;
  spread: number;
  focus: Focus;
}

export interface PageHit {
  pageId: string;
  x: number;
  y: number;
}

export interface GhostState {
  pageId: string;
  x: number;
  y: number;
  widthRatio: number;
  rotationDeg: number;
  inkArt: string;
}

export interface SceneHandlers {
  onReady(): void;
  onError(reason: string): void;
  /** Tap on the closed book. */
  onTapClosed(): void;
  /** Tap on a page's outer edge or the stage's side, or a horizontal swipe. +1 = forward. */
  onFlip(dir: 1 | -1): void;
  /** Browse mode: tap on a page, away from its edges and stamps. */
  onTapPage(hit: PageHit): void;
  /** Browse mode: tap on a stamp already pressed into a page. */
  onTapStamp(earnedStampId: string): void;
  /** Place mode: the ghost's new centre while tapping or dragging on a page. */
  onPlace(hit: PageHit, phase: "start" | "move" | "end"): void;
  /** The rubber stamp touches the paper (sound / haptics). */
  onContact(): void;
}

const MODEL_URL = "/assets/3d/heirloom-passport.glb";
const TOOL_URL = "/assets/3d/rubber-stamp.glb";
const PAGE_TEXTURE_W = 720;
const PAGE_TEXTURE_H = Math.round((PAGE_TEXTURE_W * PASSPORT_LAYOUT.page.h) / PASSPORT_LAYOUT.page.w);
const DEG = Math.PI / 180;
const COVER_OPEN = PASSPORT_LAYOUT.coverOpenDeg * DEG;
const BOARD_T = 0.03; // cover board thickness (scripts/assets/build-3d.mjs)
const BOOK_W = 0.88;
const FOV = 32;
const COVER_SECONDS = 1.0;
const TURN_SECONDS = 0.8;
const STAGGER_SECONDS = 0.14;
const PRESS_SECONDS = 1.5;
const PRESS_CONTACT = 0.52;
const PRESS_LIFT = 0.64;
/** While pressing, the book tips back so the rubber stamp is seen from the side, not end-on. */
const PRESS_PITCH = -0.72;
/** Fraction of a page (from the spine) beyond which a tap turns the page. */
const PAGE_EDGE = 0.84;
/** Fraction of the stage width at either side that turns pages when tapped. */
const STAGE_EDGE = { browse: 0.13, place: 0.08 };
/** Book-space centre of each page when the book lies open (the rig is shifted so the spine is at x = 0). */
const PAGE_CENTRE_X = 0.43;
const PAGE_DEPTH = 0.06;

interface LeafRig {
  node: THREE.Object3D;
  recto: THREE.Mesh;
  verso: THREE.Mesh;
  xs: Float32Array;
  bent: Float32Array;
  zRight: number;
  zLeft: number;
  rest: number;
  turn: number;
  target: number;
  startAt: number;
  dir: 1 | -1;
}

interface PageSlot {
  mesh: THREE.Mesh;
  /** recto lies on the right, verso and the inside cover on the left. */
  side: "recto" | "verso" | "inside";
  art?: PageArt;
  signature?: string;
}

interface Frame {
  origin: THREE.Vector3;
  ex: THREE.Vector3;
  ey: THREE.Vector3;
  n: THREE.Vector3;
  w: number;
  h: number;
}

interface Hit extends PageHit {
  side: PageSlot["side"];
  /** 0 at the spine, 1 at the page's outer edge. */
  fromSpine: number;
}

type PointerKind = "rotate" | "swipe" | "ghost" | "edge" | "none";

function softShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(45,42,35,0.5)");
  grd.addColorStop(1, "rgba(45,42,35,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const approach = (v: number, goal: number, step: number) => (goal > v ? Math.min(goal, v + step) : Math.max(goal, v - step));

/** Is `hit` inside a stamp-sized box centred at `s` and rotated with it? */
function insideStamp(hit: PageHit, s: { x: number; y: number; widthRatio: number; rotationDeg: number }) {
  const dx = hit.x - s.x;
  const dy = (hit.y - s.y) / PAGE_ASPECT; // page-width units
  const a = s.rotationDeg * DEG;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) <= s.widthRatio / 2 && Math.abs(ly) <= s.widthRatio / STAMP_ASPECT / 2;
}

export class PassportScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  private rig = new THREE.Group();
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private observers: { disconnect(): void }[] = [];
  private unbind: (() => void)[] = [];
  private disposed = false;
  private ready = false;
  private dirty = true;
  private visible = true;
  private aspect = 1;

  private view: ViewState = { open: false, spread: 0, focus: "spread" };
  private mode: Mode = "browse";
  private reduced: boolean;

  private cover?: THREE.Object3D;
  private coverTurn = 0;
  private leaves: LeafRig[] = [];
  private pages = new Map<string, PageSlot>();
  private pageMeshes: THREE.Mesh[] = [];
  private shadow: THREE.Mesh;

  // rig + camera, eased toward their goals every frame
  private yaw = -0.35;
  private pitch = 0.08;
  private shift = 0;
  private camPos = new THREE.Vector3(0, 0.15, 3.4);
  private camLook = new THREE.Vector3();

  // content
  private stamps = new Map<string, InkStamp[]>();
  private identity?: IdentityValues;
  private held: string | null = null;
  private ghostState: GhostState | null = null;
  private ghost: THREE.Mesh;
  private ghostArt = "";

  // pressing
  private toolPromise?: Promise<THREE.Object3D>;
  private press?: { stamp: GhostState; start: number; contacted: boolean; resolve: () => void; tool: THREE.Object3D; wrapper: THREE.Group };
  private pressShadow: THREE.Mesh;

  // input
  private pointer?: { id: number; x: number; y: number; lastX: number; lastY: number; moved: number; kind: PointerKind; grab?: { dx: number; dy: number }; pageId?: string };

  constructor(
    private host: HTMLElement,
    private handlers: SceneHandlers,
    opts: { reducedMotion: boolean },
  ) {
    this.reduced = opts.reducedMotion;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      throw new Error("3D graphics aren't available on this device.");
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral keeps the paper cream and the leather red, close to their textures (ACES greys them).
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.9;
    r.domElement.setAttribute("aria-hidden", "true"); // touch-action is set in CSS per mode
    host.appendChild(r.domElement);

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xfff1dc, 1.9);
    key.position.set(-2, 3, 4);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.55);
    fill.position.set(3, -1, 2);
    this.scene.add(key, fill, new THREE.HemisphereLight(0xfff6e8, 0x6b5a48, 0.5), this.rig);

    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -0.78;
    this.scene.add(this.shadow);

    this.ghost = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1 / STAMP_ASPECT),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.88, depthWrite: false, toneMapped: false }),
    );
    this.ghost.visible = false;
    this.ghost.renderOrder = 5;
    this.scene.add(this.ghost);

    this.pressShadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
    this.pressShadow.visible = false;
    this.pressShadow.renderOrder = 4;
    this.scene.add(this.pressShadow);

    this.resize();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.dirty = true;
    });
    io.observe(host);
    this.observers.push(ro, io);
    this.bindInput();
    r.setAnimationLoop((t) => this.tick(t));
    this.load();
  }

  /* ================================================================ setup */

  private load() {
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (this.disposed) return;
        this.rig.add(gltf.scene);
        this.cover = gltf.scene.getObjectByName("FrontCover");
        const inside = gltf.scene.getObjectByName("FrontCoverInside") as THREE.Mesh | undefined;
        if (inside) this.addPage(COVER_INSIDE, inside, "inside");
        const coverZ = this.cover?.position.z ?? 0;
        LEAVES.forEach((leaf, i) => {
          const node = gltf.scene.getObjectByName(leaf.node);
          const recto = gltf.scene.getObjectByName(`${leaf.node}Recto`) as THREE.Mesh | undefined;
          const verso = gltf.scene.getObjectByName(`${leaf.node}Verso`) as THREE.Mesh | undefined;
          if (!node || !recto || !verso) return;
          // Columns are stored spine → outer edge, top vertex then bottom (build-3d.mjs leafPlane).
          const pos = recto.geometry.attributes.position;
          const xs = new Float32Array(pos.count / 2);
          for (let c = 0; c < xs.length; c++) xs[c] = pos.getX(c * 2);
          this.leaves.push({
            node,
            recto,
            verso,
            xs,
            bent: new Float32Array(xs.length * 2),
            zRight: node.position.z,
            // Turned leaves stack on the open cover's inner face, each a little higher and flatter.
            zLeft: coverZ + BOARD_T / 2 + 0.0085 + i * 0.0035,
            rest: COVER_OPEN + (0.6 + i * 0.35) * DEG,
            turn: 0,
            target: 0,
            startAt: 0,
            dir: 1,
          });
          this.addPage(leaf.recto, recto, "recto");
          this.addPage(leaf.verso, verso, "verso");
        });
        this.ready = true;
        this.retargetLeaves();
        this.applyContent();
        this.dirty = true;
        this.handlers.onReady();
      },
      undefined,
      () => this.handlers.onError("The 3D passport model couldn't load."),
    );
  }

  private addPage(pageId: string, mesh: THREE.Mesh, side: PageSlot["side"]) {
    mesh.userData.pageId = pageId;
    const slot: PageSlot = { mesh, side };
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const base = mat.map?.image as CanvasImageSource | undefined;
    if (base && (pageId === "identity" || STAMPABLE_PAGE_IDS.includes(pageId))) {
      slot.art = new PageArt(base, PAGE_TEXTURE_W, PAGE_TEXTURE_H, () => (this.dirty = true));
      slot.art.texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      mat.map = slot.art.texture;
      mat.needsUpdate = true;
    }
    this.pages.set(pageId, slot);
    this.pageMeshes.push(mesh);
  }

  /* ================================================================ public API */

  setView(v: ViewState) {
    this.view = { ...v, spread: Math.max(0, Math.min(SPREADS.length - 1, v.spread)) };
    this.retargetLeaves();
    this.dirty = true;
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.pointer = undefined;
    this.dirty = true;
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    this.dirty = true;
  }

  /** Impressions to paint, per page ID. */
  setStamps(byPage: Map<string, InkStamp[]>) {
    this.stamps = byPage;
    this.applyContent();
  }

  setIdentity(values: IdentityValues) {
    this.identity = values;
    this.applyContent();
  }

  /** The stamp being positioned (drawn translucent with a dashed outline), or null. */
  setGhost(g: GhostState | null) {
    this.ghostState = g;
    this.dirty = true;
    if (!g || g.inkArt === this.ghostArt) return;
    const src = (this.ghostArt = g.inkArt);
    loadImage(src)
      .then((img) => {
        if (this.disposed || this.ghostArt !== src) return;
        const c = document.createElement("canvas");
        c.width = 300;
        c.height = 380;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 300, 380);
        ctx.setLineDash([16, 10]);
        ctx.lineWidth = 7;
        ctx.strokeStyle = "#A94E36";
        ctx.strokeRect(5, 5, 290, 370);
        const mat = this.ghost.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.map = new THREE.CanvasTexture(c);
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.anisotropy = 4;
        mat.needsUpdate = true;
        this.dirty = true;
      })
      .catch(() => undefined);
  }

  /** Raycast a screen point (a stamp dropped from the tray) onto a stamp page lying open on screen. */
  resolveDrop(clientX: number, clientY: number): PageHit | null {
    const hit = this.hitPage(clientX, clientY);
    if (!hit || !STAMPABLE_PAGE_IDS.includes(hit.pageId) || !this.isPageShown(hit.pageId)) return null;
    return { pageId: hit.pageId, x: hit.x, y: hit.y };
  }

  /**
   * Play the rubber stamp pressing a saved placement into its page. The impression stays
   * hidden until the pad touches the paper. Resolves once the tool has lifted away.
   */
  pressStamp(stamp: GhostState & { id: string }): Promise<void> {
    this.held = stamp.id;
    this.applyContent();
    const release = () => {
      this.held = null;
      this.applyContent();
    };
    const frame = this.frameOf(stamp.pageId);
    if (!frame || this.reduced) {
      release();
      return Promise.resolve();
    }
    this.toolPromise ??= new Promise((resolve, reject) => new GLTFLoader().load(TOOL_URL, (g) => resolve(g.scene), undefined, reject));
    return this.toolPromise.then(
      (tool) =>
        new Promise<void>((resolve) => {
          if (this.disposed) return resolve();
          tool.traverse((o) => {
            const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (m) m.transparent = true;
          });
          const wrapper = new THREE.Group();
          wrapper.add(tool);
          this.scene.add(wrapper);
          this.press = { stamp, start: this.timer.getElapsed(), contacted: false, resolve, tool, wrapper };
          this.dirty = true;
        }),
      () => {
        this.toolPromise = undefined;
        release();
      },
    );
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.timer.dispose();
    this.observers.forEach((o) => o.disconnect());
    this.unbind.forEach((f) => f());
    this.press?.resolve();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
        mat.dispose();
      });
    });
    this.pages.forEach((p) => p.art?.dispose());
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ================================================================ page content */

  private applyContent() {
    if (!this.ready) return;
    const { identityFields, identityFieldX, identityPhoto, page } = PASSPORT_LAYOUT;
    for (const [pageId, slot] of this.pages) {
      if (!slot.art) continue;
      const list = (this.stamps.get(pageId) ?? []).filter((s) => s.id !== this.held);
      const identity =
        pageId === "identity" && this.identity
          ? {
              fields: identityFields.map((f) => ({
                x: identityFieldX / page.w,
                y: (f.lineY - 12) / page.h,
                value: this.identity![f.id as keyof IdentityValues] ?? "",
              })),
              photo: this.identity.photo
                ? { src: this.identity.photo, x: identityPhoto.x / page.w, y: identityPhoto.y / page.h, w: identityPhoto.w / page.w, h: identityPhoto.h / page.h }
                : undefined,
            }
          : undefined;
      const signature = JSON.stringify([list.map((s) => [s.id, s.x, s.y, s.widthRatio, s.rotationDeg, s.zIndex, s.visitDate]), identity]);
      if (signature === slot.signature) continue;
      slot.signature = signature;
      void slot.art.render(list, identity);
    }
  }

  /* ================================================================ cover and leaves */

  private retargetLeaves() {
    if (!this.ready) return;
    const now = this.timer.getElapsed();
    // Leaves wait for the cover to be mostly open; closing turns them back before the cover moves.
    const coverReady = this.reduced || this.coverTurn > 0.55;
    const want = this.leaves.map((_, i) => (this.view.open && coverReady && i < this.view.spread ? 1 : 0));
    const forward = this.leaves.filter((l, i) => want[i] > l.target);
    const backward = this.leaves.filter((l, i) => want[i] < l.target).reverse(); // top of the left stack first
    for (const group of [forward, backward]) {
      group.forEach((l, k) => {
        const goal = want[this.leaves.indexOf(l)];
        l.dir = goal > l.target ? 1 : -1;
        l.target = goal;
        l.startAt = now + k * STAGGER_SECONDS;
        if (this.reduced) {
          l.turn = goal;
          this.poseLeaf(l);
        }
      });
    }
  }

  private poseLeaf(l: LeafRig) {
    bendColumns(l.xs, leafPose(l.turn, l.rest, l.dir), l.bent);
    for (const mesh of [l.recto, l.verso]) {
      const geo = mesh.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let c = 0; c < l.xs.length; c++) {
        const x = l.bent[c * 2];
        const z = l.bent[c * 2 + 1];
        pos.setX(c * 2, x);
        pos.setZ(c * 2, z);
        pos.setX(c * 2 + 1, x);
        pos.setZ(c * 2 + 1, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      // Raycasting checks both bounds, and the loader's box only covers the flat pose.
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
    }
    l.node.position.z = THREE.MathUtils.lerp(l.zRight, l.zLeft, easeInOut(l.turn));
  }

  private leavesSettled() {
    return this.leaves.every((l) => l.turn === l.target);
  }

  /** A page is "shown" when it lies open in the current spread and nothing is turning. */
  private isPageShown(pageId: string) {
    if (!this.view.open || this.coverTurn < 1 || !this.leavesSettled()) return false;
    const s = SPREADS[this.view.spread];
    return !!s && (s.left === pageId || s.right === pageId);
  }

  /* ================================================================ geometry helpers */

  /** World frame of a page image: origin at its top-left, ex → right, ey → down, n → out of the paper. */
  private frameOf(pageId: string): Frame | null {
    const slot = this.pages.get(pageId);
    if (!slot || slot.side === "inside") return null;
    const mesh = slot.mesh;
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry.attributes.position;
    const last = pos.count - 2;
    const v = (i: number) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
    // The recto image starts at the spine; the verso image starts at the outer edge.
    const [tl, tr, bl] = slot.side === "recto" ? [v(0), v(last), v(1)] : [v(last), v(0), v(last + 1)];
    const ex = tr.clone().sub(tl);
    const ey = bl.clone().sub(tl);
    const w = ex.length();
    const h = ey.length();
    ex.normalize();
    ey.normalize();
    return { origin: tl, ex, ey, n: ey.clone().cross(ex).normalize(), w, h };
  }

  private pointOn(f: Frame, x: number, y: number, lift = 0) {
    return f.origin.clone().addScaledVector(f.ex, x * f.w).addScaledVector(f.ey, y * f.h).addScaledVector(f.n, lift);
  }

  private stageFraction(clientX: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return (clientX - r.left) / (r.width || 1);
  }

  private rayFrom(clientX: number, clientY: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / (r.width || 1)) * 2 - 1, -((clientY - r.top) / (r.height || 1)) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster;
  }

  private hitPage(clientX: number, clientY: number): Hit | null {
    if (!this.ready) return null;
    const hit = this.rayFrom(clientX, clientY).intersectObjects(this.pageMeshes, false)[0];
    if (!hit?.uv) return null;
    const pageId = hit.object.userData.pageId as string;
    const side = this.pages.get(pageId)?.side ?? "recto";
    let fromSpine = side === "recto" ? hit.uv.x : 1 - hit.uv.x;
    if (side === "inside") {
      // The inside cover's UVs follow the board, so measure from the spine in book space instead.
      const local = this.rig.worldToLocal(hit.point.clone());
      fromSpine = clamp01((-BOOK_W / 2 - local.x) / BOOK_W);
    }
    return { pageId, x: hit.uv.x, y: hit.uv.y, side, fromSpine };
  }

  /** Project a screen point onto a page's plane, so a drag keeps working past the paper's edge. */
  private projectToPage(pageId: string, clientX: number, clientY: number): PageHit | null {
    const f = this.frameOf(pageId);
    if (!f) return null;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(f.n, f.origin);
    const p = this.rayFrom(clientX, clientY).ray.intersectPlane(plane, new THREE.Vector3());
    if (!p) return null;
    const d = p.sub(f.origin);
    return { pageId, x: d.dot(f.ex) / f.w, y: d.dot(f.ey) / f.h };
  }

  private stampAt(hit: PageHit) {
    return [...(this.stamps.get(hit.pageId) ?? [])].sort((a, b) => b.zIndex - a.zIndex).find((s) => insideStamp(hit, s));
  }

  /** Which way a tap at this point turns the book, or 0. */
  private flipAt(clientX: number, hit: Hit | null): 1 | -1 | 0 {
    const f = this.stageFraction(clientX);
    const zone = this.mode === "place" ? STAGE_EDGE.place : STAGE_EDGE.browse;
    if (f > 1 - zone) return 1;
    if (f < zone) return -1;
    if (!hit || this.mode === "place") return 0;
    if (this.view.focus !== "spread") {
      // Zoomed onto one page: either side of it turns.
      const x = hit.side === "recto" ? hit.fromSpine : 1 - hit.fromSpine;
      return x > PAGE_EDGE ? 1 : x < 1 - PAGE_EDGE ? -1 : 0;
    }
    if (hit.fromSpine < PAGE_EDGE) return 0;
    return hit.side === "recto" ? 1 : -1;
  }

  /* ================================================================ input */

  private bindInput() {
    const el = this.renderer.domElement;
    const on = <K extends keyof HTMLElementEventMap>(type: K | "webglcontextlost", fn: (e: K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event) => void) => {
      const listener = fn as EventListener;
      el.addEventListener(type, listener);
      this.unbind.push(() => el.removeEventListener(type, listener));
    };
    on("pointerdown", (e) => this.pointerDown(e));
    on("pointermove", (e) => this.pointerMove(e));
    on("pointerup", (e) => this.pointerUp(e));
    on("pointercancel", () => (this.pointer = undefined));
    on("pointerleave", () => (el.style.cursor = ""));
    on("webglcontextlost", (e) => {
      e.preventDefault();
      this.handlers.onError("3D graphics were interrupted.");
    });
  }

  private pointerDown(e: PointerEvent) {
    if (!this.ready || (e.pointerType === "mouse" && e.button !== 0) || this.mode === "locked" || this.press) return;
    const p: NonNullable<PassportScene["pointer"]> = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: 0, kind: "none" };
    this.pointer = p;
    if (!this.view.open) {
      p.kind = "rotate";
    } else if (this.mode === "place") {
      const hit = this.hitPage(e.clientX, e.clientY);
      const onPaper = !!hit && STAMPABLE_PAGE_IDS.includes(hit.pageId) && this.isPageShown(hit.pageId);
      const g = this.ghostState;
      if (hit && onPaper && g && g.pageId === hit.pageId && insideStamp(hit, g)) {
        // Grab the stamp where the finger is, so it doesn't jump under it.
        p.kind = "ghost";
        p.pageId = hit.pageId;
        p.grab = { dx: hit.x - g.x, dy: hit.y - g.y };
      } else if (this.flipAt(e.clientX, hit)) {
        p.kind = "edge";
      } else if (hit && onPaper) {
        p.kind = "ghost";
        p.pageId = hit.pageId;
        p.grab = { dx: 0, dy: 0 };
        this.handlers.onPlace({ pageId: hit.pageId, x: hit.x, y: hit.y }, "start");
      } else return;
      e.preventDefault();
    } else {
      p.kind = "swipe";
    }
    this.renderer.domElement.setPointerCapture(e.pointerId);
  }

  private pointerMove(e: PointerEvent) {
    const p = this.pointer;
    if (!p || p.id !== e.pointerId) {
      if (e.pointerType === "mouse") this.hover(e);
      return;
    }
    const dx = e.clientX - p.lastX;
    const dy = e.clientY - p.lastY;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    p.moved = Math.max(p.moved, Math.hypot(e.clientX - p.x, e.clientY - p.y));
    if (p.kind === "rotate") {
      this.yaw = Math.max(-1.2, Math.min(1.2, this.yaw + dx * 0.008));
      this.pitch = Math.max(-0.35, Math.min(0.45, this.pitch + dy * 0.005));
      this.dirty = true;
    } else if (p.kind === "ghost" && p.pageId && p.grab) {
      const hit = this.projectToPage(p.pageId, e.clientX, e.clientY);
      if (hit) this.handlers.onPlace({ pageId: p.pageId, x: hit.x - p.grab.dx, y: hit.y - p.grab.dy }, "move");
    }
  }

  private pointerUp(e: PointerEvent) {
    const p = this.pointer;
    if (!p || p.id !== e.pointerId) return;
    this.pointer = undefined;
    const tap = p.moved < 8;
    if (p.kind === "rotate") {
      if (tap) this.handlers.onTapClosed();
      return;
    }
    if (p.kind === "ghost") {
      if (p.pageId && this.ghostState) this.handlers.onPlace({ pageId: p.pageId, x: this.ghostState.x, y: this.ghostState.y }, "end");
      return;
    }
    if (p.kind === "edge") {
      const dir = this.flipAt(e.clientX, this.hitPage(e.clientX, e.clientY));
      if (tap && dir) this.handlers.onFlip(dir);
      return;
    }
    if (p.kind !== "swipe") return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!tap) {
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) this.handlers.onFlip(dx < 0 ? 1 : -1);
      return;
    }
    const raw = this.hitPage(e.clientX, e.clientY);
    const hit = raw && this.isPageShown(raw.pageId) ? raw : null;
    const dir = this.flipAt(e.clientX, hit);
    const stamp = hit ? this.stampAt(hit) : undefined;
    const f = this.stageFraction(e.clientX);
    if (stamp && f > STAGE_EDGE.browse && f < 1 - STAGE_EDGE.browse) return this.handlers.onTapStamp(stamp.id);
    if (dir) return this.handlers.onFlip(dir);
    if (hit) this.handlers.onTapPage({ pageId: hit.pageId, x: hit.x, y: hit.y });
  }

  private hover(e: PointerEvent) {
    const el = this.renderer.domElement;
    if (!this.ready || this.mode === "locked" || this.press) return void (el.style.cursor = "");
    if (!this.view.open) return void (el.style.cursor = "grab");
    const raw = this.hitPage(e.clientX, e.clientY);
    const hit = raw && this.isPageShown(raw.pageId) ? raw : null;
    if (this.mode === "place") {
      const g = this.ghostState;
      if (hit && g && g.pageId === hit.pageId && insideStamp(hit, g)) el.style.cursor = "grab";
      else if (this.flipAt(e.clientX, hit)) el.style.cursor = "pointer";
      else el.style.cursor = hit && STAMPABLE_PAGE_IDS.includes(hit.pageId) ? "crosshair" : "";
      return;
    }
    if (this.flipAt(e.clientX, hit) || (hit && this.stampAt(hit))) el.style.cursor = "pointer";
    else el.style.cursor = hit && this.view.focus === "spread" ? "zoom-in" : "";
  }

  /* ================================================================ frame loop */

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /** Camera distance that fits a w × h box (world units) in the stage. */
  private fitDistance(w: number, h: number) {
    const t = Math.tan((FOV * DEG) / 2);
    return Math.max(h / 2 / t, w / 2 / (t * this.aspect));
  }

  private goals() {
    const { open, focus } = this.view;
    if (!open) {
      return { yaw: -0.35, pitch: 0.08, shift: 0, pos: new THREE.Vector3(0, 0.15, Math.max(3.4, this.fitDistance(1.3, 1.62))), look: new THREE.Vector3() };
    }
    // Opening, or riffling through several leaves: show the whole spread first, then zoom in.
    const riffling = this.coverTurn < 1 || this.leaves.filter((l) => l.turn !== l.target).length > 1;
    if (focus === "spread" || riffling) {
      // Tipped back a little, like a book lying open on a desk.
      const d = this.fitDistance(1.94, 1.38);
      return { yaw: 0, pitch: -0.16, shift: BOOK_W / 2, pos: new THREE.Vector3(0, 0.28, PAGE_DEPTH + d), look: new THREE.Vector3(0, -0.01, PAGE_DEPTH) };
    }
    // One page, square to the camera, so dragging on it feels like paper under a finger.
    const x = focus === "right" ? PAGE_CENTRE_X : -PAGE_CENTRE_X;
    const d = this.fitDistance(0.96, 1.33);
    if (this.press) {
      // Tip the page back like a desk, so the press reads in three quarters.
      return { yaw: 0, pitch: PRESS_PITCH, shift: BOOK_W / 2, pos: new THREE.Vector3(x, 0.12, PAGE_DEPTH + d * 0.9), look: new THREE.Vector3(x, -0.04, PAGE_DEPTH) };
    }
    return { yaw: 0, pitch: 0, shift: BOOK_W / 2, pos: new THREE.Vector3(x, 0, PAGE_DEPTH + d), look: new THREE.Vector3(x, 0, PAGE_DEPTH) };
  }

  private tick(timestamp?: number) {
    if (this.disposed) return;
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const now = this.timer.getElapsed();
    if (!this.ready || !this.visible) return;
    let moving = false;

    // Cover: opens first; closes once every leaf is back on the right.
    const coverGoal = this.view.open ? 1 : this.leaves.every((l) => l.turn === 0) ? 0 : this.coverTurn;
    if (this.coverTurn !== coverGoal) {
      this.coverTurn = this.reduced ? coverGoal : approach(this.coverTurn, coverGoal, dt / COVER_SECONDS);
      if (this.cover) this.cover.rotation.y = COVER_OPEN * easeInOut(this.coverTurn);
      if (this.view.open) this.retargetLeaves();
      moving = true;
    }

    for (const l of this.leaves) {
      if (l.turn === l.target || now < l.startAt) continue;
      l.turn = this.reduced ? l.target : approach(l.turn, l.target, dt / TURN_SECONDS);
      this.poseLeaf(l);
      moving = true;
    }

    // Rig and camera ease toward the view's framing; while closed the book can be dragged around.
    const g = this.goals();
    const k = this.reduced ? 1 : 1 - Math.pow(0.003, dt);
    const dragging = this.pointer?.kind === "rotate";
    if (!dragging) {
      this.yaw += (g.yaw - this.yaw) * k;
      this.pitch += (g.pitch - this.pitch) * k;
    }
    this.shift += (g.shift - this.shift) * k;
    this.camPos.lerp(g.pos, k);
    this.camLook.lerp(g.look, k);
    const idle = !this.view.open && !this.reduced && !this.pointer;
    const float = idle ? Math.sin(now * 1.1) * 0.025 : 0;
    const sway = idle ? Math.sin(now * 0.5) * 0.06 : 0;
    this.rig.rotation.set(this.pitch, this.yaw + sway, 0);
    this.rig.position.set(this.shift, float, 0);
    this.shadow.scale.x = 1 + easeInOut(this.coverTurn) * 0.9;
    this.shadow.position.x = this.shift * 0.3;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    const settling =
      Math.abs(g.yaw - this.yaw) + Math.abs(g.pitch - this.pitch) + Math.abs(g.shift - this.shift) > 1e-4 ||
      this.camPos.distanceToSquared(g.pos) + this.camLook.distanceToSquared(g.look) > 1e-8;

    this.updateGhost();
    if (this.press) {
      this.updatePress(now);
      moving = true;
    }

    // Render only when something changed (the closed book idles with a gentle float).
    if (this.dirty || moving || settling || idle || dragging) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  }

  private updateGhost() {
    const g = this.ghostState;
    const mat = this.ghost.material as THREE.MeshBasicMaterial;
    const show = !!g && !!mat.map && this.mode === "place" && !this.press && this.isPageShown(g.pageId);
    this.ghost.visible = show;
    if (!show || !g) return;
    const f = this.frameOf(g.pageId);
    if (!f) return;
    const a = g.rotationDeg * DEG;
    const sx = f.ex.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.ey, Math.sin(a));
    const sy = f.ex.clone().multiplyScalar(Math.sin(a)).addScaledVector(f.ey, -Math.cos(a)); // the image's "up"
    this.ghost.position.copy(this.pointOn(f, g.x, g.y, 0.006));
    this.ghost.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sx, sy, f.n));
    const w = g.widthRatio * f.w;
    this.ghost.scale.set(w, w, 1);
  }

  private updatePress(now: number) {
    const p = this.press!;
    const f = this.frameOf(p.stamp.pageId); // the book is tipping back, so follow the page every frame
    if (!f) return;
    const t = clamp01((now - p.start) / PRESS_SECONDS);
    const s = p.stamp;
    const a = s.rotationDeg * DEG;
    const sx = f.ex.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.ey, Math.sin(a));
    const toolZ = sx.clone().cross(f.n);
    const centre = this.pointOn(f, s.x, s.y, 0.002);
    // Lower from above the page, squash on contact, lift away and fade.
    const down = t < PRESS_CONTACT ? 1 - easeInOut(t / PRESS_CONTACT) : 0;
    const lift = t > PRESS_LIFT ? easeInOut((t - PRESS_LIFT) / (1 - PRESS_LIFT)) : 0;
    const squash = t >= PRESS_CONTACT && t <= PRESS_LIFT ? 1 - 0.14 * Math.sin(((t - PRESS_CONTACT) / (PRESS_LIFT - PRESS_CONTACT)) * Math.PI) : 1;
    const away = down + lift;
    const scale = (s.widthRatio * f.w * 1.06) / 0.6; // the tool's pad is 0.6 wide
    p.wrapper.position.copy(centre).addScaledVector(f.n, away * 0.55).addScaledVector(f.ey, -away * 0.18);
    // Lean the handle toward the top of the page on the way in and out, square at contact.
    const tilt = (down * 16 + lift * 10) * DEG;
    p.wrapper.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sx, f.n, toolZ)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -tilt));
    p.wrapper.scale.set(scale, scale * squash, scale);
    const fade = 1 - clamp01((lift - 0.55) / 0.45);
    p.tool.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m) m.opacity = fade;
    });
    this.pressShadow.visible = true;
    this.pressShadow.position.copy(this.pointOn(f, s.x, s.y, 0.004));
    this.pressShadow.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.ex, f.ey.clone().negate(), f.n));
    const sh = s.widthRatio * f.w * (1.15 + away * 0.9);
    this.pressShadow.scale.set(sh, sh, 1);
    (this.pressShadow.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - away * 0.85) * fade;
    if (!p.contacted && t >= PRESS_CONTACT) {
      p.contacted = true;
      this.held = null;
      this.applyContent();
      this.handlers.onContact();
    }
    if (t >= 1) {
      this.scene.remove(p.wrapper);
      this.press = undefined;
      this.pressShadow.visible = false;
      this.dirty = true;
      p.resolve();
    }
  }
}
