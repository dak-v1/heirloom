import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface Props {
  open: boolean;
  reducedMotion: boolean;
  onTap: () => void;
  onReady: () => void;
  onError: (reason: string) => void;
}

const MODEL_URL = "/assets/3d/heirloom-passport.glb";

function contactShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(45,42,35,0.45)");
  grd.addColorStop(1, "rgba(45,42,35,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * The 3D Heritage Passport (public/assets/3d/heirloom-passport.glb).
 * Drag to turn it; tap to open or close (plays the model's "Open" clip).
 * Loaded lazily so three.js only downloads on the passport page.
 */
export default function Passport3D({ open, reducedMotion, onTap, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ setOpen: (o: boolean, instant: boolean) => void } | null>(null);
  const cb = useRef({ onTap, onReady, onError });
  cb.current = { onTap, onReady, onError };
  const motion = useRef(reducedMotion);
  motion.current = reducedMotion;
  const openRef = useRef(open);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      cb.current.onError("3D graphics aren't available on this device.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.45;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.15, 3.35);
    camera.lookAt(0, 0, 0);

    const key = new THREE.DirectionalLight(0xfff1dc, 1.9);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
    fill.position.set(3, -1, 2);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b5a48, 0.45));

    const rig = new THREE.Group();
    scene.add(rig);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.78;
    scene.add(shadow);

    let mixer: THREE.AnimationMixer | null = null;
    let action: THREE.AnimationAction | null = null;
    let disposed = false;
    const clock = new THREE.Clock();

    // interaction state
    let yaw = -0.35, pitch = 0.08, targetYaw = -0.35, targetPitch = 0.08;
    let shiftX = 0, targetShift = 0, zoom = 3.35, targetZoom = 3.35;
    let dragging = false, moved = 0, lastX = 0, lastY = 0;

    const setOpen = (o: boolean, instant: boolean) => {
      openRef.current = o;
      targetYaw = o ? 0 : -0.35;
      targetPitch = o ? 0.02 : 0.08;
      targetShift = o ? 0.44 : 0;
      targetZoom = o ? 3.9 : 3.35;
      if (!action || !mixer) return;
      const dur = action.getClip().duration;
      if (instant) {
        action.play();
        action.paused = true;
        action.time = o ? dur : 0;
        mixer.update(0);
        yaw = targetYaw;
        pitch = targetPitch;
        shiftX = targetShift;
        zoom = targetZoom;
        return;
      }
      action.paused = false;
      action.timeScale = o ? 1 : -1.25;
      if (!action.isRunning()) {
        if (o && action.time >= dur) action.time = 0;
        if (!o && action.time <= 0) action.time = dur;
      }
      action.play();
    };
    api.current = { setOpen };

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        rig.add(gltf.scene);
        mixer = new THREE.AnimationMixer(gltf.scene);
        const clip = gltf.animations.find((a) => a.name === "Open");
        if (clip) {
          action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        setOpen(openRef.current, true);
        cb.current.onReady();
      },
      undefined,
      () => cb.current.onError("The 3D passport model couldn't load."),
    );

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      mixer?.update(dt);
      const k = motion.current ? 1 : 1 - Math.pow(0.0015, dt);
      if (!dragging) {
        yaw += (targetYaw - yaw) * k;
        pitch += (targetPitch - pitch) * k;
      }
      shiftX += (targetShift - shiftX) * k;
      zoom += (targetZoom - zoom) * k;
      const float = motion.current || dragging ? 0 : Math.sin(t * 1.1) * 0.025;
      rig.rotation.set(pitch, yaw + (motion.current || dragging || openRef.current ? 0 : Math.sin(t * 0.5) * 0.06), 0);
      rig.position.set(shiftX, float, 0);
      camera.position.set(0, 0.15, zoom);
      shadow.scale.x = openRef.current ? 1.9 : 1;
      shadow.position.x = shiftX * 0.3;
      renderer.render(scene, camera);
    });

    const canvas = renderer.domElement;
    canvas.style.touchAction = "pan-y";
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      yaw = Math.max(-1.2, Math.min(1.2, yaw + dx * 0.008));
      pitch = Math.max(-0.35, Math.min(0.45, pitch + dy * 0.005));
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      if (moved < 8) cb.current.onTap();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    const lost = (e: Event) => {
      e.preventDefault();
      cb.current.onError("3D graphics were interrupted.");
    };
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      disposed = true;
      api.current = null;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
          Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
          mat.dispose();
        });
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    api.current?.setOpen(open, motion.current);
  }, [open]);

  return <div ref={host} className="passport3d__canvas" />;
}
