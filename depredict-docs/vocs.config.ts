import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'dePredict Docs',
  topNav: [
    { text: 'Getting Started', link: '/getting-started', match: '/getting-started' },
    { text: 'Architecture', link: '/architecture', match: '/architecture' },
    { text: 'GitHub', link: 'https://github.com/endcorp-hq/depredict' },
    { text: 'END Corp.', link: 'https://endcorp.co' }
  ],
  sidebar: [
    {
      text: 'Overview',
      link: '/overview',
    },
    {
      text: 'Getting Started',
      link: '/getting-started',
    },
    {
      text: 'Architecture',
      link: '/architecture',
    },
    {
      text: 'SDK API Reference',
      link: '/sdk-api',
    },
    {
      text: 'SDK Example Usage',
      link: '/sdk-example',
    },
    {
      text: 'Roadmap',
      link: '/roadmap',
    },
  ],
  
})