const clidocPlugin = require('@clidoc/docusaurus');
const url = process.env.SITE_URL ?? 'https://mtlx.ben3d.ca';
const baseUrl = process.env.BASE_URL ?? '/';

module.exports = {
  title: 'mtlx',
  tagline: 'MaterialX tools for the web, the terminal, and your editor.',
  url,
  baseUrl,
  favicon: 'img/logo.webp',
  organizationName: 'bhouston',
  projectName: 'mtlx',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: { format: 'detect' },
  presets: [
    [
      'classic',
      {
        docs: { routeBasePath: 'docs', sidebarPath: './sidebars.js' },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],
  themes: [[require.resolve('@easyops-cn/docusaurus-search-local'), { hashed: true, indexBlog: false }]],
  plugins: [
    [clidocPlugin, { input: 'mtlx.opencli.json', outputDir: 'docs/cli-reference', basePath: '/cli/reference' }],
  ],
  themeConfig: {
    image: 'img/material-preview.png',
    colorMode: { defaultMode: 'light', respectPrefersColorScheme: true },
    navbar: {
      title: 'mtlx',
      logo: { alt: 'MaterialX tools', src: 'img/logo.webp' },
      items: [
        { to: '/docs/quick-start', label: 'Get started', position: 'left' },
        { to: '/docs/cli', label: 'CLI', position: 'left' },
        { to: '/docs/vscode', label: 'VS Code', position: 'left' },
        { to: '/docs/core', label: 'Libraries', position: 'left' },
        { to: '/viewer', label: 'Viewer', position: 'left' },
        { to: '/editor', label: 'Editor', position: 'left' },
        { href: 'https://github.com/bhouston/mtlx', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Tools',
          items: [
            { label: 'Material viewer', to: '/viewer' },
            { label: 'Node editor', to: '/editor' },
            { label: 'VS Code extension', to: '/docs/vscode' },
          ],
        },
        {
          title: 'Build',
          items: [
            { label: 'Core library', to: '/docs/core' },
            { label: 'Viewer and React', to: '/docs/viewer' },
            { label: 'SDK', to: '/docs/sdk' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/bhouston/mtlx' },
            { label: 'Report an issue', href: 'https://github.com/bhouston/mtlx/issues' },
            { label: 'Contributing', to: '/docs/contributing' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} mtlx · MIT · Created by <a href="https://ben3d.ca">Ben Houston</a> · Sponsored by <a href="https://landofassets.com">Land of Assets</a>`,
    },
  },
};
