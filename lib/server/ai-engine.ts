import type { StyleId } from '@/types';
import { STYLES } from '@/lib/server/styles-data';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ffmpegBinary } from './ffmpeg';

const execFileAsync = promisify(execFile);

export interface AiProviderPayload {
  jobId: string;
  style: StyleId | string;
  prompt: string;
  fps: number;
  frameDir: string;
  outputDir: string;
  /** 0.0–1.0 strength — mirrors ComfyUI denoise. Higher = stronger style transformation */
  strength: number;
}

export function buildAiProviderPayload(
  jobId: string,
  style: string,
  fps: number,
  frameDir: string,
  outputDir: string,
  promptOverride?: string,
  strength = 0.82,
): AiProviderPayload {
  const styleData = STYLES.find((s) => s.id === style);
  const prompt = promptOverride ?? styleData?.promptHint ?? style;

  return { jobId, style, prompt, fps, frameDir, outputDir, strength };
}

/**
 * Returns an FFmpeg filter string that visually represents a given style ID.
 * The `strength` param (0–1) is blended into filter intensity so the mock
 * output changes noticeably when the user moves the strength slider.
 */
function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededChoice<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function mixedMediaOverlayFilters(seedText: string, strength: number): string[] {
  const seed = hashSeed(seedText);
  const s = Math.max(0, Math.min(1, strength));
  const alpha = (base: number, range: number) => (base + range * s).toFixed(2);
  const sticker = alpha(0.34, 0.34);
  const tape = alpha(0.38, 0.38);
  const texture = alpha(0.08, 0.16);
  const palettes = [
    { tape: '0xfef3c7', sticker: '0xf97316', stickerAlt: '0x22c55e', ink: '0x111827', texture: '0x92400e' },
    { tape: '0xdbeafe', sticker: '0x38bdf8', stickerAlt: '0xa78bfa', ink: '0x0f172a', texture: '0x1e3a8a' },
    { tape: '0xfce7f3', sticker: '0xec4899', stickerAlt: '0xfacc15', ink: '0x3b0764', texture: '0x7e22ce' },
    { tape: '0xf5e6c8', sticker: '0x84cc16', stickerAlt: '0xc2410c', ink: '0x292524', texture: '0x78350f' },
    { tape: '0xf8fafc', sticker: '0x94a3b8', stickerAlt: '0xef4444', ink: '0x020617', texture: '0x475569' },
  ];
  const palette = seededChoice(palettes, seed);
  const motif = seed % 4;
  const tapeY = [0.06, 0.14, 0.72, 0.82][motif];
  const stickerX = [0.68, 0.08, 0.72, 0.12][motif];
  const stickerY = [0.12, 0.18, 0.68, 0.66][motif];
  const secondX = [0.08, 0.76, 0.14, 0.74][motif];
  const secondY = [0.74, 0.70, 0.10, 0.16][motif];
  const gridSize = [14, 18, 22, 26][motif];
  const tapeWidth = [0.22, 0.30, 0.18, 0.26][motif];

  return [
    `drawbox=x=iw*${(0.04 + (seed % 9) * 0.015).toFixed(3)}:y=ih*${tapeY}:w=iw*${tapeWidth}:h=ih*0.035:color=${palette.tape}@${tape}:t=fill`,
    `drawbox=x=iw*${(0.58 + (seed % 5) * 0.035).toFixed(3)}:y=ih*${(0.05 + (seed % 7) * 0.025).toFixed(3)}:w=iw*0.18:h=ih*0.028:color=${palette.tape}@${alpha(0.26, 0.32)}:t=fill`,
    `drawbox=x=iw*${stickerX}:y=ih*${stickerY}:w=iw*0.18:h=ih*0.105:color=${palette.sticker}@${sticker}:t=fill`,
    `drawbox=x=iw*${stickerX + 0.025}:y=ih*${stickerY + 0.026}:w=iw*0.13:h=ih*0.012:color=${palette.ink}@${alpha(0.38, 0.28)}:t=fill`,
    `drawbox=x=iw*${secondX}:y=ih*${secondY}:w=iw*0.14:h=ih*0.12:color=${palette.stickerAlt}@${alpha(0.18, 0.24)}:t=fill`,
    `drawbox=x=iw*${secondX + 0.018}:y=ih*${secondY + 0.018}:w=iw*0.10:h=ih*0.08:color=${palette.texture}@${alpha(0.10, 0.18)}:t=3`,
    `drawgrid=width=${gridSize}:height=${gridSize}:thickness=1:color=${palette.texture}@${texture}`,
  ];
}

