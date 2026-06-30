export type JobStatus = 'pending' | 'extracting' | 'styling' | 'compiling' | 'done' | 'error';

export interface Job {
  id: string;
  style: string;
  fps: number;
  strength?: number;
  status: JobStatus;
  progress: number;
  sourcePath?: string;
  outputPath?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ApiJob {
  id: string;
  style: string;
  fps: number;
  strength?: number;
  status: JobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  downloadUrl?: string;
  message?: string;
  originalUrl?: string;
  outputUrl?: string;
  posterUrl?: string;
}

export const STYLE_OPTIONS = [
  { id: 'anime',      label: 'Anime',         tag: 'Popular',  tileClass: 'tile-anime' },
  { id: 'claymation', label: 'Claymation',    tag: 'Textured', tileClass: 'tile-clay'  },
  { id: 'sketch',     label: 'Sketch',        tag: 'Linework', tileClass: 'tile-sketch' },
  { id: 'collage',    label: 'Collage',       tag: 'Mixed',    tileClass: 'tile-collage' },
  { id: 'watercolor', label: 'Watercolor',    tag: 'Painterly',tileClass: 'tile-water' },
  { id: 'cyberpunk',  label: 'Cyberpunk',     tag: 'Neon',     tileClass: 'tile-cyber' },
  { id: 'noir',       label: 'Noir',          tag: 'B&W',      tileClass: 'tile-noir'  },
  { id: 'vhs',        label: 'VHS Glitch',    tag: 'Retro',    tileClass: 'tile-vhs'   },
  { id: 'ghibli',     label: 'Ghibli',        tag: 'Dreamy',   tileClass: 'tile-ghibli' },
] as const;

export type StyleId = typeof STYLE_OPTIONS[number]['id'];
