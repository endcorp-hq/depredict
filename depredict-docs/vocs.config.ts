import { defineConfig } from 'vocs'
import React from 'react'

export default defineConfig({
  title: 'dePredict Docs',
  head: React.createElement(React.Fragment, null,
    React.createElement('link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }),
    React.createElement('link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }),
    React.createElement('link', { rel: 'apple-touch-icon', href: '/logo.png' }),
  ),
  logoUrl: './logo.png', 
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
      text: 'Market Types',
      link: '/market-types',
    },
    {
      text: 'Oracles',
      link: '/oracles',
    },
    {
      text: 'Development Setup',
      link: '/dev-env',
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
      text: "SDK: What's New",
      link: '/sdk-whats-new',
    },
    {
      text: 'Guide: Market Creator',
      link: '/market-creator',
    },
    {
      text: 'Roadmap',
      link: '/roadmap',
    },
  ],
  
})