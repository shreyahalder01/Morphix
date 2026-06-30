import type { MixedMediaStyleKey, StylePreset } from './types';

export const stylePresets: StylePreset[] = [
  {
    key: 'vintage-stop-motion-neon-2d',
    title: 'Vintage Stop-Motion + Neon 2D',
    subtitle: 'Tactile motion with bright graphic linework',
    description: 'Excellent for music videos, title sequences, and short-form social loops.',
    tags: ['stop-motion', '2D', 'neon']
  },
  {
    key: 'live-action-comic-halftone',
    title: 'Live Action + Comic Book Halftone',
    subtitle: 'Cinematic footage with pop-art ink treatment',
    description: 'Strong edges, dotted shadows, and punchy panel contrast.',
    tags: ['comic', 'halftone', 'ink']
  },
  {
    key: 'watercolor-cutout',
    title: 'Watercolor + Cut-out Collage',
    subtitle: 'Soft painted atmosphere with layered paper shapes',
    description: 'Great for dreamy travel clips and emotional storytelling.',
    tags: ['watercolor', 'paper', 'collage']
  },
  {
    key: 'paper-collage-ink',
    title: 'Paper Collage + Digital Ink',
    subtitle: 'Hand-cut texture with sharp illustrative linework',
    description: 'Balances tactile depth with crisp silhouette readability.',
    tags: ['paper', 'ink', 'mixed-media']
  },
  {
    key: 'scrapbook-cutout-motion',
    title: 'Hybrid Mixed-Media Animation',
    subtitle: 'Visible cel lines, cut paper, clay/fabric/cardboard, ink, stickers, and tape',
    description: 'A prompt-generator style that forces distinct materials to show up as physical animated layers.',
    tags: ['hybrid', 'animation', 'mixed-media']
  },
  {
    key: 'glossy-3d-rotoscope',
    title: 'Glossy 3D + Rotoscope',
    subtitle: 'Stylized depth with preserved body motion',
    description: 'Ideal for fashion, product films, and high-energy choreography.',
    tags: ['3D', 'rotoscope', 'cinematic']
  },
  {
    key: 'vhs-neon-sketch',
    title: 'VHS + Neon Sketch',
    subtitle: 'Retro analog distortion with electric line art',
    description: 'Built for stylized nostalgia, trailers, and synthwave visuals.',
    tags: ['VHS', 'retro', 'sketch']
  }
];

export function getStylePreset(styleKey: MixedMediaStyleKey) {
  return stylePresets.find((style) => style.key === styleKey) ?? stylePresets[0];
}