export function getMockFilter(style: string, category: string, strength: number, seedText: string): string {
  // Map 0–1 strength to useful multiplier ranges
  const s = Math.max(0, Math.min(1, strength));

  // Derived intensity helpers
  const sat   = (base: number, range: number) => (base + range * s).toFixed(2);
  const con   = (base: number, range: number) => (base + range * s).toFixed(2);
  const sharp = (base: number, range: number) => (base + range * s).toFixed(2);
  const noise = (base: number, range: number) => Math.round(base + range * s);

  switch (style) {
    // ── Artistic ───────────────────────────────────────────────
    case 'anime':
      // Vibrant cel-shade: high saturation + unsharp edge pop
      return `eq=saturation=${sat(1.2, 0.9)}:contrast=${con(1.1, 0.4)}:brightness=0.02,` +
             `unsharp=7:7:${sharp(0.8, 2.2)}:7:7:0`;

    case 'ghibli':
      // Warm painterly: soft blur + lifted warm glow
      return `boxblur=${Math.max(1, Math.round(s * 2))}:1,` +
             `eq=saturation=${sat(1.05, 0.4)}:contrast=${con(0.88, 0.2)}:brightness=${(0.04 + s * 0.06).toFixed(2)}`;

    case 'watercolor':
      // Soft washes: blur + desaturation pull + brightness
      return `boxblur=${Math.max(1, Math.round(1 + s * 3))}:${Math.max(1, Math.round(1 + s * 2))},` +
             `eq=saturation=${sat(0.9, 0.5)}:contrast=${con(0.85, 0.15)}:brightness=0.06`;

    case 'oil-painting':
      // Rich impasto: noise + strong contrast + warm tint
      return `noise=alls=${noise(8, 18)}:allf=t+u,` +
             `eq=saturation=${sat(1.1, 0.6)}:contrast=${con(1.15, 0.55)}:brightness=-0.03,` +
             `unsharp=5:5:${sharp(0.5, 1.5)}`;

    case 'sketch':
      // Pencil: desaturate → edge detect → overlay brightness
      return `format=gray,eq=contrast=${con(1.3, 0.8)}:brightness=${(0.04 + s * 0.10).toFixed(2)},` +
             `edgedetect=low=${(0.06 + s * 0.10).toFixed(2)}:high=${(0.20 + s * 0.20).toFixed(2)}`;

    case 'ink':
      // Sumi-e: strong edge + deep gray
      return `format=gray,eq=contrast=${con(1.5, 0.8)}:brightness=${(-0.05 + s * -0.05).toFixed(2)},` +
             `edgedetect=low=${(0.08 + s * 0.12).toFixed(2)}:high=${(0.24 + s * 0.28).toFixed(2)},` +
             `unsharp=9:9:${sharp(1.2, 2.4)}`;

    case 'gouache':
      // Flat opaque colour: posterize-like + high sat
      return `eq=saturation=${sat(1.3, 0.7)}:contrast=${con(1.25, 0.45)},` +
             `unsharp=3:3:${sharp(0.6, 1.2)},noise=alls=${noise(4, 8)}:allf=t`;

    case 'risograph':
      // Duotone halftone: strong contrast + hue shift + noise dots
      return `eq=saturation=${sat(1.4, 0.7)}:contrast=${con(1.4, 0.6)},` +
             `hue=h=${Math.round(s * 20)},noise=alls=${noise(14, 22)}:allf=t+u`;

    case 'claymation':
      // Clay surface: noise + soften + warm sat
      return `noise=alls=${noise(8, 16)}:allf=t+u,` +
             `boxblur=1:1,eq=saturation=${sat(1.1, 0.4)}:contrast=${con(1.1, 0.3)}:brightness=0.03`;

    case 'collage':
      // Mixed-media collage: high noise + contrast + hue variety
      return `eq=saturation=${sat(1.3, 0.8)}:contrast=${con(1.3, 0.6)},` +
             `noise=alls=${noise(16, 28)}:allf=t+u,unsharp=7:7:${sharp(1.2, 2.0)}`;

    case 'scrapbook-cutout-motion': {
      // Hybrid mixed-media animation: bright print color, scanned paper grain,
      // crisp cel/cutout edges, and a tiny frame-to-frame lurch for hand-made motion.
      const xShift = (s * 1.8).toFixed(2);
      const yShift = (s * 1.2).toFixed(2);

      return [
        `eq=saturation=${sat(1.4, 0.8)}:contrast=${con(1.22, 0.48)}:brightness=${(0.02 + s * 0.03).toFixed(2)}`,
        `hue=h=${Math.round(-6 + s * 14)}`,
        `noise=alls=${noise(20, 36)}:allf=t+u`,
        `unsharp=7:7:${sharp(1.6, 2.6)}:7:7:0`,
        ...mixedMediaOverlayFilters(seedText, s),
        `crop=iw-${Math.ceil(s * 4)}:ih-${Math.ceil(s * 4)}:${xShift}*mod(n\\,2):${yShift}*mod(n+1\\,2)`,
        `scale=iw+${Math.ceil(s * 4)}:ih+${Math.ceil(s * 4)}:flags=bicubic`,
      ].join(',');
    }

    case 'canvas':
      // Linen texture: noise overlay + warm contrast
      return `noise=alls=${noise(10, 16)}:allf=t,` +
             `eq=saturation=${sat(1.0, 0.35)}:contrast=${con(1.12, 0.3)}:brightness=-0.02`;

    case 'storybook':
      // Pastel storybook: lift shadows + low contrast + warm
      return `eq=saturation=${sat(0.85, 0.35)}:contrast=${con(0.82, 0.18)}:brightness=${(0.06 + s * 0.08).toFixed(2)},` +
             `boxblur=1:1`;

    case 'cutout-collage-animation': {
      // Terry Gilliam paper cutout look:
      //   1. Partially desaturate to age the footage
      //   2. Warm sepia channel curve (pull red up, green mid, blue down)
      //   3. Heavy film grain — key to the stop-motion handmade feel
      //   4. Hard unsharp — makes cut paper edges pop like real cutouts
      //   5. Slight contrast boost — flattens midtones like flat paper planes
      //
      // Strength (s) controls how far from real to "fully processed":
      //   low s  → subtle aged warmth with light grain
      //   high s → full newsprint, heavy grain, hard edges, sepia pop
      const desat  = (0.80 - s * 0.40).toFixed(2);   // 0.80 → 0.40 saturation
      const brt    = (0.02 + s * 0.04).toFixed(2);
      const grn    = noise(22, 44);                    // 22 → 66 noise level
      const shp    = sharp(0.8, 2.8);                 // 0.8 → 3.6 unsharp
      const cnt    = con(1.15, 0.55);                 // 1.15 → 1.70 contrast

      // Sepia-style channel curves scaled by strength:
      // r channel lifted slightly, b channel pulled down (warm yellowed paper)
      const rHi = (0.92 + s * 0.08).toFixed(2);   // 0.92–1.00
      const gHi = (0.88 + s * 0.04).toFixed(2);   // 0.88–0.92
      const bHi = (0.78 - s * 0.12).toFixed(2);   // 0.78–0.66

      return [
        `eq=saturation=${desat}:contrast=${cnt}:brightness=${brt}`,
        `curves=r='0 0.08 0.5 0.55 1 ${rHi}':g='0 0.04 0.5 0.50 1 ${gHi}':b='0 0 0.5 0.42 1 ${bHi}'`,
        `noise=alls=${grn}:allf=t+u`,
        `unsharp=5:5:${shp}:5:5:0`,
      ].join(',');
    }

    // ── Cinematic ─────────────────────────────────────────────
    case 'noir':
      return `format=gray,eq=contrast=${con(1.4, 0.7)}:brightness=${(-0.04 - s * 0.06).toFixed(2)},` +
             `vignette=angle=PI/4:mode=backward`;

    case 'giallo':
      // Deep saturated blood-orange
      return `eq=saturation=${sat(1.5, 0.8)}:contrast=${con(1.3, 0.5)},hue=h=${Math.round(10 + s * 15)},` +
             `noise=alls=${noise(6, 12)}:allf=t`;

    case 'neon-city':
      // Wet neon: high sat + cyan push + vignette
      return `eq=saturation=${sat(1.6, 0.9)}:contrast=${con(1.2, 0.4)},hue=h=${Math.round(s * -12)},` +
             `vignette=angle=PI/4`;

    case 'cyberpunk':
      // Electric magenta + strong sat + unsharp
      return `eq=saturation=${sat(1.7, 1.0)}:contrast=${con(1.25, 0.45)},` +
             `hue=h=${Math.round(15 + s * 10)},unsharp=5:5:${sharp(1.0, 1.8)}`;

    case 'dragon-fantasy':
      // Epic fantasy: dark vignette + deep contrast + warm
      return `eq=saturation=${sat(1.2, 0.6)}:contrast=${con(1.3, 0.5)}:brightness=-0.04,` +
             `vignette=angle=PI/4,hue=h=${Math.round(s * -8)}`;

    case 'night-vision':
      // Green phosphor
      return `format=gray,eq=contrast=${con(1.3, 0.5)}:brightness=${(0.02 + s * 0.08).toFixed(2)},` +
             `colorize=hue=120:saturation=${sat(0.55, 0.4)},noise=alls=${noise(10, 20)}:allf=t+u`;

    case 'office-cctv':
      // CCTV: desaturate + timestamp look + heavy noise
      return `format=gray,eq=contrast=${con(1.1, 0.4)}:brightness=-0.03,` +
             `noise=alls=${noise(14, 26)}:allf=t+u`;

    case 'red-carpet':
      // High-glamour: lift highlights + high contrast
      return `eq=saturation=${sat(1.15, 0.45)}:contrast=${con(1.2, 0.4)}:brightness=${(0.02 + s * 0.06).toFixed(2)},` +
             `unsharp=3:3:${sharp(0.4, 0.8)}`;

    // ── Retro & Vintage ───────────────────────────────────────
    case 'vhs':
      // VHS: hue drift + chroma noise + strong noise
      return `eq=saturation=${sat(1.2, 0.5)}:contrast=${con(1.1, 0.3)},` +
             `hue=h=${Math.round(6 + s * 12)},noise=alls=${noise(20, 32)}:allf=t+u`;

    case '60s-cafe':
      // Mid-century warm grain
      return `curves=vintage,eq=saturation=${sat(1.1, 0.4)}:brightness=${(0.02 + s * 0.06).toFixed(2)},` +
             `noise=alls=${noise(10, 18)}:allf=t`;

    case 'japanese-show':
      // 90s Japanese TV: high sat + noise + hue bleed
      return `eq=saturation=${sat(1.4, 0.7)}:contrast=${con(1.15, 0.35)},` +
             `hue=h=${Math.round(s * 14)},noise=alls=${noise(18, 30)}:allf=t+u`;

    case 'pixel':
      // Blocky pixel-art approximation that preserves frame dimensions for blending.
      {
        const factor = Math.max(2, Math.round(2 + s * 6)); // 2–8× block
        return `avgblur=sizeX=${factor}:sizeY=${factor}:planes=7,` +
               `eq=saturation=${sat(1.2, 0.5)}:contrast=${con(1.15, 0.3)},` +
               `unsharp=7:7:${sharp(1.2, 2.2)}:7:7:0`;
      }

    case 'two-color':
      // Duotone: high contrast + very high saturation + posterize
      return `eq=saturation=${sat(1.8, 1.2)}:contrast=${con(1.6, 0.8)},` +
             `unsharp=9:9:${sharp(1.5, 3.0)}`;

    case 'burnout-sunset':
      // Overexposed warm haze
      return `eq=saturation=${sat(1.3, 0.7)}:contrast=${con(1.0, 0.3)}:brightness=${(0.06 + s * 0.18).toFixed(2)},` +
             `hue=h=${Math.round(-8 - s * 10)}`;

    // ── Street & Urban ─────────────────────────────────────────
    case 'grime':
      // Xerox grain + low contrast + dirty
      return `format=gray,eq=contrast=${con(1.0, 0.5)}:brightness=-0.04,` +
             `noise=alls=${noise(18, 30)}:allf=t+u,unsharp=5:5:${sharp(0.6, 1.2)}`;

    case 'graffiti':
      // Wild-style: high sat + hard edges + warm
      return `eq=saturation=${sat(1.6, 1.0)}:contrast=${con(1.3, 0.6)},` +
             `unsharp=7:7:${sharp(1.2, 2.4)},hue=h=${Math.round(s * 10)}`;

    case 'neon':
      // Neon sign glow: cyan/pink hue + very high sat
      return `eq=saturation=${sat(1.8, 1.0)}:contrast=${con(1.2, 0.4)},` +
             `hue=h=${Math.round(-18 + s * 36)},unsharp=5:5:${sharp(0.8, 1.6)}`;

    case 'paparazzi':
      // Flash photography: overexposed highlights + grain
      return `eq=saturation=${sat(0.9, 0.3)}:contrast=${con(1.1, 0.4)}:brightness=${(0.04 + s * 0.14).toFixed(2)},` +
             `noise=alls=${noise(14, 22)}:allf=t`;

    // ── Surreal & Abstract ─────────────────────────────────────
    case 'particles':
      // Luminous: high brightness + strong contrast + sharp trails
      return `eq=saturation=${sat(1.3, 0.9)}:contrast=${con(1.2, 0.6)}:brightness=${(0.05 + s * 0.12).toFixed(2)},` +
             `unsharp=9:9:${sharp(1.4, 3.0)}`;

    case 'multiverse':
      // Dimensional: hue oscillation + blur layers
      return `hue=h=${Math.round(s * 60)},` +
             `eq=saturation=${sat(1.4, 0.8)}:contrast=${con(1.1, 0.4)},` +
             `boxblur=${Math.max(1, Math.round(s * 2))}:1`;

    case 'layer-mixed':
      // Soul layer: all effects layered
      return `eq=saturation=${sat(1.4, 0.8)}:contrast=${con(1.3, 0.6)},` +
             `noise=alls=${noise(16, 28)}:allf=t+u,hue=h=${Math.round(s * 30)},` +
             `unsharp=7:7:${sharp(1.0, 2.0)}`;

    case 'glitch':
      // RGB corruption: hue split + noise + contrast
      return `hue=h=${Math.round(s * 45)},eq=saturation=${sat(1.5, 1.0)}:contrast=${con(1.2, 0.5)},` +
             `noise=alls=${noise(20, 40)}:allf=t+u`;

    case 'doodle-melt':
      // Cartoon melt: high sat + blur blend
      return `eq=saturation=${sat(1.4, 0.8)}:contrast=${con(1.2, 0.4)},` +
             `boxblur=${Math.max(0, Math.round(s * 2))}:1,unsharp=5:5:${sharp(0.8, 2.0)}`;

    case 'cloud-surf':
      // Dreamy pastel: lift + soften + desaturate slightly
      return `boxblur=${Math.max(1, Math.round(1 + s * 3))}:1,` +
             `eq=saturation=${sat(0.8, 0.4)}:contrast=${con(0.82, 0.18)}:brightness=${(0.05 + s * 0.10).toFixed(2)}`;

    // ── Graphic ────────────────────────────────────────────────
    case 'comic':
      // Ben-Day dots: high contrast + halftone-ish noise + sat
      return `eq=saturation=${sat(1.5, 0.8)}:contrast=${con(1.4, 0.7)},` +
             `unsharp=7:7:${sharp(1.4, 2.6)},noise=alls=${noise(8, 14)}:allf=t`;

    case 'sketch-to-real':
      // Pencil sketch: edge detect + grayscale
      return `format=gray,eq=contrast=${con(1.2, 0.7)}:brightness=${(0.03 + s * 0.08).toFixed(2)},` +
             `edgedetect=low=${(0.07 + s * 0.09).toFixed(2)}:high=${(0.22 + s * 0.22).toFixed(2)}`;

    case 'sticker':
      // Kawaii: very high sat + bright + unsharp
      return `eq=saturation=${sat(1.5, 1.0)}:contrast=${con(1.1, 0.3)}:brightness=${(0.04 + s * 0.08).toFixed(2)},` +
             `unsharp=5:5:${sharp(0.6, 1.6)}`;

    case 'this-is-fine':
      // Meme flat cartoon: high contrast + sat + flat look
      return `eq=saturation=${sat(1.3, 0.8)}:contrast=${con(1.3, 0.6)},` +
             `unsharp=7:7:${sharp(1.0, 2.2)}`;

    case 'motion-design':
      // Clean vector: high sharpness + moderate sat
      return `eq=saturation=${sat(1.1, 0.5)}:contrast=${con(1.15, 0.35)},` +
             `unsharp=5:5:${sharp(1.0, 2.0)}`;

    default:
      // Fallback by category
      if (category === 'Retro & Vintage') {
        return `curves=vintage,noise=alls=${noise(12, 20)}:allf=t+u,eq=saturation=${sat(1.1, 0.4)}`;
      }
      if (category === 'Surreal & Abstract') {
        return `eq=saturation=${sat(1.4, 0.7)}:contrast=${con(1.1, 0.4)},` +
               `hue=h=${Math.round(s * 30)},noise=alls=${noise(8, 16)}:allf=t+u`;
      }
      if (category === 'Cinematic') {
        return `eq=saturation=${sat(1.1, 0.4)}:contrast=${con(1.2, 0.4)},vignette`;
      }
      return `eq=saturation=${sat(1.2, 0.6)}:contrast=${con(1.1, 0.3)}:brightness=0.02,` +
             `unsharp=5:5:${sharp(0.6, 1.4)}`;
  }
}

