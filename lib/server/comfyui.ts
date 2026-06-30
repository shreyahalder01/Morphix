import fs from 'fs';
import path from 'path';

const BASE_URL = (process.env.COMFYUI_BASE_URL ?? 'http://127.0.0.1:8188').replace(/\/$/, '');
const CHECKPOINT = process.env.COMFYUI_CHECKPOINT ?? 'sdxl.safetensors';
const CLIENT_ID = process.env.COMFYUI_CLIENT_ID ?? 'morphix-next';

interface StylePrompt {
  positive: string;
  negative: string;
  denoise: number;
  steps?: number;
  cfg?: number;
  sampler?: string;
  scheduler?: string;
}

interface ResultImageInfo {
  filename: string;
  subfolder?: string;
  type?: string;
}

const COMMON_POSITIVE =
  'single frame from a mixed-media animation, preserve source composition, pose, character identity, camera angle, clean silhouettes, temporally consistent details';

const COMMON_NEGATIVE =
  'raw unstyled video frame, flicker, inconsistent character design, warped anatomy, duplicate limbs, blurry, low quality, text, watermark, logo, frame border';

export const STYLE_PROMPTS: Record<string, StylePrompt> = {
  // ── Artistic ─────────────────────────────────────────────────
  anime: {
    positive: 'anime animation, bold cel shading, vibrant color keys, clean sharp line art, expressive shapes, hand-painted background',
    negative: 'photorealistic, 3d render, blurry, washed out, muddy lines',
    denoise: 0.72, cfg: 7.2,
  },
  ghibli: {
    positive: 'studio ghibli style, warm hand-drawn fantasy, lush painted nature backgrounds, magical realism, soft colors, gentle expressive characters',
    negative: 'dark gritty photorealism, 3d render, harsh neon, sterile studio photo, sharp digital',
    denoise: 0.70, cfg: 7.0,
  },
  watercolor: {
    positive: 'watercolor animation, soft washes, wet-on-wet pigment blooms, translucent layers, delicate paper texture, pastel rhythm',
    negative: 'sharp plastic edges, photorealistic, harsh digital render, oversaturated, flat vector',
    denoise: 0.70, cfg: 7.0,
  },
  'oil-painting': {
    positive: 'oil painting, thick impasto brushwork, rich chiaroscuro, museum quality, visible canvas texture, glazed depth',
    negative: 'flat digital, watercolor, thin lines, photorealistic photo, low quality',
    denoise: 0.74, cfg: 7.4,
  },
  sketch: {
    positive: 'hand-drawn pencil sketch, black and white line art, detailed cross-hatching, expressive construction lines, animated storyboard',
    negative: 'photorealistic, saturated color, glossy digital painting, filled color blocks',
    denoise: 0.68, cfg: 7.0,
  },
  ink: {
    positive: 'sumi-e ink brush, black ink wash, East Asian calligraphy style, expressive brushwork, minimal negative space',
    negative: 'color photography, flat digital, watercolor wash, pastel, low contrast',
    denoise: 0.66, cfg: 7.5,
  },
  gouache: {
    positive: 'gouache illustration, opaque flat matte color, editorial poster art, crisp edges, designer palette',
    negative: 'transparent watercolor, photorealistic, blurry, gradient noise, 3d render',
    denoise: 0.68, cfg: 7.2,
  },
  risograph: {
    positive: 'risograph print, halftone dots, misregistration, duotone ink layers, tactile paper, limited palette',
    negative: 'seamless digital, photorealistic, full-color photo, glossy, smooth',
    denoise: 0.70, cfg: 7.4,
  },
  claymation: {
    positive: 'claymation stop-motion, clay material, plasticine fingerprints, chunky handcrafted surfaces, warm miniature set lighting',
    negative: 'photorealistic, sharp digital render, flat 2d only, CG animation',
    denoise: 0.74, cfg: 7.2,
  },
  collage: {
    positive: 'mixed-media collage, torn magazine paper, layered ephemera, pop-art composition, tactile handmade depth',
    negative: 'photorealistic, seamless, uniform background, plain monotone',
    denoise: 0.76, cfg: 7.5,
  },
  'scrapbook-cutout-motion': {
    positive: [
      'cohesive mixed media animation',
      'all requested media layers must be visibly present in the frame',
      'real-world photography base transformed into a hybrid animated frame',
      '2D cel animation linework over live-action forms, clean graphic outlines and selective color fills',
      'paper cutout collage layers, torn poster paper, magazine fragments, tape, stickers, and zine textures',
      'visible tactile 3D material accents, clay texture patches, woven fabric grain, corrugated cardboard edges, small sculptural props',
      'hand-drawn ink marks, marker doodles, scribble accents, arrows, circles, and rough underline marks',
      'stickers and torn masking tape must appear as physical collage elements attached to the composition',
      'scanned paper grain, glue shadows, imperfect white borders, rough scissor edges',
      'layered depth with subtle drop shadows between photography, cut paper, cel lines, and 3D texture',
      'stop-motion jitter and frame-by-frame handmade animation energy',
      'dynamic editorial composition, visually unified mixed-media prompt-generator style',
      'preserve source subject identity, pose, camera angle, and readable silhouette',
    ].join(', '),
    negative: [
      'single medium only, pure photorealism, pure anime, pure 3D render, pure watercolor, pure oil painting',
      'smooth CGI with no handmade texture, seamless digital compositing, glossy plastic, no tape, no stickers, no doodles, no fabric texture, no cardboard texture',
      'flat vector UI, minimal corporate presentation style, plain poster design',
      'vintage sepia-only Victorian collage, monochrome old newspaper only',
      'messy unreadable face, warped anatomy, excessive typography over subject',
    ].join(', '),
    denoise: 0.79,
    cfg: 7.8,
    steps: 28,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
  },
  canvas: {
    positive: 'acrylic on canvas, visible rough canvas weave, painterly brush texture, warm tones, museum quality',
    negative: 'flat digital, watercolor, thin sketch, plastic surfaces, photo',
    denoise: 0.72, cfg: 7.0,
  },
  storybook: {
    positive: 'vintage storybook illustration, pastel palette, nostalgic warmth, soft ink outlines, Caldecott style',
    negative: 'dark gritty, photorealistic, harsh contrast, neon, sharp digital',
    denoise: 0.68, cfg: 6.8,
  },

  'cutout-collage-animation': {
    positive: [
      'Terry Gilliam Monty Python animated collage style',
      'vintage magazine photograph cutouts arranged as flat layered paper planes',
      'Victorian anatomical diagrams mixed with 1960s pop culture imagery',
      'surrealist editorial collage with anachronistic mashup of historical and modern imagery',
      'bold hand-lettered title typography cut from newspaper headlines',
      'stop-motion jitter aesthetic with visible misalignment between paper elements',
      '16mm film grain overlay, off-white aged newsprint background texture',
      'flat poster-paint accent color fills, hard drop shadows cast between paper layers',
      'visible torn and scissor-cut paper edges, rough white borders around cutout figures',
      'mixed scale — tiny figures next to giant objects, impossible juxtapositions',
      'single frame from a mixed-media paper cutout animation',
      'temporally consistent paper plane positions, preserve character cutout identity',
    ].join(', '),
    negative: [
      'photorealistic 3D render, smooth CGI animation, seamless digital blend',
      'full digital painting, watercolor wash, oil paint texture, smooth brushwork',
      'clean modern minimal UI design, flat vector iconography',
      'dark cinematic atmosphere, volumetric fog, atmospheric perspective',
      'anime cel shading, cartoon outlines, comic book halftone',
      'color photography with no post-processing, realistic skin texture',
      'contemporary digital collage, clean Photoshop compositing',
    ].join(', '),
    denoise: 0.78,
    cfg: 7.8,
    steps: 28,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
  },

  // ── Cinematic ─────────────────────────────────────────────────
  noir: {
    positive: 'film noir, high contrast black and white, dramatic directional shadows, rain-slick streets, detective cinema mood, inked light shapes',
    negative: 'bright cheerful colors, soft pastel, low contrast, flat lighting, color',
    denoise: 0.64, cfg: 7.5,
  },
  giallo: {
    positive: 'giallo horror, deep saturated blood-orange tones, dramatic lighting, 70s Italian cinema, expressionist color',
    negative: 'desaturated, flat lighting, modern clean digital, black and white',
    denoise: 0.70, cfg: 7.4,
  },
  'neon-city': {
    positive: 'neon city, wet pavement reflections, cyberpunk rain lighting, electric signage, dark urban scene',
    negative: 'natural daylight, pastoral, warm plain interior, dull colors, flat lighting',
    denoise: 0.72, cfg: 7.2,
  },
  cyberpunk: {
    positive: 'cyberpunk, neon-lit megacity, chrome and circuitry, dystopian future, electric magenta and cyan glow',
    negative: 'natural daylight, warm analog, hand-drawn, clean minimal, pastel',
    denoise: 0.72, cfg: 7.5,
  },
  'dragon-fantasy': {
    positive: 'epic fantasy, dramatic god rays, painterly cinematic, myth and legend, heroic scale, volumetric light',
    negative: 'mundane setting, flat lighting, pastel, kawaii, slice of life',
    denoise: 0.70, cfg: 7.2,
  },
  'night-vision': {
    positive: 'night vision goggles, thermal green phosphor, grainy surveillance footage, NVGS grain overlay',
    negative: 'color daylight, warm interior, clean sharp image, no grain',
    denoise: 0.62, cfg: 7.0,
  },
  'office-cctv': {
    positive: 'CCTV security footage, timestamp overlay, scan lines, washed color, low resolution surveillance',
    negative: 'high resolution, sharp crisp detail, warm color grading, cinematic',
    denoise: 0.60, cfg: 6.8,
  },
  'red-carpet': {
    positive: 'red carpet fashion editorial, paparazzi flash photography, luxury glamour, high contrast magazine',
    negative: 'dark moody, rough street, low quality, blurry, candid snapshot',
    denoise: 0.64, cfg: 7.0,
  },

  // ── Retro & Vintage ───────────────────────────────────────────
  vhs: {
    positive: 'VHS tape, chroma aberration, magnetic noise, 80s home video, scan line distortion, retro consumer footage',
    negative: 'sharp modern HD, sterile digital render, no grain, clean 4K',
    denoise: 0.70, cfg: 7.3,
  },
  '60s-cafe': {
    positive: '1960s retro illustration, warm mid-century palette, coffee shop poster, Saul Bass influence',
    negative: 'modern digital, cold color, flat vector only, sharp photo',
    denoise: 0.68, cfg: 7.0,
  },
  'japanese-show': {
    positive: '90s Japanese television aesthetic, bold typography, noisy color, variety show energy, saturated',
    negative: 'minimal, cool modern, dark noir, black and white, desaturated',
    denoise: 0.68, cfg: 7.2,
  },
  pixel: {
    positive: 'pixel art, 16-bit sprites, limited color palette, dithering, retro game aesthetic',
    negative: 'smooth gradients, photorealistic, anti-aliased, modern 3d, blurry',
    denoise: 0.66, cfg: 7.5,
  },
  'two-color': {
    positive: 'duotone silkscreen, two color poster print, bold graphic, risograph-adjacent, punchy ink',
    negative: 'full color spectrum, subtle tones, photorealistic, smooth gradient',
    denoise: 0.72, cfg: 7.6,
  },
  'burnout-sunset': {
    positive: 'golden hour, lens flare, overexposed warm orange haze, dreamy sunset glow',
    negative: 'cold blue, night scene, studio lighting, flat neutral, gray',
    denoise: 0.64, cfg: 6.8,
  },

  // ── Street & Urban ─────────────────────────────────────────
  grime: {
    positive: 'grime street art, xerox texture, urban grainy, raw concrete, underground energy',
    negative: 'clean studio, smooth digital, soft pastel, refined luxury, nature',
    denoise: 0.70, cfg: 7.3,
  },
  graffiti: {
    positive: 'graffiti wildstyle, spray paint drips, tag letters, wall art, urban mural energy',
    negative: 'clean studio, watercolor, nature, subtle pastel, photorealistic',
    denoise: 0.74, cfg: 7.5,
  },
  neon: {
    positive: 'neon sign glow, glass tube electric hum, dark brick background, bent neon tubing',
    negative: 'natural daylight, warm analog, flat vector, no glow, subtle lighting',
    denoise: 0.70, cfg: 7.4,
  },
  paparazzi: {
    positive: 'candid paparazzi photo, flash photography, tabloid grain, street celebrity shot',
    negative: 'studio controlled, clean portrait, smooth skin, dark moody',
    denoise: 0.60, cfg: 6.8,
  },

  // ── Surreal & Abstract ─────────────────────────────────────
  particles: {
    positive: 'luminous particles, data visualization, constellation motion, light trails, kinetic energy',
    negative: 'dark flat, realistic photo, no glow, low energy, static',
    denoise: 0.72, cfg: 7.2,
  },
  multiverse: {
    positive: 'multiverse portal, dimensional rift, infinite recursion, surreal space, cosmic energy',
    negative: 'mundane everyday, realistic, flat lighting, single dimension, boring',
    denoise: 0.78, cfg: 7.6,
  },
  'layer-mixed': {
    positive: 'mixed media soul layers, photo collage with paint and text overlay, chaotic elegance, deep texture',
    negative: 'clean minimal, photorealistic portrait, simple flat, single medium',
    denoise: 0.76, cfg: 7.5,
  },
  glitch: {
    positive: 'digital glitch art, RGB channel split, data corruption, scan displacement, chromatic aberration',
    negative: 'clean smooth digital, photorealistic, no artifacts, stable image',
    denoise: 0.74, cfg: 7.4,
  },
  'doodle-melt': {
    positive: 'hand-drawn doodle melting into live action, cartoon physics, surreal animated blend',
    negative: 'photorealistic, fully abstract, no recognizable subject, clean digital',
    denoise: 0.72, cfg: 7.2,
  },
  'cloud-surf': {
    positive: 'volumetric clouds, pastel dreamscape, floaty surreal, heaven-like atmosphere, soft billowing',
    negative: 'dark storm, gritty urban, sharp hard edges, dark moody, noir',
    denoise: 0.68, cfg: 6.8,
  },

  // ── Graphic ────────────────────────────────────────────────
  comic: {
    positive: 'comic book panel, ben-day dots, bold ink outlines, action lines, speech bubble panel',
    negative: 'photorealistic, watercolor wash, painted texture, realistic skin, soft edges',
    denoise: 0.72, cfg: 7.5,
  },
  'sketch-to-real': {
    positive: 'pencil sketch morphing into photorealistic detail, drawing-to-real transition aesthetic',
    negative: 'fully digital, flat vector, no pencil marks, cartoon cel shaded',
    denoise: 0.68, cfg: 7.0,
  },
  sticker: {
    positive: 'kawaii sticker sheet, glitter, die-cut white outline, pastel, cute character design',
    negative: 'dark gritty, photorealistic, raw sketch, noir, no outline',
    denoise: 0.70, cfg: 7.0,
  },
  'this-is-fine': {
    positive: 'flat web comic meme art, simple outlines, internet humor aesthetic, editorial cartoon',
    negative: 'photorealistic, complex rendering, 3D, detailed texture',
    denoise: 0.68, cfg: 7.2,
  },
  'motion-design': {
    positive: 'motion design, geometric vector shapes, kinetic typography, clean animation, brand design',
    negative: 'photorealistic, rough texture, organic, painted, hand-drawn sketch',
    denoise: 0.64, cfg: 7.0,
  },

  // ── Legacy keys kept for backward compat ───────────────────
  'vintage-stop-motion-neon-2d': {
    positive: 'vintage stop-motion mixed-media animation, clay and paper surface texture, neon 2D cel outlines, handcrafted props',
    negative: 'photorealistic, glossy plastic, flat digital render, sterile studio lighting',
    denoise: 0.66, cfg: 7.2,
  },
  'live-action-comic-halftone': {
    positive: 'live action transformed into comic book halftone, bold ink contours, screen-printed dot shadows, pop art color blocking',
    negative: 'soft watercolor, plain photo, muddy colors, weak outlines',
    denoise: 0.62, cfg: 7.5,
  },
  'watercolor-cutout': {
    positive: 'watercolor wash mixed with cut-out paper collage, soft pigment blooms, layered paper edges, handmade shadows',
    negative: 'hard 3d render, neon cyberpunk, harsh ink, over-sharpened',
    denoise: 0.68, cfg: 7.0,
  },
  'paper-collage-ink': {
    positive: 'paper collage with digital ink, torn magazine textures, layered handmade paper, crisp black ink accents',
    negative: 'photorealistic, seamless airbrushed render, flat vector only',
    denoise: 0.70, cfg: 7.4,
  },
  'glossy-3d-rotoscope': {
    positive: 'glossy stylized 3D mixed with rotoscope, preserved body motion, sculpted depth, clean contour tracing',
    negative: 'flat sketch only, messy linework, clay texture, paper collage',
    denoise: 0.58, cfg: 6.8,
  },
  'vhs-neon-sketch': {
    positive: 'VHS neon sketch, analog tape texture, electric hand-drawn outlines, chromatic glow, scanline grain',
    negative: 'clean modern HD, plain photo, watercolor wash, muted palette',
    denoise: 0.64, cfg: 7.3,
  },
};

