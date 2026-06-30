from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import httpx


STYLE_PROMPTS: dict[str, dict[str, object]] = {
    'vintage-stop-motion-neon-2d': {
        'positive': 'vintage stop-motion animation, tactile puppetry, handcrafted miniatures, neon 2D linework, graphic motion design, cinematic mixed media',
        'negative': 'photorealistic, flat lighting, blurry, low quality, static frame, inconsistent motion',
        'denoise': 0.76,
    },
    'live-action-comic-halftone': {
        'positive': 'live-action footage transformed into comic book art, bold ink outlines, halftone shading, pop-art contrast, graphic novel styling',
        'negative': 'photorealistic, washed out, blurry, low contrast, soft shading',
        'denoise': 0.72,
    },
    'watercolor-cutout': {
        'positive': 'watercolor washes, cut-out collage shapes, layered paper texture, soft painterly motion, handcrafted mixed media',
        'negative': 'photorealistic, hard edges, digital noise, muddy colors, low detail',
        'denoise': 0.78,
    },
    'paper-collage-ink': {
        'positive': 'paper collage, torn paper edges, digital ink outlines, layered magazine texture, expressive mixed media animation',
        'negative': 'photorealistic, smooth surfaces, blurry, flat composition, low contrast',
        'denoise': 0.74,
    },
    'scrapbook-cutout-motion': {
        'positive': 'cohesive mixed media animation with all media layers clearly visible, real-world photography base blended with bold 2D cel animation linework, paper cutout collage layers, visible tactile 3D clay texture patches, woven fabric grain patches, corrugated cardboard edge texture, hand-drawn black ink marks, marker doodles, scribbled arrows and circles, visible sticker labels, torn masking tape strips attached as physical collage elements, scanned paper grain, rough scissor edges, imperfect white borders, subtle drop shadows between media layers, stop-motion jitter, frame-by-frame handmade animation energy, dynamic editorial composition, preserve source subject identity pose camera angle and readable silhouette',
        'negative': 'single medium only, pure photorealism, pure anime, pure 3D render, pure watercolor, pure oil painting, smooth CGI with no handmade texture, seamless digital compositing, no tape, no stickers, no doodles, no fabric texture, no cardboard texture, flat vector UI, warped anatomy, excessive typography over subject',
        'denoise': 0.79,
    },
    'glossy-3d-rotoscope': {
        'positive': 'glossy 3D surfaces, rotoscoped motion, cinematic lighting, stylized depth, polished mixed media animation',
        'negative': 'low poly, flat shading, noisy texture, blurry motion, inconsistent geometry',
        'denoise': 0.68,
    },
    'vhs-neon-sketch': {
        'positive': 'VHS glitch, neon sketch lines, retro analog distortion, chromatic aberration, synthwave mixed media animation',
        'negative': 'clean digital video, photorealistic, soft blur, modern pristine look, low contrast',
        'denoise': 0.75,
    },
}

STYLE_FALLBACKS: list[tuple[tuple[str, ...], str]] = [
    (('scrapbook', 'mixed media', 'collage', 'cutout', 'paper', 'tape', 'sticker', 'doodle', 'layer'), 'scrapbook-cutout-motion'),
    (('comic', 'halftone', 'graphic', 'poster', 'motion design', 'this is fine', 'graffiti', 'paparazzi', 'grime', 'two color'), 'live-action-comic-halftone'),
    (('watercolor', 'ghibli', 'storybook', 'cloud', 'dreamy', 'canvas', 'oil painting'), 'watercolor-cutout'),
    (('anime', 'claymation', 'gouache', 'sketch', 'ink', 'risograph'), 'paper-collage-ink'),
    (('vhs', 'retro', 'pixel', '60s', 'japanese', 'burning sunset'), 'vhs-neon-sketch'),
    (('noir', 'giallo', 'neon', 'cyberpunk', 'dragon', 'night vision', 'office', 'red carpet', 'particles', 'multiverse', 'glitch'), 'glossy-3d-rotoscope'),
]


