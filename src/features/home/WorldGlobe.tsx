import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const SINGAPORE = { latitude: 1.35, longitude: 103.82 };
const RADIUS = 1.6;

function singaporeDirection() {
  const longitude = THREE.MathUtils.degToRad(SINGAPORE.longitude + 180);
  const latitude = THREE.MathUtils.degToRad(SINGAPORE.latitude);
  return new THREE.Vector3(
    -Math.cos(longitude) * Math.cos(latitude),
    Math.sin(latitude),
    Math.sin(longitude) * Math.cos(latitude),
  ).normalize();
}

function singaporeNorth() {
  const longitude = THREE.MathUtils.degToRad(SINGAPORE.longitude + 180);
  const latitude = THREE.MathUtils.degToRad(SINGAPORE.latitude);
  return new THREE.Vector3(
    Math.cos(longitude) * Math.sin(latitude),
    Math.cos(latitude),
    -Math.sin(longitude) * Math.sin(latitude),
  ).normalize();
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const textured = material as THREE.Material & { map?: THREE.Texture | null };
      textured.map?.dispose();
      material.dispose();
    });
  });
}

export function WorldGlobe({ reducedMotion }: { reducedMotion: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      setWebglFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0.12, 5.9);
    camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf8e3b9, 0x342316, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffdfa6, 3.1);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xc87d4e, 14, 12, 2);
    fillLight.position.set(3, -1, 3);
    scene.add(fillLight);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = -0.1;
    scene.add(globeGroup);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.035, 48, 36),
      new THREE.MeshBasicMaterial({ color: 0xf2ce8d, transparent: true, opacity: 0.16, side: THREE.BackSide }),
    );
    globeGroup.add(atmosphere);
    const equatorialHalo = new THREE.Mesh(
      new THREE.TorusGeometry(RADIUS * 1.1, 0.009, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0xd5aa63, transparent: true, opacity: 0.48 }),
    );
    equatorialHalo.rotation.x = 1.28;
    globeGroup.add(equatorialHalo);

    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xa74d32,
      metalness: 0.32,
      roughness: 0.28,
      emissive: 0x5a2518,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const pinGold = new THREE.MeshStandardMaterial({
      color: 0xf4d18a,
      metalness: 0.62,
      roughness: 0.2,
      emissive: 0x8b4a21,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const pinGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xe0a653, transparent: true, opacity: 0, depthWrite: false });
    const pin = new THREE.Group();
    const normal = singaporeDirection();
    const north = singaporeNorth();
    const east = north.clone().cross(normal).normalize();
    pin.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, normal));
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 28), pinMaterial);
    needle.rotation.z = Math.PI;
    needle.position.y = 0.22;
    pin.add(needle);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), pinGold);
    head.position.y = 0.46;
    pin.add(head);
    const inset = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 16), new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0, depthWrite: false }));
    inset.position.y = 0.48;
    pin.add(inset);
    const pinHalo = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), pinGlowMaterial);
    pinHalo.position.y = 0.46;
    pin.add(pinHalo);
    const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12), pinGold);
    anchor.rotation.x = Math.PI / 2;
    anchor.position.z = -0.06;
    pin.add(anchor);
    const targetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.012, 8, 44),
      new THREE.MeshBasicMaterial({ color: 0xf0c879, transparent: true, opacity: 0, depthWrite: false }),
    );
    targetRing.position.z = -0.1;
    pin.add(targetRing);
    globeGroup.add(pin);

    let disposed = false;
    let globeReady = false;
    let globeScene: THREE.Object3D | null = null;
    let animationFrame = 0;
    const direction = normal.clone();
    const targetYaw = Math.atan2(-direction.x, direction.z);
    const startYaw = reducedMotion ? targetYaw : targetYaw - Math.PI * 3;
    const startedAt = performance.now();
    const spinDuration = reducedMotion ? 0 : 2800;
    const pinStart = reducedMotion ? 0 : 2920;
    const pinDuration = reducedMotion ? 0 : 760;

    new GLTFLoader().load(
      "/assets/3d/world-globe.glb",
      (gltf) => {
        if (disposed) {
          disposeScene(gltf.scene);
          return;
        }
        globeScene = gltf.scene;
        globeScene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => { material.side = THREE.FrontSide; });
            object.frustumCulled = false;
          }
        });
        globeGroup.add(globeScene);
        globeReady = true;
      },
      undefined,
      () => { if (!disposed) setWebglFailed(true); },
    );

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const draw = (now: number) => {
      if (disposed) return;
      const elapsed = now - startedAt;
      const spinProgress = spinDuration ? THREE.MathUtils.clamp(elapsed / spinDuration, 0, 1) : 1;
      const spinEase = spinProgress < 0.5
        ? 4 * spinProgress ** 3
        : 1 - ((-2 * spinProgress + 2) ** 3) / 2;
      globeGroup.rotation.y = startYaw + (targetYaw - startYaw) * spinEase;

      const rawDrop = pinDuration ? THREE.MathUtils.clamp((elapsed - pinStart) / pinDuration, 0, 1) : 1;
      const drop = 1 - (1 - rawDrop) ** 3;
      pin.visible = rawDrop > 0.005 || reducedMotion;
      pin.position.copy(direction).multiplyScalar(3.14 - drop * (3.14 - RADIUS - 0.1));
      pin.scale.setScalar(0.82 + drop * 0.18);
      pinMaterial.opacity = drop;
      pinGold.opacity = drop;
      inset.material instanceof THREE.MeshBasicMaterial && (inset.material.opacity = drop);
      pinGlowMaterial.opacity = 0.12 + (Math.sin(elapsed * 0.003) + 1) * 0.07;
      targetRing.material instanceof THREE.MeshBasicMaterial && (targetRing.material.opacity = drop * 0.82);
      const pulse = 1 + (Math.sin(elapsed * 0.003) + 1) * 0.065;
      pinHalo.scale.setScalar(pulse);
      if (globeReady) renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(draw);
    };
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reducedMotion]);

  return (
    <div className={`world-globe${webglFailed ? " is-fallback" : ""}`}>
      <div ref={hostRef} className="world-globe__canvas" aria-hidden="true" />
      {webglFailed && <div className="world-globe__fallback" aria-hidden="true"><span /></div>}
    </div>
  );
}