const STYLE_ALIASES: Record<string, string> = {
  'vintage stop motion neon 2d': 'vintage-stop-motion-neon-2d',
  'vintage stop-motion neon 2d': 'vintage-stop-motion-neon-2d',
  'stop motion neon': 'vintage-stop-motion-neon-2d',
  'live action comic halftone': 'live-action-comic-halftone',
  'comic halftone': 'live-action-comic-halftone',
  'watercolor cutout': 'watercolor-cutout',
  'watercolor cut-out': 'watercolor-cutout',
  'paper collage ink': 'paper-collage-ink',
  'scrapbook cutout motion': 'scrapbook-cutout-motion',
  'scrapbook cut-out motion': 'scrapbook-cutout-motion',
  'mixed media scrapbook': 'scrapbook-cutout-motion',
  'glossy 3d rotoscope': 'glossy-3d-rotoscope',
  'vhs neon sketch': 'vhs-neon-sketch',
};

function configuredApiKey() {
  return process.env.COMFYUI_API_KEY?.trim() || process.env.AI_STYLE_API_KEY?.trim() || '';
}

function authHeaders(extra: Record<string, string> = {}) {
  const apiKey = configuredApiKey();
  if (!apiKey) return extra;

  const headerName = process.env.COMFYUI_API_KEY_HEADER?.trim() || 'Authorization';
  const configuredPrefix = process.env.COMFYUI_API_KEY_PREFIX;
  const defaultPrefix = headerName.toLowerCase() === 'authorization' ? 'Bearer' : '';
  const prefix = configuredPrefix ?? defaultPrefix;
  const headerValue =
    prefix && !apiKey.toLowerCase().startsWith(`${prefix.toLowerCase()} `)
      ? `${prefix} ${apiKey}`
      : apiKey;

  return { ...extra, [headerName]: headerValue };
}

