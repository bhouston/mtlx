# Static assets

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/deployment/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Shared shaderball geometry and HDR environments for the viewer, CLI, and VS Code extension. Files in `public/` are served at `https://mtlx-static.ben3d.ca/`.

```sh
pnpm --filter static-assets dev
```

The local asset server runs at `http://localhost:3001`. Published assets use immutable caching: add a new filename when replacing an asset, because released clients may still reference the old one.

See the [asset hosting guide](https://github.com/bhouston/mtlx/blob/main/docs/development/static-assets.md) for cache policy, bucket setup, and deployment.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
