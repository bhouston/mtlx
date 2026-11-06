<p align="center">
  <a href="https://mtlx.ben3d.ca" target="_blank" rel="noopener noreferrer">
    <img alt="mtlx logo" src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/mtlx-cli"><img src="https://img.shields.io/npm/v/mtlx-cli.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/mtlx-cli"><img src="https://img.shields.io/npm/dw/mtlx-cli.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/mtlx"><img src="https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/wzQWaBBxup"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://mtlx.ben3d.ca/docs/cli/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# mtlx-cli

> Inspect, validate, preview, and package MaterialX from your terminal.

- ✅ Validate Materials
- 👀 Preview in a Browser
- 📦 Package for the Web
- 🖼️ Render PNG Previews
- ☁️ MTLX.ai Hosted Materials

Includes the `mtlx` and `mtlx-ai` commands for local files and the MTLX.ai service.

[Read the Docs to Learn More](https://mtlx.ben3d.ca/docs/cli/).

```sh
npm install --global mtlx-cli
```

Requires Node.js 22+. Preview and rendering commands also need a GPU-backed browser.

## Inspect and preview

```sh
mtlx check material.mtlx
mtlx info material.mtlx.zip --format json
mtlx view material.mtlx.zip
```

## Package and render

```sh
mtlx transform material.mtlx -o material.mtlx.zip --profile web
mtlx render material.mtlx.zip -o preview.png --view sphere --ibl studio
```

## Use hosted materials

```sh
mtlx login
mtlx search copper
mtlx download alice/copper -o copper.mtlx.zip
```

Read the [CLI guide](https://mtlx.ben3d.ca/docs/cli/) for conversion workflows and options, or the [agent guide](https://mtlx.ben3d.ca/docs/agents/) for MCP integration. Run `mtlx --help` or `mtlx <command> --help` for terminal help.

## Contribution

See [Contributing Guide](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
