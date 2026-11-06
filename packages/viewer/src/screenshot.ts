import { RenderTarget, UnsignedByteType, Vector2, Vector4 } from 'three/webgpu';
import type { PerspectiveCamera, Scene, WebGPURenderer } from 'three/webgpu';
import type { BackgroundKind } from './renderingSettings.js';

export interface ScreenshotOptions {
  /** Exact output pixels; an omitted dimension preserves the current canvas aspect ratio. */
  width?: number;
  height?: number;
  /** Defaults to PNG. JPEG cannot preserve transparency and composites it over white. */
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  /** JPEG/WebP encoding quality, from 0 to 1. */
  quality?: number;
  /** Defaults to the current backdrop; `none` preserves alpha in PNG/WebP. */
  background?: BackgroundKind;
}

export function screenshotSize(options: ScreenshotOptions, currentWidth: number, currentHeight: number) {
  const width = options.width ?? Math.round(((options.height ?? currentHeight) * currentWidth) / currentHeight);
  const height = options.height ?? Math.round((width * currentHeight) / currentWidth);
  if (
    ![width, height].every((value) => Number.isInteger(value) && value > 0 && value <= 8192) ||
    width * height > 16_777_216
  )
    throw new Error('Screenshot dimensions must be positive integers up to 8192, with at most 16 megapixels.');
  if (options.mimeType !== undefined && !['image/png', 'image/jpeg', 'image/webp'].includes(options.mimeType))
    throw new Error('Screenshot type must be image/png, image/jpeg, or image/webp.');
  if (
    options.quality !== undefined &&
    (!Number.isFinite(options.quality) || options.quality < 0 || options.quality > 1)
  )
    throw new Error('Screenshot quality must be between 0 and 1.');
  if (options.background !== undefined && !['white', 'environment', 'none'].includes(options.background))
    throw new Error('Screenshot background must be white, environment, or none.');
  return { width, height };
}

/** Convert backend readback rows into a top-to-bottom image, compositing the CSS white backdrop. */
export function screenshotPixels(bytes: Uint8Array, width: number, height: number, flipY: boolean, white: boolean) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  const stride = width * 4;
  for (let y = 0; y < height; y++) {
    const sourceRow = (flipY ? height - 1 - y : y) * stride;
    for (let x = 0; x < stride; x += 4) {
      const source = sourceRow + x;
      const target = y * stride + x;
      const alpha = bytes[source + 3]!;
      for (let channel = 0; channel < 3; channel++) {
        const value = bytes[source + channel]!;
        // Antialiased coverage is premultiplied in the render target. ImageData uses straight alpha.
        pixels[target + channel] = white ? value + 255 - alpha : alpha ? (value * 255) / alpha : 0;
      }
      pixels[target + 3] = white ? 255 : alpha;
    }
  }
  return pixels;
}

/** Stop waiting promptly when the owning viewer/source is disposed. */
export function screenshotAbortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      signal.removeEventListener('abort', cancel);
      reject(new Error('Screenshot capture was cancelled because the viewer was disposed.'));
    };
    // Attach both handlers even if already aborted, so a later GPU rejection is consumed.
    promise.then(
      (value) => {
        signal.removeEventListener('abort', cancel);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', cancel);
        reject(error);
      },
    );
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
  });
}

/** The readback promise completes only after GPU work, on both WebGPU and WebGL2. */
export async function captureScreenshot(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  render: () => void,
  options: ScreenshotOptions,
  background: BackgroundKind,
  assertCurrent: () => void,
  signal: AbortSignal,
  restoreDisplay?: () => void,
): Promise<Blob> {
  const size = renderer.getDrawingBufferSize(new Vector2());
  const { width, height } = screenshotSize(options, size.x, size.y);
  const mimeType = options.mimeType ?? 'image/png';
  const backdrop = options.background ?? background;
  // RenderPipeline already applies tone mapping and sRGB encoding. A raw RGBA8 target avoids
  // another output transform; readback bytes are directly suitable for image encoders.
  const target = new RenderTarget(width, height, { type: UnsignedByteType, depthBuffer: false });
  const previous = {
    size: renderer.getSize(new Vector2()),
    pixelRatio: renderer.getPixelRatio(),
    target: renderer.getRenderTarget(),
    viewport: renderer.getViewport(new Vector4()),
    scissor: renderer.getScissor(new Vector4()),
    scissorTest: renderer.getScissorTest(),
    aspect: camera.aspect,
    projection: camera.projectionMatrix.clone(),
    inverseProjection: camera.projectionMatrixInverse.clone(),
    toneMapping: renderer.toneMapping,
    outputColorSpace: renderer.outputColorSpace,
    background: scene.background,
  };
  let pending: Promise<import('three').TypedArray>;
  try {
    assertCurrent();
    try {
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      scene.background = backdrop === 'environment' ? scene.environment : null;
      renderer.setRenderTarget(target);
      render();
      pending = renderer.readRenderTargetPixelsAsync(target, 0, 0, width, height);
    } finally {
      // Restore synchronously: animation, resizing and user interaction can continue during readback.
      scene.background = previous.background;
      camera.aspect = previous.aspect;
      camera.projectionMatrix.copy(previous.projection);
      camera.projectionMatrixInverse.copy(previous.inverseProjection);
      renderer.toneMapping = previous.toneMapping;
      renderer.outputColorSpace = previous.outputColorSpace;
      renderer.setRenderTarget(previous.target);
      renderer.setPixelRatio(previous.pixelRatio);
      renderer.setSize(previous.size.x, previous.size.y, false);
      renderer.setViewport(previous.viewport);
      renderer.setScissor(previous.scissor);
      renderer.setScissorTest(previous.scissorTest);
      restoreDisplay?.(); // Resizing clears the display canvas; refill it before the browser can composite.
    }
    const result = await screenshotAbortable(pending, signal);
    assertCurrent();
    if (!(result instanceof Uint8Array)) throw new Error('Screenshot readback did not return RGBA bytes.');
    const backend = (renderer as unknown as { backend: { isWebGPUBackend?: boolean } }).backend;
    const pixels = screenshotPixels(
      result,
      width,
      height,
      !backend.isWebGPUBackend,
      backdrop === 'white' || mimeType === 'image/jpeg',
    );
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Screenshot image encoding is unavailable.');
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    const blob = await screenshotAbortable(
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => {
            if (value) resolve(value);
            else reject(new Error('Screenshot image encoding failed.'));
          },
          mimeType,
          options.quality,
        ),
      ),
      signal,
    );
    assertCurrent();
    if (blob.type !== mimeType) throw new Error(`Screenshot encoding is unavailable for ${mimeType}.`);
    return blob;
  } finally {
    target.dispose();
  }
}
