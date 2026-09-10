# mtlx-cli

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) project. Installs the `mtlx` command for
validating, inspecting, packing, unpacking, and transforming MaterialX files (`.mtlx`, `.mtlz`,
`.mtlx.zip`).

- Documentation: [mtlx.ben3d.ca/docs](https://mtlx.ben3d.ca/docs/documents/Command_line.html)
- Source: [github.com/bhouston/mtlx](https://github.com/bhouston/mtlx)

```sh
npm install --global mtlx-cli
```

```sh
mtlx check material.mtlx
mtlx info material.mtlz --format json
mtlx pack material.mtlx --max-image-size 2048 --image-format webp
mtlx transform material.mtlx material.mtlz --image-format webp --image-quality 90
mtlx unpack material.mtlz --output-dir material/
```

Every command supports `--format text|json|yaml`.

## License

MIT
