// esbuild's dataurl loader (see build-preview.js) turns a PNG import into a base64 data: URL.
declare module '*.png' {
  const dataUrl: string;
  export default dataUrl;
}