function getMockBlendFilter(styleFilter: string, strength: number): string {
  const opacity = Math.max(0, Math.min(1, strength)).toFixed(3);
  return `[0:v]split=2[base][stylize];[stylize]${styleFilter}[fx];[fx][base]scale2ref=w=main_w:h=main_h[fxs][base2];[base2][fxs]blend=all_expr='A*(1-${opacity})+B*${opacity}'[out]`;
}

export async function mockStyleTransfer(payload: AiProviderPayload): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const strength = Math.max(0, Math.min(1, payload.strength));

  const frames = fs
    .readdirSync(payload.frameDir)
    .filter((f: string) => f.endsWith('.png') || f.endsWith('.jpg'))
    .sort();

  if (frames.length === 0) {
    throw new Error('No extracted frames were found to style.');
  }

  fs.mkdirSync(payload.outputDir, { recursive: true });

  if (strength <= 0) {
    for (const frame of frames) {
      fs.copyFileSync(path.join(payload.frameDir, frame), path.join(payload.outputDir, frame));
    }
    console.log(`[mock] Style transfer skipped for job ${payload.jobId}; strength=0.00`);
    return;
  }

  const styleData = STYLES.find((s) => s.id === payload.style);
  const category = styleData?.category ?? 'Artistic';
  const filter = getMockFilter(String(payload.style), category, strength, `${payload.jobId}:${payload.prompt}`);
  const blendedFilter = getMockBlendFilter(filter, strength);

  console.log(
    `[mock] Style "${payload.style}" | strength=${strength.toFixed(2)} | filter="${filter}" | ${frames.length} frames`,
  );

  try {
    await execFileAsync(ffmpegBinary(), [
      '-y',
      '-framerate', String(payload.fps),
      '-i', path.join(payload.frameDir, 'frame_%04d.png'),
      '-filter_complex', blendedFilter,
      '-map', '[out]',
      '-frames:v', String(frames.length),
      path.join(payload.outputDir, 'frame_%04d.png'),
    ]);
  } catch (error) {
    console.warn('[mock] FFmpeg stylization failed, falling back to copied frames:', error);
    for (const frame of frames) {
      fs.copyFileSync(path.join(payload.frameDir, frame), path.join(payload.outputDir, frame));
    }
  }

  console.log(`[mock] Style transfer complete for job ${payload.jobId}`);
}