function normalizeStyleKey(style: string) {
  const key = style.trim().toLowerCase();
  if (STYLE_PROMPTS[key]) return key;
  if (STYLE_ALIASES[key]) return STYLE_ALIASES[key];
  const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return STYLE_PROMPTS[slug] ? slug : 'anime';
}

function resolveStylePrompt(style: string, promptOverride?: string, strength?: number) {
  const styleKey = normalizeStyleKey(style);
  const styleConfig = STYLE_PROMPTS[styleKey];
  const userPrompt = promptOverride?.trim();

  return {
    ...styleConfig,
    styleKey,
    // If caller passes strength, override the stored denoise value
    denoise: strength !== undefined ? Math.max(0, Math.min(1, strength)) : styleConfig.denoise,
    positive: [styleConfig.positive, COMMON_POSITIVE, userPrompt].filter(Boolean).join(', '),
    negative: [styleConfig.negative, COMMON_NEGATIVE].filter(Boolean).join(', '),
  };
}

export function getComfyUIConfig() {
  return {
    baseUrl: BASE_URL,
    checkpoint: CHECKPOINT,
    provider: process.env.MORPHIX_PROVIDER ?? process.env.AI_PROVIDER ?? 'mock',
    apiKeyConfigured: Boolean(configuredApiKey()),
    apiKeyHeader: configuredApiKey()
      ? process.env.COMFYUI_API_KEY_HEADER?.trim() || 'Authorization'
      : undefined,
  };
}

