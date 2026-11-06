const clidocPlugin = require('@clidoc/docusaurus');
const url = process.env.SITE_URL ?? 'https://mtlx.ben3d.ca';
const baseUrl = process.env.BASE_URL ?? '/';

const link = (attributes) => ({ tagName: 'link', attributes });
// Raw head tags: `themeConfig.metadata` goes through Helmet, which keeps one tag per name and would drop a theme-color.
const themeColor = (content, scheme) => ({
  tagName: 'meta',
  attributes: { name: 'theme-color', content, media: `(prefers-color-scheme: ${scheme})` },
});

module.exports = {
  title: 'mtlx',
  tagline: 'MaterialX tools for the web, the terminal, and your editor.',
  url,
  baseUrl,
  favicon: 'img/logo.webp',
  headTags: [
    link({ rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseUrl}img/favicon-32x32.png` }),
    link({ rel: 'apple-touch-icon', sizes: '180x180', href: `${baseUrl}img/apple-touch-icon.png` }),
    link({ rel: 'manifest', href: `${baseUrl}site.webmanifest` }),
    themeColor('#ffffff', 'light'),
    themeColor('#11151d', 'dark'),
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'mtlx',
        url: new URL(baseUrl, url).href,
        description:
          'View, edit, validate and automate MaterialX with an open-source TypeScript toolkit for browsers, Node and VS Code.',
      }),
    },
  ],
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
  plugins: [
    [clidocPlugin, { input: 'mtlx.opencli.json', outputDir: 'docs/cli-reference', basePath: '/cli/reference' }],
  ],
  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      { property: 'og:site_name', content: 'mtlx' },
      { name: 'twitter:site', content: '@BenHouston3D' },
    ],
    colorMode: { defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: true },
    navbar: {
      title: 'mtlx',
      logo: { alt: 'MaterialX tools', src: 'img/logo.webp' },
      items: [
        { to: '/viewer', label: 'Viewer', position: 'left' },
        { to: '/editor', label: 'Editor', position: 'left' },
        { to: '/docs/material-viewer', label: '<material-viewer>', position: 'left' },
        { to: '/docs/cli', label: 'CLI', position: 'left' },
        { to: '/docs/vscode', label: 'VS Code', position: 'left' },
        {
          href: 'https://github.com/bhouston/mtlx',
          html: '<span class="navbar-github-icon" aria-hidden="true"></span>',
          'aria-label': 'GitHub repository',
          title: 'GitHub repository',
          position: 'right',
        },
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
      copyright:
        'Made with ❤️ by <a href="https://ben3d.ca">Ben Houston</a>. Sponsored by <a href="https://landofassets.com">Land of Assets</a>',
    },
  },
};
