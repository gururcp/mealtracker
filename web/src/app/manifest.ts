import type { MetadataRoute } from 'next';

// Web app manifest — powers "Add to Home Screen" on both iOS and Android.
// Next.js serves this at /manifest.webmanifest and auto-links it from <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Poshan · पोषण',
    short_name: 'Poshan',
    description:
      'Daily nutrition, meal logging, and weight tracker. Track your plan, log meals, watch your progress.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF7',
    theme_color: '#059669',
    lang: 'en-IN',
    dir: 'ltr',
    categories: ['health', 'lifestyle', 'medical'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
