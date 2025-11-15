// GLTF/DRACO loader + helpers
/* Shared GLTF / DRACO Loader utility
   Creates and exports a configured loader used across components.
*/

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export function createGLTFLoader() {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  loader.setDRACOLoader(draco);
  return loader;
}
