/* components/viewer/viewer.js
   Robust centering on content node (local-space bounds, ignore labels, rest-pose),
   built-in glTF clips auto-start on load,
   Auto-Rotate & Quick Animations are toggleable and mutually exclusive,
   plus view pan offsets (panH/panV) for initial / fit / reset placement.
*/

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export async function initViewer() {
  const container = document.getElementById("viewer-canvas");
  const status = document.getElementById("status");

  /* ==== Adjust default view (applies on Load, Fit, Reset) ====
     yawDeg:   camera azimuth around +Y (0..360). 0 = look +Z, 90 = from +X.
     pitchDeg: camera elevation above horizon (0..90).
     distanceFactor: 1.0 = tight, 1.25 a bit farther, 1.5 further.
     panH / panV: screen-space pan in *fractions of model radius*.
       panH > 0 moves the model RIGHT on screen (camera/target nudge left),
       panV > 0 moves the model UP on screen (camera/target nudge down). */
  const initialView = {
    yawDeg: 45,
    pitchDeg: 28,
    distanceFactor: 1.25,
    panH: 0.0,
    panV: 0.0,
  };
  /* ========================================================= */

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(
    Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  );
  container.appendChild(renderer.domElement);

  function sizeToContainer() {
    const r = container.getBoundingClientRect();
    const w = Math.max(1, r.width | 0);
    const h = Math.max(1, r.height | 0);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Scene / Camera / Controls
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);


  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
  camera.position.set(2.5, 1.2, 3.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0); // orbit pivot = true center
  controls.autoRotate = false; // never auto on load
  controls.autoRotateSpeed = 1;

  sizeToContainer();

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 3, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(-3, 2, -2);
  scene.add(rim);

  // Roots
  const modelRoot = new THREE.Group(); // procedural animations act on this node
  let contentRoot = null; // imported glTF scene parented here
  scene.add(modelRoot);

  // Loaders
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  );
  loader.setDRACOLoader(draco);

  // Status chip
  const setStatus = (txt) => {
    if (!status) return;
    status.textContent = txt;
    status.style.opacity = "1";
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => {
      status.style.opacity = "0";
    }, 1400);
  };

  // Materials
  const materialCache = new WeakMap();
  function cacheMaterials(root) {
    root.traverse((o) => {
      if (!o || !o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m && !materialCache.has(m)) {
          materialCache.set(m, {
            wireframe: !!m.wireframe,
            side: m.side,
            roughness: "roughness" in m ? m.roughness : undefined,
            metalness: "metalness" in m ? m.metalness : undefined,
          });
        }
      });
    });
  }
  function resetMaterials() {
    scene.traverse((o) => {
      if (!o || !o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        const c = materialCache.get(m);
        if (!c) return;
        m.wireframe = c.wireframe;
        m.side = c.side;
        if (c.roughness !== undefined) m.roughness = c.roughness;
        if (c.metalness !== undefined) m.metalness = c.metalness;
        m.needsUpdate = true;
      });
    });
  }

  // Built-in glTF clips (AUTO-START on load)
  let mixer = null;
  let clipsPlaying = false;
  function setClipsPlaying(on) {
    if (!mixer) {
      clipsPlaying = false;
      return false;
    }
    if (on) {
      setQuickAnim({ mode: "none" });
      setAutoRotate(false);
      mixer.stopAllAction();
      (mixer._actions || []).forEach((a) => {
        a.reset();
        a.paused = false;
        a.play();
      });
      clipsPlaying = true;
    } else {
      mixer.stopAllAction();
      clipsPlaying = false;
    }
    return clipsPlaying;
  }
  function toggleClips() {
    return setClipsPlaying(!clipsPlaying);
  }
  function areClipsPlaying() {
    return !!clipsPlaying;
  }

  // Quick Animations (toggle; OFF by default)
  const quickAnim = {
    mode: "none", // 'none'|'turntable'|'swing'|'jump'|'hover'
    speed: 1,
    amp: 0.25,
    height: 0.15,
    _basePos: new THREE.Vector3(),
    _baseRot: new THREE.Euler(),
    _armed: false,
  };
  function _armBase() {
    if (quickAnim._armed) return;
    quickAnim._basePos.copy(modelRoot.position);
    quickAnim._baseRot.copy(modelRoot.rotation);
    quickAnim._armed = true;
  }
  function _restoreBase() {
    if (!quickAnim._armed) return;
    modelRoot.position.copy(quickAnim._basePos);
    modelRoot.rotation.copy(quickAnim._baseRot);
    quickAnim._armed = false;
  }
  function setQuickAnim(opts = {}) {
    const next = opts.mode ?? quickAnim.mode;
    const same = next === quickAnim.mode;
    quickAnim.speed = opts.speed ?? quickAnim.speed;
    quickAnim.amp = opts.amp ?? quickAnim.amp;
    quickAnim.height = opts.height ?? quickAnim.height;

    if (same && next !== "none") {
      // toggle off
      quickAnim.mode = "none";
      _restoreBase();
      return quickAnim.mode;
    }
    quickAnim.mode = next;
    if (quickAnim.mode !== "none") {
      setAutoRotate(false);
      setClipsPlaying(false);
      _armBase();
      controls.target.set(0, 0, 0);
      if (contentRoot) centerAndFrame(contentRoot); // start from perfect center
    } else {
      _restoreBase();
    }
    return quickAnim.mode;
  }
  function getQuickAnimMode() {
    return quickAnim.mode;
  }
  function _applyQuick(t) {
    switch (quickAnim.mode) {
      case "turntable":
        {
          const yaw = t * 0.6 * quickAnim.speed;
          modelRoot.rotation.set(
            quickAnim._baseRot.x,
            quickAnim._baseRot.y + yaw,
            quickAnim._baseRot.z
          );
          modelRoot.position.copy(quickAnim._basePos);
        }
        break;
      case "swing":
        {
          const yaw = quickAnim.amp * Math.sin(t * 2.0 * quickAnim.speed);
          modelRoot.rotation.set(
            quickAnim._baseRot.x,
            quickAnim._baseRot.y + yaw,
            quickAnim._baseRot.z
          );
          modelRoot.position.copy(quickAnim._basePos);
        }
        break;
      case "jump":
        {
          const s = Math.sin(t * 2.0 * quickAnim.speed);
          const up = Math.max(0, s) * quickAnim.height;
          const yaw = (s > 0 ? 0.5 : 0) * quickAnim.amp;
          modelRoot.position.set(
            quickAnim._basePos.x,
            quickAnim._basePos.y + up,
            quickAnim._basePos.z
          );
          modelRoot.rotation.set(
            quickAnim._baseRot.x,
            quickAnim._baseRot.y + yaw,
            quickAnim._baseRot.z
          );
        }
        break;
      case "hover":
        {
          const y =
            quickAnim.height * 0.5 * Math.sin(t * 1.5 * quickAnim.speed);
          const yaw = 0.25 * Math.sin(t * 0.7 * quickAnim.speed);
          modelRoot.position.set(
            quickAnim._basePos.x,
            quickAnim._basePos.y + y,
            quickAnim._basePos.z
          );
          modelRoot.rotation.set(
            quickAnim._baseRot.x,
            quickAnim._baseRot.y + yaw,
            quickAnim._baseRot.z
          );
        }
        break;
      case "none":
      default:
        break;
    }
  }

  // Auto-Rotate (toggle; OFF by default)
  function setAutoRotate(on) {
    if (!controls) return false;
    if (on) {
      setQuickAnim({ mode: "none" });
      setClipsPlaying(false);
      controls.target.set(0, 0, 0);
      if (contentRoot) centerAndFrame(contentRoot); // optional nudge to perfect pivot
    }
    controls.autoRotate = !!on;
    return controls.autoRotate;
  }
  function isAutoRotating() {
    return !!controls?.autoRotate;
  }

  // -------- STRICT CENTER + FIT (local-space bounds, ignore labels, rest-pose) --------
  function centerAndFrame(node) {
    if (!node) return;

    // 1) freeze built-in animation at t=0 for stable bounds (and restore later)
    let savedMixerTime = null;
    if (typeof mixer?.time === "number") {
      savedMixerTime = mixer.time;
      try {
        mixer.setTime(0);
      } catch {}
    }

    node.updateWorldMatrix(true, true);

    // 2) local-space bbox from meshes only (ignore labels/helpers)
    const IGNORE =
      /(label|text|annotation|arrow|billboard|sprite|tag|callout)/i;
    const invRoot = new THREE.Matrix4().copy(node.matrixWorld).invert();
    const tempMat = new THREE.Matrix4();
    const tempBox = new THREE.Box3();
    const localBox = new THREE.Box3().makeEmpty();

    node.traverse((obj) => {
      if (!obj.isMesh) return;
      const name = obj.name || "";
      if (IGNORE.test(name)) return;
      const geom = obj.geometry;
      if (!geom) return;
      if (!geom.boundingBox) geom.computeBoundingBox();
      if (!geom.boundingBox) return;

      tempMat.copy(invRoot).multiply(obj.matrixWorld);
      tempBox.copy(geom.boundingBox).applyMatrix4(tempMat);
      localBox.union(tempBox);
    });

    if (localBox.isEmpty()) {
      localBox.setFromObject(node); // fallback
    }

    // 3) recenter the content at origin
    const center = localBox.getCenter(new THREE.Vector3());
    node.position.sub(center);

    // 4) compute camera & pivot
    controls.target.set(0, 0, 0);

    const size = localBox.getSize(new THREE.Vector3());
    const radius = size.length() * 0.5; // approx sphere radius
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const dist =
      (radius / Math.sin(fovRad / 2)) * (initialView.distanceFactor || 1.25);

    const yaw = THREE.MathUtils.degToRad(initialView.yawDeg ?? 45);
    const pitch = THREE.MathUtils.degToRad(initialView.pitchDeg ?? 28);
    const dir = new THREE.Vector3(
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch),
      Math.cos(pitch) * Math.cos(yaw)
    ).normalize();

    // screen-space pan offsets (right/up based on camera dir)
    const upWorld = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(dir, upWorld).normalize();
    const trueUp = new THREE.Vector3().crossVectors(right, dir).normalize();

    const panH = initialView.panH || 0;
    const panV = initialView.panV || 0;
    const panOffset = new THREE.Vector3()
      .addScaledVector(right, -panH * radius)
      .addScaledVector(trueUp, -panV * radius);

    camera.position.copy(dir.multiplyScalar(dist)).add(panOffset);
    controls.target.copy(panOffset);

    controls.minDistance = Math.max(0.01, radius * 0.5);
    controls.maxDistance = radius * 10;
    controls.update();

    // 5) restore mixer time if we sampled t=0
    if (savedMixerTime !== null) {
      try {
        mixer.setTime(savedMixerTime);
      } catch {}
    }
  }

  // Load GLB (auto-start clips; no auto-rotate/quick-anim)
  async function loadModel(url) {
    try {
      setStatus("Loading...");

      // stop running motions
      setQuickAnim({ mode: "none" });
      setAutoRotate(false);
      setClipsPlaying(false);
      mixer?.stopAllAction();
      mixer = null;
      clipsPlaying = false;

      // dispose old content
      if (contentRoot) {
        contentRoot.traverse((o) => {
          if (o.isMesh) {
            o.geometry?.dispose?.();
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(
              (m) => m?.dispose?.()
            );
          }
        });
        modelRoot.remove(contentRoot);
        contentRoot = null;
      }

      const gltf = await loader.loadAsync(url);
      contentRoot = gltf.scene;
      modelRoot.add(contentRoot);

      cacheMaterials(contentRoot);
      centerAndFrame(contentRoot);

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(contentRoot);
        (gltf.animations || []).forEach((clip) => {
          const a = mixer.clipAction(clip);
          a.clampWhenFinished = false;
          a.loop = THREE.LoopRepeat;
          a.paused = false;
          a.play(); // AUTO-START
        });
        clipsPlaying = true;
      }

      setStatus("Loaded");
    } catch (err) {
      console.error("Model load error:", err);
      setStatus("Error");
    }
  }

  // Reset / Fit
  function resetView() {
    if (contentRoot) centerAndFrame(contentRoot);
    setStatus("Ready");
  }
  function autoFrame() {
    if (contentRoot) centerAndFrame(contentRoot);
  }

  // Optional pulse (manual)
  const clock = new THREE.Clock();
  const pulse = { enabled: false, bpm: 60, amp: 0.06 };
  function enablePulse(on = true, bpm = 60, amp = 0.06) {
    pulse.enabled = !!on;
    pulse.bpm = bpm;
    pulse.amp = amp;
  }

  // Live view tuning API
  function setView(cfg = {}) {
    if ("yawDeg" in cfg) initialView.yawDeg = cfg.yawDeg;
    if ("pitchDeg" in cfg) initialView.pitchDeg = cfg.pitchDeg;
    if ("distanceFactor" in cfg)
      initialView.distanceFactor = cfg.distanceFactor;
    if ("panH" in cfg) initialView.panH = cfg.panH;
    if ("panV" in cfg) initialView.panV = cfg.panV;
    if (contentRoot) centerAndFrame(contentRoot);
  }

  // Events & loop
  window.addEventListener("resize", sizeToContainer);
  new ResizeObserver(sizeToContainer).observe(container);

  window.addEventListener("model:open", (e) => {
    const { href } = e.detail || {};
    if (href) loadModel(href);
  });
  container.addEventListener("viewer:fit", () => autoFrame());
  container.addEventListener("viewer:reset", () => resetView());

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    if (mixer && clipsPlaying) mixer.update(dt);
    if (pulse.enabled) {
      const t = clock.getElapsedTime();
      const s = 1 + pulse.amp * Math.sin(Math.PI * 2 * (pulse.bpm / 60) * t);
      modelRoot.scale.setScalar(s);
    }
    if (quickAnim.mode !== "none") _applyQuick(clock.getElapsedTime());
    controls.update();
    renderer.render(scene, camera);
  });

  // Public API for right panel / console
  window.viewer3D = {
    // load / view
    loadModel,
    resetView,
    autoFrame,
    setView,
    // built-in clips
    setClipsPlaying,
    toggleClips,
    areClipsPlaying,
    // auto-rotate
    setAutoRotate,
    isAutoRotating,
    // quick animations
    setQuickAnim,
    getQuickAnimMode,
    // pulse (optional)
    enablePulse,
    // env
    scene,
    camera,
    controls,
    renderer,
    THREE,
    lights: { hemi, key, rim },
    // materials
    resetMaterials,
  };

  setStatus("Ready");
}
