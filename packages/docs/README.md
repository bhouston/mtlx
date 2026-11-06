# mtlx documentation website

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/contributing/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Docusaurus documentation and product site for [mtlx.ben3d.ca](https://mtlx.ben3d.ca), including the browser viewer, editor, and embed.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm docs:dev
```

Build the static site with `pnpm docs:build`; preview it with `pnpm --filter mtlx-docs serve`. Generated API references, CLI documentation, and application assets are rebuilt from source.

See [contributing](https://mtlx.ben3d.ca/docs/contributing/) for local checks and [deployment](https://mtlx.ben3d.ca/docs/deployment/) for GitHub Pages and DNS setup.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
