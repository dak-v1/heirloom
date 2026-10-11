import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DURATION = 5400;

export function MemoryAbsorption({ photo, title, text }: { photo: string; title: string; text: string }) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 40);
    camera.position.set(3.2, 0.12, 9);
    camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffdfac, 0x321a12, 2.1));
    const amberLight = new THREE.PointLight(0xf3ba73, 30, 9, 2);
    amberLight.position.set(-2.1, 1.1, 2.1);
    scene.add(amberLight);
    const terracottaLight = new THREE.PointLight(0xc96c49, 24, 8, 2);
    terracottaLight.position.set(1.5, -1.7, 2.2);
    scene.add(terracottaLight);

    const fallbackTube = new THREE.Group();
    scene.add(fallbackTube);
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 3.35, 48, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0xd2a26f,
        metalness: 0.12,
        roughness: 0.08,
        transmission: 0.62,
        thickness: 0.45,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    tube.position.y = 1.25;
    fallbackTube.add(tube);

    const tubeGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 3.12, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd387, transparent: true, opacity: 0.26 }),
    );
    tubeGlow.position.y = 1.26;
    scene.add(tubeGlow);

    const tubeHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffe2aa, transparent: true, opacity: 0.48 });
    [-1, 1].forEach((side) => {
      const highlight = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.18, 12), tubeHighlightMaterial);
      highlight.position.set(side * 0.265, 1.25, 0.235);
      fallbackTube.add(highlight);
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2d3a0,
      metalness: 0.62,
      roughness: 0.2,
      emissive: 0x9f5132,
      emissiveIntensity: 0.9,
    });
    const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 12, 56), rimMaterial);
    topRim.position.y = 2.925;
    fallbackTube.add(topRim);
    const lowerRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 12, 56), rimMaterial);
    lowerRim.position.y = -0.425;
    fallbackTube.add(lowerRim);
    const innerRimMaterial = new THREE.MeshStandardMaterial({ color: 0x80502f, metalness: 0.5, roughness: 0.32 });
    const topInnerRim = new THREE.Mesh(new THREE.TorusGeometry(0.292, 0.018, 10, 48), innerRimMaterial);
    topInnerRim.position.y = 2.925;
    fallbackTube.add(topInnerRim);
    const lowerInnerRim = new THREE.Mesh(new THREE.TorusGeometry(0.292, 0.018, 10, 48), innerRimMaterial);
    lowerInnerRim.position.y = -0.425;
    fallbackTube.add(lowerInnerRim);

    let disposed = false;
    new GLTFLoader().load("/assets/3d/memory-archive-tube.glb", (gltf) => {
      if (disposed) return;
      fallbackTube.visible = false;
      gltf.scene.position.y = -0.425;
      gltf.scene.scale.setScalar(1.04);
      scene.add(gltf.scene);
    }, undefined, () => {
      // Keep the locally modelled glass tube if the generated asset is missing.
      fallbackTube.visible = true;
    });

    const orb = new THREE.Group();
    orb.position.y = -1.5;
    scene.add(orb);
    const orbGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 40, 32),
      new THREE.MeshBasicMaterial({ color: 0xe5a35d, transparent: true, opacity: 0.18, side: THREE.BackSide }),
    );
    orb.add(orbGlow);
    const warmCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 40, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc978, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    orb.add(warmCore);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const photoTexture = textureLoader.load(photo, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    });
    photoTexture.colorSpace = THREE.SRGBColorSpace;
    const photoGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 48, 36),
      new THREE.MeshBasicMaterial({ map: photoTexture, color: 0xfff0d8, transparent: true, opacity: 0.72, depthWrite: false }),
    );
    orb.add(photoGlobe);
    const glassShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 48, 36),
      new THREE.MeshPhysicalMaterial({
        color: 0xe5c38a,
        metalness: 0.08,
        roughness: 0.06,
        transmission: 0.55,
        thickness: 0.5,
        transparent: true,
        opacity: 0.34,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        depthWrite: false,
      }),
    );
    orb.add(glassShell);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xe5c184, metalness: 0.72, roughness: 0.24, emissive: 0x8c3f2b, emissiveIntensity: 0.8 });
    const memoryRim = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.014, 8, 88), ringMaterial);
    memoryRim.rotation.x = 0.12;
    orb.add(memoryRim);

    const moteMaterials = [0xffe1a0, 0xeaa26d, 0xfff2cc].map((color) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
    const motes = Array.from({ length: 9 }, (_, index) => {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(index % 3 === 0 ? 0.05 : 0.04, 16, 12), moteMaterials[index % moteMaterials.length]);
      scene.add(mote);
      return mote;
    });

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.fov = width < 560 ? 46 : 43;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      if (disposed) return;
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / DURATION);
      const pulse = reduceMotion ? 0.5 : (Math.sin(elapsed * 0.0032) + 1) * 0.5;

      if (!reduceMotion) {
        const rise = Math.min(1, Math.max(0, (progress - 0.08) / 0.84));
        const easedRise = rise * rise * (3 - 2 * rise);
        orb.position.y = -1.5 + easedRise * 3.55;
        orb.rotation.y = elapsed * 0.00014;
        orb.rotation.z = Math.sin(elapsed * 0.00042) * 0.035;
        memoryRim.rotation.y = Math.sin(elapsed * 0.00035) * 0.06;
        orb.scale.setScalar(Math.max(0.24, 0.98 - easedRise * 1.85 + pulse * 0.018));
        for (let i = 0; i < motes.length; i += 1) {
          const phase = (elapsed / 3000 + i / motes.length) % 1;
          const y = -0.42 + phase * 2.82;
          const fade = phase > 0.83 ? Math.max(0, (1 - phase) / 0.17) : Math.min(1, phase * 7 + 0.15);
          const size = (0.68 + pulse * 0.12) * Math.max(0.04, fade);
          motes[i].position.set(Math.sin(elapsed * 0.0015 + i) * 0.035, y, 0.02 + Math.cos(i * 1.7) * 0.025);
          motes[i].rotation.z = Math.sin(elapsed * 0.001 + i) * 0.2;
          motes[i].scale.set(size * 0.68, size * 1.55, size * 0.68);
          moteMaterials[i % moteMaterials.length].opacity = 0.8 * fade;
        }
      } else {
        orb.position.y = -1.5;
        orb.scale.setScalar(1);
        motes.forEach((mote, i) => mote.position.set(0, -0.35 + i * 0.3, 0.02));
      }

      amberLight.intensity = 24 + pulse * 12 + progress * 10;
      terracottaLight.intensity = 18 + pulse * 8 + progress * 11;
      tubeGlow.material instanceof THREE.MeshBasicMaterial && (tubeGlow.material.opacity = 0.18 + pulse * 0.12 + progress * 0.1);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      photoTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [photo]);

  const orbCaption = (title || text).trim();
  return createPortal(
    <div className="memory-cinema" role="dialog" aria-modal="true" aria-label="Preserving your memory" aria-busy="true">
      <div className="memory-cinema__blur" style={{ backgroundImage: `url("${photo}")` }} />
      <div className="memory-cinema__shade" />
      <div className="memory-cinema__stars" aria-hidden="true" />
      <div className="memory-cinema__scene" aria-hidden="true">
        <div ref={canvasHost} className="memory-cinema__canvas" />
        {webglUnavailable && (
          <div className="memory-cinema__fallback">
            <div className="memory-cinema__fallback-tube"><span /><span /><span /><span /><span /></div>
            <div className="memory-cinema__fallback-orb" style={{ backgroundImage: `url("${photo}")` }} />
          </div>
        )}
        <div className="memory-cinema__caption">
          <span className="memory-cinema__eyebrow">A small light, kept forever</span>
          <strong>Placing your memory in the archive…</strong>
          <span>{orbCaption || "Your photo becomes part of this place's living story."}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
