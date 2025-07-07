import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Docs',
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