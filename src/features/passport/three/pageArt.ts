// Paints a 3D passport page: the page art baked into the GLB, the visitor's details
// (identity page) and every stamp impression, at its saved normalised spot.
import * as THREE from "three";
import { STAMP_ASPECT } from "../../../content/passport";
import type { StampPlace } from "../../../content/types";
import { formatVisitDate } from "../../completion/Completion";

export interface InkStamp {
  id: string;
  site: StampPlace;
  visitDate: string;
  x: number;
  y: number;
  widthRatio: number;
  rotationDeg: number;
  zIndex: number;
}

const images = new Map<string, Promise<HTMLImageElement>>();

/** Load (once) an image the canvas can draw. Same-origin SVGs keep the canvas untainted. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

const DISPLAY_FONT = '"Fraunces Variable", "Fraunces", Georgia, serif';

/** Draw one ink impression centred on the page spot, with the visit date in its blank band. */
export function drawImpression(ctx: CanvasRenderingContext2D, W: number, H: number, s: InkStamp, img: HTMLImageElement, alpha = 1) {
  const w = s.widthRatio * W;
  const h = w / STAMP_ASPECT;
  const band = s.site.stamp.dateBand;
  ctx.save();
  ctx.translate(s.x * W, s.y * H);
  ctx.rotate((s.rotationDeg * Math.PI) / 180);
  ctx.globalAlpha = 0.93 * alpha;
  // Multiply lets the paper texture show through the ink, like a real rubber stamp.
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = s.site.stamp.ink;
  ctx.globalAlpha = 0.9 * alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(h * band.h * 0.78)}px ${DISPLAY_FONT}`;
  ctx.fillText(formatVisitDate(s.visitDate).toUpperCase(), -w / 2 + (band.x + band.w / 2) * w, -h / 2 + (band.y + band.h / 2) * h, band.w * w);
  ctx.restore();
}

/** The visitor's icon in the identity page's photo box, like a passport photo. */
function drawPhoto(ctx: CanvasRenderingContext2D, W: number, H: number, box: NonNullable<IdentityArt["photo"]>, img: HTMLImageElement) {
  const x = box.x * W;
  const y = box.y * H;
  const w = box.w * W;
  const h = box.h * H;
  const pad = w * 0.07;
  const size = w - pad * 2;
  ctx.save();
  ctx.fillStyle = "#F3ECDD";
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.drawImage(img, x + pad, y + pad, size, size);
  ctx.strokeStyle = "rgba(45, 42, 35, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + pad, y + pad, size, size);
  ctx.fillStyle = "#655F52";
  ctx.font = `700 ${Math.round(W * 0.022)}px ${DISPLAY_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(W * 0.005)}px`;
  ctx.fillText("YOUR JOURNEY", x + w / 2, y + pad + size + (h - pad - size) / 2);
  ctx.restore();
}

export interface IdentityValues {
  holder: string;
  number: string;
  issued: string;
  stamps: string;
  /** The visitor's map icon, shown as the passport photo. */
  photo?: string;
}

export interface IdentityArt {
  fields: { x: number; y: number; value: string }[];
  /** Normalised photo box on the page and the image to put in it. */
  photo?: { src: string; x: number; y: number; w: number; h: number };
}

/**
 * One page's live texture. The baked art is drawn first, then the visitor's content.
 * Rendering is async (stamp images load once, then come from cache) and last-call-wins.
 */
export class PageArt {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private version = 0;

  constructor(
    private base: CanvasImageSource,
    width: number,
    height: number,
    private onUpdate: () => void,
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.drawImage(base, 0, 0, width, height);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false; // glTF UVs: v = 0 is the top of the image
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  async render(stamps: InkStamp[], identity?: IdentityArt) {
    const v = ++this.version;
    const loaded = await Promise.all(stamps.map((s) => loadImage(s.site.stamp.inkArt).catch(() => null)));
    const photo = identity?.photo ? await loadImage(identity.photo.src).catch(() => null) : null;
    if (identity) await document.fonts?.load(`600 40px ${DISPLAY_FONT}`).catch(() => undefined);
    if (v !== this.version) return; // a newer render started meanwhile
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.base, 0, 0, W, H);
    if (identity) {
      ctx.fillStyle = "#2D2A23";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = `600 ${Math.round(W * 0.038)}px ${DISPLAY_FONT}`;
      for (const f of identity.fields) ctx.fillText(f.value, f.x * W, f.y * H, W * 0.48);
      if (photo && identity.photo) drawPhoto(ctx, W, H, identity.photo, photo);
    }
    stamps
      .map((s, i) => ({ s, img: loaded[i] }))
      .sort((a, b) => a.s.zIndex - b.s.zIndex)
      .forEach(({ s, img }) => img && drawImpression(ctx, W, H, s, img));
    this.texture.needsUpdate = true;
    this.onUpdate();
  }

  dispose() {
    this.texture.dispose();
  }
}
