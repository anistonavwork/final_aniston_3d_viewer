// Offscreen thumbnail generator
/* Offscreen thumbnail generator for gallery previews */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export async function generateThumbnail(modelUrl) {
  const size = 192;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(size, size);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 2000);
  camera.position.set(2.2, 1.4, 2.2);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.9);
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3,3,3);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-3,2,-2);
  scene.add(hemi, key, rim);

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  loader.setDRACOLoader(draco);

  try {
    const gltf = await loader.loadAsync(modelUrl);
    const root = gltf.scene;
    scene.add(root);
    const box = new THREE.Box3().setFromObject(root);
    const s = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    root.position.sub(c);
    const maxDim = Math.max(s.x, s.y, s.z);
    const dist = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.2;
    camera.position.set(dist, dist * 0.6, dist);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL("image/png");
    renderer.dispose();
    return dataURL;
  } catch (e) {
    console.warn("Thumbnail generation failed:", e);
    renderer.dispose();
    return null;
  }
}