export async function pingComfyUI(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/system_stats`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildImg2ImgWorkflow(
  uploadedFilename: string,
  style: string,
  prompt?: string,
  strength?: number,
): Record<string, unknown> {
  const styleConfig = resolveStylePrompt(style, prompt, strength);

  return {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CHECKPOINT } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: styleConfig.positive, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: styleConfig.negative, clip: ['1', 1] } },
    '4': { class_type: 'LoadImage', inputs: { image: uploadedFilename } },
    '5': { class_type: 'VAEEncode', inputs: { pixels: ['4', 0], vae: ['1', 2] } },
    '6': {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 1e12),
        steps: styleConfig.steps ?? Number(process.env.COMFYUI_STEPS ?? 22),
        cfg: styleConfig.cfg ?? Number(process.env.COMFYUI_CFG ?? 7),
        sampler_name: styleConfig.sampler ?? process.env.COMFYUI_SAMPLER ?? 'dpmpp_2m',
        scheduler: styleConfig.scheduler ?? process.env.COMFYUI_SCHEDULER ?? 'karras',
        denoise: styleConfig.denoise,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['5', 0],
      },
    },
    '7': { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    '8': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: `morphix/${styleConfig.styleKey}`,
        images: ['7', 0],
      },
    },
  };
}

async function uploadFrame(framePath: string): Promise<string> {
  const form = new FormData();
  const imageBytes = new Uint8Array(await fs.promises.readFile(framePath));
  form.append('image', new Blob([imageBytes], { type: 'image/png' }), path.basename(framePath));

  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) throw new Error(`ComfyUI upload failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { name: string; subfolder?: string };
  return json.subfolder ? `${json.subfolder}/${json.name}` : json.name;
}

