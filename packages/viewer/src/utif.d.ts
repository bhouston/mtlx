declare module 'three/addons/libs/utif.module.js' {
  interface UtifIfd {
    width: number;
    height: number;
  }
  const UTIF: {
    decode(buffer: ArrayBuffer): UtifIfd[];
    decodeImage(buffer: ArrayBuffer, ifd: UtifIfd): void;
    toRGBA8(ifd: UtifIfd): Uint8Array;
  };
  export default UTIF;
}
