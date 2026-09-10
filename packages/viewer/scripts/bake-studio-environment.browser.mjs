import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Bakes three.js's procedural RoomEnvironment into a flat equirectangular PNG, once, offline.
// Exposed on window so the Playwright harness can call it and read back the canvas.
window.bakeStudioEnvironment = function bakeStudioEnvironment(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);

  // Capture RoomEnvironment into a cube map.
  const cubeSize = 512;
  const cubeTarget = new THREE.WebGLCubeRenderTarget(cubeSize, { type: THREE.UnsignedByteType });
  const cubeCamera = new THREE.CubeCamera(0.01, 100, cubeTarget);
  cubeCamera.update(renderer, new RoomEnvironment());

  // Re-project the cube map onto an equirectangular quad, matching three.js's own equirectUv
  // mapping (see ShaderChunk/common.glsl.js) so consumers that set
  // texture.mapping = EquirectangularReflectionMapping get exactly this orientation back.
  const material = new THREE.ShaderMaterial({
    uniforms: { envMap: { value: cubeTarget.texture } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform samplerCube envMap;
      #define PI 3.141592653589793
      vec3 equirectDir(vec2 uv) {
        float a = (uv.x - 0.5) * 2.0 * PI;
        float b = (uv.y - 0.5) * PI;
        float cb = cos(b);
        return vec3(cb * cos(a), sin(b), cb * sin(a));
      }
      void main() {
        gl_FragColor = textureCube(envMap, equirectDir(vUv));
      }
    `,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer.render(quadScene, orthoCamera);
  return canvas.toDataURL('image/png');
};
