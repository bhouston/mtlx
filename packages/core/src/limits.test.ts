import { describe, expect, it } from 'vitest';
import { assertMaterialXXmlLimits, resolveMaterialXReadLimits } from './limits.js';

describe('XML resource preflight', () => {
  it('rejects excessive nesting before constructing a recursive tree', () => {
    const xml = '<materialx>' + '<node>'.repeat(1000) + '</node>'.repeat(1000) + '</materialx>';
    expect(() => assertMaterialXXmlLimits(xml)).toThrow('maxXmlDepth');
  });

  it('counts UTF-8 bytes and supports deliberate overrides', () => {
    const xml = '<materialx doc="ééé"/>';
    expect(() => assertMaterialXXmlLimits(xml, { maxXmlBytes: xml.length })).toThrow('maxXmlBytes');
    expect(() => assertMaterialXXmlLimits(xml, { maxXmlBytes: 100 })).not.toThrow();
  });

  it('counts self-closing elements and enforces their depth', () => {
    expect(() => assertMaterialXXmlLimits('<materialx><node/><node/></materialx>', { maxXmlElements: 2 })).toThrow(
      'maxXmlElements',
    );
    expect(() => assertMaterialXXmlLimits('<materialx><node/></materialx>', { maxXmlDepth: 1 })).toThrow('maxXmlDepth');
  });

  it('ignores tag-like text inside comments, CDATA, processing instructions and attributes', () => {
    const xml = '<?test <node?><materialx doc=" > / > "><!-- <a><b> --><![CDATA[<a><b>]]><node/></materialx>';
    expect(() => assertMaterialXXmlLimits(xml, { maxXmlDepth: 2, maxXmlElements: 2 })).not.toThrow();
  });

  it('rejects entity definitions before parser expansion', () => {
    expect(() => assertMaterialXXmlLimits('<!DOCTYPE materialx [<!ENTITY x "boom">]><materialx/>')).toThrow('DTD');
    expect(() => assertMaterialXXmlLimits('<materialx><!-- <!DOCTYPE fake> --></materialx>')).not.toThrow();
  });

  it.each([0, -1, NaN, Infinity, 1.5, undefined])('rejects invalid override %s', (maxXmlDepth) => {
    expect(() => resolveMaterialXReadLimits({ maxXmlDepth })).toThrow('positive safe integer');
  });
});
