import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shush',
    short_name: 'Shush',
    description:
      'Shush is a web-based application that allows you to run command-line utilities on your computer through the browser. It provides a user-friendly interface for managing and executing commands.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    share_target: {
      action: '/share',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        text: 'text',
      },
    },
  };
}
