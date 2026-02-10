// src/bootstrap/cityWarmup.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export function warmCityOnce(url = "/models/city_final_draco.glb") {
  const loader = new GLTFLoader();

  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/"); // ✅ pointe vers public/draco/
  loader.setDRACOLoader(draco);

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        // optional: toucher la scene pour forcer un peu le parse
        resolve(gltf);
      },
      undefined,
      reject
    );
  });
}
