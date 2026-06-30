// Pure data file — no React, no 'use client'.
// Safe to import from server files (api routes, lib/) AND client components.

export type Category =
  | 'Artistic'
  | 'Cinematic'
  | 'Retro & Vintage'
  | 'Street & Urban'
  | 'Surreal & Abstract'
  | 'Graphic';

export interface Style {
  id: string;
  name: string;
  tag: string;
  tagColor:
    | 'popular' | 'trending' | 'new' | 'hot' | 'clean'
    | 'soft' | 'moody' | 'retro' | 'dreamy' | 'bold' | 'dark' | 'surreal';
  category: Category;
  description: string;
  /** ComfyUI workflow slug or prompt prefix to pass to your AI engine */
  promptHint: string;
  /** Accent gradient for the tile preview swatch */
  gradient: string;
}

export const STYLES: Style[] = [
  // ── Artistic ──────────────────────────────────────────────────
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    tag: 'Dreamy',
    tagColor: 'dreamy',
    category: 'Artistic',
    description: 'Hand-painted backgrounds, soft natural light',
    promptHint: 'studio ghibli style, painterly backgrounds, warm lighting',
    gradient: 'linear-gradient(135deg,#6ee7b7,#3b82f6)',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    tag: 'Soft',
    tagColor: 'soft',
    category: 'Artistic',
    description: 'Wet-on-wet washes, translucent pigment bloom',
    promptHint: 'watercolor wash, wet paper texture, bleeding pigment',
    gradient: 'linear-gradient(135deg,#fca5a5,#93c5fd)',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    tag: 'Classic',
    tagColor: 'moody',
    category: 'Artistic',
    description: 'Thick impasto strokes, rich chiaroscuro depth',
    promptHint: 'oil painting, impasto brushwork, chiaroscuro, museum quality',
    gradient: 'linear-gradient(135deg,#d97706,#7c3aed)',
  },
  {
    id: 'sketch',
    name: 'Hand-drawn Sketch',
    tag: 'Clean',
    tagColor: 'clean',
    category: 'Artistic',
    description: 'Pencil cross-hatching, loose gestural linework',
    promptHint: 'pencil sketch, cross-hatching, gestural lines, graphite',
    gradient: 'linear-gradient(135deg,#e2e8f0,#94a3b8)',
  },
  {
    id: 'ink',
    name: 'Ink & Brush',
    tag: 'Bold',
    tagColor: 'bold',
    category: 'Artistic',
    description: 'East Asian sumi-e brushwork, expressive black ink',
    promptHint: 'sumi-e ink brush, black ink wash, Japanese calligraphy style',
    gradient: 'linear-gradient(135deg,#1e293b,#64748b)',
  },
  {
    id: 'gouache',
    name: 'Gouache',
    tag: 'New',
    tagColor: 'new',
    category: 'Artistic',
    description: 'Matte opaque color, flat editorial illustration',
    promptHint: 'gouache illustration, opaque flat color, editorial poster art',
    gradient: 'linear-gradient(135deg,#f59e0b,#ec4899)',
  },
  {
    id: 'risograph',
    name: 'Risograph',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Artistic',
    description: 'Mis-registration halftone dots, duotone ink layers',
    promptHint: 'risograph print, halftone dots, misregistration, duotone',
    gradient: 'linear-gradient(135deg,#fbbf24,#f43f5e)',
  },
  {
    id: 'collage',
    name: 'Mixed-media Collage',
    tag: 'New',
    tagColor: 'new',
    category: 'Artistic',
    description: 'Torn paper, magazine cutouts, layered textures',
    promptHint: 'collage art, torn magazine paper, layered ephemera, mixed media',
    gradient: 'linear-gradient(135deg,#fde68a,#a7f3d0,#c7d2fe)',
  },
  {
    id: 'scrapbook-cutout-motion',
    name: 'Hybrid Mixed-Media Animation',
    tag: 'Hot',
    tagColor: 'hot',
    category: 'Artistic',
    description: 'Visible cel lines, cut paper, clay/fabric/cardboard texture, ink doodles, stickers, tape',
    promptHint: 'cohesive mixed media animation with all media layers clearly visible, real-world photography base blended with bold 2D cel animation outlines, paper cutout collage layers, tactile 3D clay texture accents, woven fabric grain patches, corrugated cardboard edge texture, hand-drawn black ink marks, marker doodles, scribbled arrows and circles, visible sticker labels, torn masking tape strips, scanned paper grain, layered poster paper, subtle drop shadows between media layers, stop-motion jitter, frame-by-frame handmade animation energy, dynamic editorial composition, preserve source subject identity, pose, and camera angle while transforming materials into a unified hybrid animation style',
    gradient: 'linear-gradient(135deg,#fef08a,#f97316,#22c55e,#38bdf8,#a78bfa)',
  },
  {
    id: 'canvas',
    name: 'Canvas',
    tag: 'Classic',
    tagColor: 'moody',
    category: 'Artistic',
    description: 'Rough canvas weave with acrylic texture',
    promptHint: 'acrylic on canvas, visible brush texture, painterly',
    gradient: 'linear-gradient(135deg,#c2410c,#92400e)',
  },
  {
    id: 'storybook',
    name: 'Storybook',
    tag: 'Soft',
    tagColor: 'soft',
    category: 'Artistic',
    description: "Vintage children's book illustration, warm pastels",
    promptHint: 'vintage storybook illustration, pastel palette, nostalgic warmth',
    gradient: 'linear-gradient(135deg,#fde68a,#fbcfe8)',
  },
  {
    id: 'cutout-collage-animation',
    name: 'Cutout Collage',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Artistic',
    description: 'Terry Gilliam-style paper cutouts — magazine photos, bold type, stop-motion jitter, 16mm grain',
    promptHint: 'Terry Gilliam Monty Python paper cutout animation, vintage magazine photograph collage, flat layered paper planes, bold hand-lettered typography overlay, stop-motion jitter, 16mm film grain, newsprint texture, Victorian anachronistic mashup, surreal editorial collage, hard drop shadows between paper layers, visible cut edges',
    gradient: 'linear-gradient(135deg,#f5e6c8,#c8956a,#6b3a1f)',
  },
  // ── Cinematic ─────────────────────────────────────────────────
  {
    id: 'noir',
    name: 'Noir Cinematic',
    tag: 'Moody',
    tagColor: 'moody',
    category: 'Cinematic',
    description: 'High-contrast shadows, rain-slick streets, monochrome',
    promptHint: 'film noir, high contrast black and white, shadows, rain, cinematic',
    gradient: 'linear-gradient(135deg,#1e293b,#0f172a)',
  },
  {
    id: 'neon-city',
    name: 'Neon City',
    tag: 'Hot',
    tagColor: 'hot',
    category: 'Cinematic',
    description: 'Wet neon reflections on dark urban surfaces',
    promptHint: 'neon city, wet pavement reflections, cyberpunk lighting, rain',
    gradient: 'linear-gradient(135deg,#06b6d4,#a855f7)',
  },
  {
    id: 'dragon-fantasy',
    name: 'Dragon Fantasy',
    tag: 'Bold',
    tagColor: 'bold',
    category: 'Cinematic',
    description: 'Epic fantasy painterly light, dramatic scale',
    promptHint: 'epic fantasy, dramatic god rays, painterly cinematic, myth and legend',
    gradient: 'linear-gradient(135deg,#dc2626,#7c3aed)',
  },
  {
    id: 'night-vision',
    name: 'Night Vision',
    tag: 'Dark',
    tagColor: 'dark',
    category: 'Cinematic',
    description: 'Military NVGS green phosphor grain overlay',
    promptHint: 'night vision goggles, thermal green, grainy surveillance footage',
    gradient: 'linear-gradient(135deg,#14532d,#052e16)',
  },
  {
    id: 'office-cctv',
    name: 'CCTV',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Cinematic',
    description: 'Security camera timestamp, low-res scan lines',
    promptHint: 'CCTV security footage, timestamp overlay, scan lines, washed color',
    gradient: 'linear-gradient(135deg,#374151,#1f2937)',
  },
  // ── Retro & Vintage ───────────────────────────────────────────
  {
    id: 'vhs',
    name: 'VHS / Lo-fi',
    tag: 'Retro',
    tagColor: 'retro',
    category: 'Retro & Vintage',
    description: 'Tape static, chroma bleed, magnetic tracking lines',
    promptHint: 'VHS tape, chroma aberration, magnetic noise, 80s home video',
    gradient: 'linear-gradient(135deg,#7c3aed,#0e7490)',
  },
  {
    id: '60s-cafe',
    name: '60s Café',
    tag: 'Retro',
    tagColor: 'retro',
    category: 'Retro & Vintage',
    description: 'Mid-century illustration, espresso-warm grain',
    promptHint: '1960s retro illustration, warm mid-century palette, coffee shop poster',
    gradient: 'linear-gradient(135deg,#92400e,#d97706)',
  },
  {
    id: 'japanese-show',
    name: 'Japanese TV',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Retro & Vintage',
    description: '90s–2000s Japanese TV, bold type, noisy transitions',
    promptHint: '90s japanese television aesthetic, bold typography, noisy color, variety show',
    gradient: 'linear-gradient(135deg,#e11d48,#f59e0b)',
  },
  {
    id: 'pixel',
    name: 'Pixel Art',
    tag: 'Retro',
    tagColor: 'retro',
    category: 'Retro & Vintage',
    description: '16-bit sprite aesthetics, limited dithered palette',
    promptHint: 'pixel art, 16-bit sprites, limited color palette, dithering',
    gradient: 'linear-gradient(135deg,#6d28d9,#2563eb)',
  },
  {
    id: 'burnout-sunset',
    name: 'Burning Sunset',
    tag: 'Hot',
    tagColor: 'hot',
    category: 'Retro & Vintage',
    description: 'Golden hour haze, overexposed warm burn',
    promptHint: 'golden hour, lens flare, overexposed warm orange, hazy sunset',
    gradient: 'linear-gradient(135deg,#f97316,#dc2626)',
  },
  // ── Street & Urban ────────────────────────────────────────────
  {
    id: 'grime',
    name: 'Grime',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Street & Urban',
    description: 'Street-art texture, xerox grain, urban energy',
    promptHint: 'grime street art, xerox texture, urban grainy, raw concrete',
    gradient: 'linear-gradient(135deg,#78716c,#292524)',
  },
  {
    id: 'paparazzi',
    name: 'Paparazzi',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Street & Urban',
    description: 'Candid flash photography, tabloid grain',
    promptHint: 'candid paparazzi photo, flash photography, tabloid grain, street celebrity',
    gradient: 'linear-gradient(135deg,#f8fafc,#94a3b8)',
  },
  // ── Surreal & Abstract ────────────────────────────────────────
  {
    id: 'multiverse',
    name: 'Multiverse',
    tag: 'Surreal',
    tagColor: 'surreal',
    category: 'Surreal & Abstract',
    description: 'Dimensional rifts, infinite mirror recursion',
    promptHint: 'multiverse portal, dimensional rift, infinite recursion, surreal space',
    gradient: 'linear-gradient(135deg,#7c3aed,#0891b2,#7c3aed)',
  },
  {
    id: 'layer-mixed',
    name: 'Soul Layer',
    tag: 'New',
    tagColor: 'new',
    category: 'Surreal & Abstract',
    description: 'Layers of photo, paint, text, and texture — chaotic collage',
    promptHint: 'mixed media soul layers, photo collage with paint and text, chaotic elegance',
    gradient: 'linear-gradient(135deg,#c084fc,#fb7185,#34d399)',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    tag: 'Surreal',
    tagColor: 'surreal',
    category: 'Surreal & Abstract',
    description: 'RGB data corruption, scan-line displacement artifacts',
    promptHint: 'digital glitch, RGB channel split, data corruption, scan displacement',
    gradient: 'linear-gradient(135deg,#22d3ee,#ec4899,#a3e635)',
  },
  {
    id: 'cloud-surf',
    name: 'Cloud Surf',
    tag: 'Dreamy',
    tagColor: 'dreamy',
    category: 'Surreal & Abstract',
    description: 'Volumetric clouds, dreamscape atmosphere',
    promptHint: 'volumetric clouds, pastel dreamscape, floaty surreal, heaven-like',
    gradient: 'linear-gradient(135deg,#e0f2fe,#a5f3fc,#bfdbfe)',
  },
  // ── Graphic ───────────────────────────────────────────────────
  {
    id: 'sketch-to-real',
    name: 'Sketch → Real',
    tag: 'New',
    tagColor: 'new',
    category: 'Graphic',
    description: 'Pencil sketch transforming into photo-real footage',
    promptHint: 'sketch morphing into photorealistic, drawing to real life transition',
    gradient: 'linear-gradient(135deg,#d1d5db,#374151)',
  },
  {
    id: 'sticker',
    name: 'Sticker Sheet',
    tag: 'Trending',
    tagColor: 'trending',
    category: 'Graphic',
    description: 'Kawaii glitter stickers, die-cut white border',
    promptHint: 'kawaii sticker sheet, glitter, die-cut white outline, pastel',
    gradient: 'linear-gradient(135deg,#f9a8d4,#a78bfa)',
  },
];

export const CATEGORIES: Category[] = [
  'Artistic',
  'Cinematic',
  'Retro & Vintage',
  'Street & Urban',
  'Surreal & Abstract',
  'Graphic',
];

/** Look up a style by id, returns undefined if not found */
export function findStyle(id: string): Style | undefined {
  return STYLES.find(s => s.id === id);
}

/** Resolve a prompt string from a style id — safe to call on the server */
export function resolvePrompt(styleId: string, override?: string): string {
  if (override) return override;
  return findStyle(styleId)?.promptHint ?? styleId;
}
