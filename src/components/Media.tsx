import { useState, type CSSProperties, type ReactNode } from "react";
import { ImageOff, RotateCw } from "lucide-react";
import type { ImageAsset } from "../content/types";

/** Aspect ratio of an image after its optional crop. */
export function displayRatio(img: ImageAsset): number {
  const c = img.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  return (img.width * c.w) / (img.height * c.h);
}

interface FramedImageProps {
  image: ImageAsset;
  /** Rendered over the image in the same (cropped) coordinate space, e.g. hotspots. */
  overlay?: ReactNode;
  className?: string;
  /** Hide alt text from assistive tech when a caption already describes it. */
  decorative?: boolean;
  sizes?: string;
  style?: CSSProperties;
  eager?: boolean;
}

/**
 * Shows an image at its exact (cropped) aspect ratio, so normalised overlay
 * coordinates stay attached to the same feature at every viewport size.
 * Never uses object-fit: cover on content images with hotspots.
 */
export function FramedImage({ image, overlay, className, decorative, sizes = "(max-width: 700px) 100vw, 700px", style, eager }: FramedImageProps) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const c = image.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const imgStyle: CSSProperties = {
    width: `${100 / c.w}%`,
    height: `${100 / c.h}%`,
    left: `${(-c.x / c.w) * 100}%`,
    top: `${(-c.y / c.h) * 100}%`,
  };
  const srcSet = image.srcSmall && !image.crop ? `${image.srcSmall} 640w, ${image.src} ${image.width}w` : undefined;
  return (
    <div
      className={["framed", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: String(displayRatio(image)), "--ratio": displayRatio(image), ...style } as CSSProperties}
      data-state={state}
    >
      {state !== "error" && (
        <img
          key={attempt}
          className="framed__img"
          src={image.src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={decorative ? "" : image.alt}
          style={imgStyle}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
        />
      )}
      {state === "loading" && <div className="framed__skeleton" aria-hidden="true" />}
      {state === "error" && (
        <div className="framed__error" role="img" aria-label={`Image unavailable: ${image.alt}`}>
          <ImageOff size={28} aria-hidden="true" />
          <p>This photograph couldn't load. You may be offline.</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              setState("loading");
              setAttempt((a) => a + 1);
            }}
          >
            <RotateCw size={16} aria-hidden="true" /> Try again
          </button>
        </div>
      )}
      {state === "ok" && overlay}
    </div>
  );
}

export function StampArt({ src, alt, tilt = 0, className, size }: { src: string; alt: string; tilt?: number; className?: string; size?: number }) {
  return (
    <img
      className={["stamp-art", className].filter(Boolean).join(" ")}
      src={src}
      alt={alt}
      width={size}
      height={size ? Math.round((size * 380) / 300) : undefined}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
      draggable={false}
    />
  );
}

export function Tag({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "terracotta" | "olive" | "blue" | "mustard" | "draft" | "demo"; title?: string }) {
  return (
    <span className={`tag tag--${tone}`} title={title}>
      {children}
    </span>
  );
}
