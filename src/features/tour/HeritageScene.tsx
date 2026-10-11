import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Site } from "../../content/types";
import type { TourHotspot } from "./config";
import { createHeritageScene } from "./scene";

export function HeritageScene({ site, hotspots, activeId, onHotspot, hidden = false, hint = "Drag or pinch to explore · swipe left for an archive image" }: { site: Site; hotspots: TourHotspot[]; activeId: string | null; onHotspot: (id: string) => void; hidden?: boolean; hint?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    const scene = createHeritageScene(site, hotspots);
    let compactView = width / height < 0.8;
    const camera = new THREE.PerspectiveCamera(compactView ? 52 : 36, width / height, 0.1, 120);
    if (compactView) camera.position.set(12.5, 10, 18.5);
    else camera.position.set(11, 9, 16);
    camera.lookAt(0, 3, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", `Interactive 3D reconstruction of ${site.name}. Drag to rotate and use the plus and minus buttons to zoom.`);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = compactView ? 11 : 9;
    controls.maxDistance = compactView ? 36 : 32;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();
    const resize = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      const nextCompact = mount.clientWidth / mount.clientHeight < 0.8;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.fov = nextCompact ? 52 : 36;
      if (nextCompact !== compactView) {
        compactView = nextCompact;
        if (compactView) camera.position.set(12.5, 10, 18.5);
        else camera.position.set(11, 9, 16);
        controls.minDistance = compactView ? 11 : 9;
        controls.maxDistance = compactView ? 36 : 32;
        controls.update();
      }
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    resize.observe(mount);
    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene.scene, camera);
      for (const [id, point] of scene.positions) {
        const marker = markerRefs.current.get(id);
        if (!marker) continue;
        const projected = point.clone().project(camera);
        const visible = projected.z < 1 && Math.abs(projected.x) < 1.12 && Math.abs(projected.y) < 1.12;
        marker.style.display = visible ? "grid" : "none";
        marker.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`;
        marker.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      controls.dispose();
      scene.scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [site, hotspots]);

  const zoom = (factor: number) => {
    const canvas = host.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: factor < 1 ? -220 : 220, bubbles: true }));
  };

  return (
    <div className={`heritage-scene${hidden ? " heritage-scene--hidden" : ""}`} ref={host} aria-hidden={hidden}>
      {failed && (
        <div className="heritage-scene__fallback">
          <img src={site.eras.find((era) => era.isToday)!.image.src} alt={site.eras.find((era) => era.isToday)!.image.alt} />
          <p>3D rendering isn't available in this browser. Here is a present-day photograph of the site.</p>
        </div>
      )}
      <div className="heritage-scene__markers" aria-label="3D tour points of interest">
        {hotspots.map((hotspot, index) => (
          <button
            key={hotspot.id}
            ref={(el) => { if (el) markerRefs.current.set(hotspot.id, el); else markerRefs.current.delete(hotspot.id); }}
            className={`heritage-scene__marker${activeId === hotspot.id ? " is-active" : ""}`}
            type="button"
            aria-label={`Explore ${hotspot.title}`}
            aria-pressed={activeId === hotspot.id}
            onClick={() => onHotspot(hotspot.id)}
          >
            <span>{index + 1}</span><b>{hotspot.label}</b>
          </button>
        ))}
      </div>
      <div className="heritage-scene__zoom" aria-label="Zoom controls">
        <button type="button" onClick={() => zoom(.8)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoom(1.2)} aria-label="Zoom out">−</button>
      </div>
      <p className="heritage-scene__hint">{hint}</p>
    </div>
  );
}