async function queuePrompt(workflow: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE_URL}/prompt`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });

  if (!res.ok) throw new Error(`ComfyUI queue failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { prompt_id: string };
  return json.prompt_id;
}

async function waitForResult(promptId: string, timeoutMs = 180_000): Promise<ResultImageInfo> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const res = await fetch(`${BASE_URL}/history/${promptId}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) continue;

    const history = (await res.json()) as Record<
      string,
      {
        status?: { status_str?: string };
        outputs?: Record<string, { images?: ResultImageInfo[] }>;
      }
    >;

    const entry = history[promptId];
    if (!entry) continue;
    if (entry.status?.status_str === 'error') throw new Error('ComfyUI returned error status');

    const images = Object.values(entry.outputs ?? {}).flatMap(
      (nodeOutput) => nodeOutput.images ?? [],
    );
    const outputImage = images.find((image) => image.type === 'output') ?? images[0];
    if (outputImage) return outputImage;
  }

  throw new Error(`ComfyUI timed out after ${timeoutMs}ms`);
}

async function downloadResult(image: ResultImageInfo): Promise<Buffer> {
  const params = new URLSearchParams({
    filename: image.filename,
    type: image.type ?? 'output',
  });
  if (image.subfolder) params.set('subfolder', image.subfolder);

  const res = await fetch(`${BASE_URL}/view?${params.toString()}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`ComfyUI download failed: ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function stylizeFrame(
  framePath: string,
  style: string,
  prompt?: string,
  strength?: number,
): Promise<Buffer> {
  const uploadedFilename = await uploadFrame(framePath);
  const workflow = buildImg2ImgWorkflow(uploadedFilename, style, prompt, strength);
  const promptId = await queuePrompt(workflow);
  const image = await waitForResult(promptId);
  return downloadResult(image);
}

export default {
  getComfyUIConfig,
  pingComfyUI,
  stylizeFrame,
  STYLE_PROMPTS,
};