class ComfyUIClient:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or os.getenv('COMFYUI_BASE_URL') or 'http://127.0.0.1:8188').rstrip('/')
        self.checkpoint = os.getenv('COMFYUI_CHECKPOINT', 'sdxl.safetensors')
        self.api_key = os.getenv('COMFYUI_API_KEY') or os.getenv('AI_STYLE_API_KEY') or ''
        self.auth_header = os.getenv('COMFYUI_API_KEY_HEADER', 'Authorization')
        default_prefix = 'Bearer' if self.auth_header.lower() == 'authorization' else ''
        self.auth_prefix = os.getenv('COMFYUI_API_KEY_PREFIX', default_prefix)
        self.client = httpx.Client(timeout=300.0, headers=self._auth_headers())

    def _auth_headers(self) -> dict[str, str]:
        if not self.api_key:
            return {}
        value = f'{self.auth_prefix} {self.api_key}'.strip() if self.auth_prefix else self.api_key
        return {self.auth_header: value}

    def _resolve_style(self, style: str, prompt: str = '') -> dict[str, object]:
        normalized = style.strip().lower()
        if normalized in STYLE_PROMPTS:
            return STYLE_PROMPTS[normalized]

        search_text = f'{style} {prompt}'.lower()
        for keywords, fallback_style in STYLE_FALLBACKS:
            if any(keyword in search_text for keyword in keywords):
                return STYLE_PROMPTS[fallback_style]

        return STYLE_PROMPTS['scrapbook-cutout-motion']

    def upload_image(self, image_path: str) -> str:
        with open(image_path, 'rb') as file_handle:
            response = self.client.post(
                f'{self.base_url}/upload/image',
                files={'image': (Path(image_path).name, file_handle, 'image/png')},
            )
        response.raise_for_status()
        payload = response.json()
        return payload['name']

    def _default_workflow(self, uploaded_image_name: str, style: str, prompt: str, strength: float | None = None) -> dict[str, Any]:
        style_config = self._resolve_style(style, prompt)
        style_prompt = str(style_config['positive'])
        extra_prompt = prompt.strip()
        positive_prompt = f'{style_prompt}, {extra_prompt}' if extra_prompt else style_prompt
        negative_prompt = str(style_config['negative'])
        denoise = max(0.0, min(1.0, strength if strength is not None else float(style_config['denoise'])))
        return {
            '1': {
                'class_type': 'LoadImage',
                'inputs': {'image': uploaded_image_name},
            },
            '2': {
                'class_type': 'CheckpointLoaderSimple',
                'inputs': {'ckpt_name': self.checkpoint},
            },
            '3': {
                'class_type': 'CLIPTextEncode',
                'inputs': {'text': positive_prompt, 'clip': ['2', 1]},
            },
            '4': {
                'class_type': 'CLIPTextEncode',
                'inputs': {'text': negative_prompt, 'clip': ['2', 1]},
            },
            '5': {
                'class_type': 'VAEEncode',
                'inputs': {'pixels': ['1', 0], 'vae': ['2', 2]},
            },
            '6': {
                'class_type': 'KSampler',
                'inputs': {
                    'seed': 123456789,
                    'steps': 20,
                    'cfg': 7,
                    'sampler_name': 'dpmpp_2m',
                    'scheduler': 'karras',
                    'denoise': denoise,
                    'model': ['2', 0],
                    'positive': ['3', 0],
                    'negative': ['4', 0],
                    'latent_image': ['5', 0],
                },
            },
            '7': {
                'class_type': 'VAEDecode',
                'inputs': {'samples': ['6', 0], 'vae': ['2', 2]},
            },
            '8': {
                'class_type': 'SaveImage',
                'inputs': {'filename_prefix': 'morphix/frame', 'images': ['7', 0]},
            },
        }

    def submit_frame(self, image_path: str, style: str, prompt: str = '', strength: float | None = None) -> str:
        image_name = self.upload_image(image_path)
        workflow = self._default_workflow(image_name, style, prompt, strength)
        response = self.client.post(
            f'{self.base_url}/prompt',
            json={'prompt': workflow, 'client_id': os.getenv('COMFYUI_CLIENT_ID', 'morphix-worker')},
        )
        response.raise_for_status()
        return response.json()['prompt_id']

    def wait_for_output(self, prompt_id: str) -> list[dict[str, Any]]:
        deadline = time.time() + 1800
        while time.time() < deadline:
            response = self.client.get(f'{self.base_url}/history/{prompt_id}')
            response.raise_for_status()
            payload = response.json()
            if prompt_id in payload:
                outputs: list[dict[str, Any]] = []
                nodes = payload[prompt_id].get('outputs', {})
                for node in nodes.values():
                    outputs.extend(node.get('images', []))
                if outputs:
                    return outputs
            time.sleep(2)
        raise TimeoutError(f'ComfyUI job {prompt_id} timed out')

    def download_output(self, image_info: dict[str, Any], target_path: str) -> None:
        response = self.client.get(
            f"{self.base_url}/view",
            params={
                'filename': image_info['filename'],
                'subfolder': image_info.get('subfolder', ''),
                'type': image_info.get('type', 'output'),
            },
        )
        response.raise_for_status()
        Path(target_path).parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, 'wb') as file_handle:
            file_handle.write(response.content)
