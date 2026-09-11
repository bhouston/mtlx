import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { DEFAULT_RENDERING_SETTINGS, type RenderingSettings, type ToneMappingName } from './renderingSettings.js';

const TONE_MAPPING: Record<ToneMappingName, THREE.ToneMapping> = {
  neutral: THREE.NeutralToneMapping,
  aces: THREE.ACESFilmicToneMapping,
  agx: THREE.AgXToneMapping,
  reinhard: THREE.ReinhardToneMapping,
  cineon: THREE.CineonToneMapping,
  linear: THREE.LinearToneMapping,
  none: THREE.NoToneMapping,
};

/** Shared HDR pipeline. Initialize the renderer before creating this owner, then dispose it before the renderer. */
export function createViewerRendering(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  initial: RenderingSettings = DEFAULT_RENDERING_SETTINGS,
) {
  // r186 renamed PostProcessing and added AO contexts; @types/three still describes r180.
  const { RenderPipeline } = THREE as unknown as { RenderPipeline: typeof THREE.PostProcessing };
  const { builtinAOContext } = TSL as unknown as { builtinAOContext: (node: THREE.Node) => THREE.Node };
  const pipeline = new RenderPipeline(renderer);
  const prePass = TSL.pass(scene, camera, { samples: 0 });
  (prePass as unknown as { transparent: boolean }).transparent = false;
  prePass.setMRT(TSL.mrt({ output: TSL.normalView }));
  const normal = prePass.getTextureNode();
  const depth = prePass.getTextureNode('depth');
  const occlusion = ao(depth, normal, camera);
  occlusion.resolutionScale = 1;
  occlusion.samples.value = 32;
  const filteredAO = denoise(occlusion.getTextureNode(), depth, normal, camera);
  const aoTexture = TSL.convertToTexture(filteredAO);
  const aoContext = builtinAOContext(aoTexture.sample(TSL.screenUV).r);
  const scenePass = TSL.pass(scene, camera, { samples: 4 });
  const color = scenePass.getTextureNode();
  const glow = bloom(color, 0.05, 0.5, 1);
  let settings: RenderingSettings | undefined;
  let disposed = false;
  const configure = (next: RenderingSettings) => {
    if (disposed) return;
    renderer.toneMapping = TONE_MAPPING[next.toneMapping];
    if (!settings || settings.ao !== next.ao) {
      (scenePass as unknown as { contextNode: THREE.Node | null }).contextNode = next.ao ? aoContext : null;
      scenePass.needsUpdate = true;
    }
    if (!settings || settings.bloom !== next.bloom || settings.ao !== next.ao) {
      pipeline.outputNode = next.bloom ? color.add(glow) : color;
      pipeline.needsUpdate = true;
    }
    settings = { ...next };
  };
  configure(initial);
  return {
    configure,
    // Match consumer error handling while using r186's synchronous render API after renderer.init().
    async render() {
      if (!disposed) pipeline.render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pipeline.dispose();
      glow.dispose();
      scenePass.dispose();
      aoTexture.dispose();
      filteredAO.dispose();
      occlusion.dispose();
      prePass.dispose();
    },
  };
}
