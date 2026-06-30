from __future__ import annotations

import os
import subprocess
import shutil
from pathlib import Path

from functools import lru_cache

import imageio_ffmpeg


def _is_usable_binary(candidate: str) -> bool:
    path = Path(candidate)
    if path.is_absolute() or any(sep in candidate for sep in ('\\', '/')):
                return path.exists()
    return shutil.which(candidate) is not None


@lru_cache(maxsize=1)
def ffmpeg_binary() -> str:
    configured = os.getenv('FFMPEG_PATH', '').strip()
    if configured and _is_usable_binary(configured):
        return configured

    bundled = imageio_ffmpeg.get_ffmpeg_exe()
    if bundled and _is_usable_binary(bundled):
        return bundled

    if configured:
        return configured

    return shutil.which('ffmpeg') or 'ffmpeg'


def extract_frames(input_path: str, frames_dir: str, fps: int) -> None:
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    pattern = str(Path(frames_dir) / '%06d.png')
    subprocess.run(
        [
            ffmpeg_binary(),
            '-hide_banner',
            '-y',
            '-i',
            input_path,
            '-vf',
            f'fps={fps},scale=1280:-2:flags=lanczos',
            '-start_number',
            '0',
            pattern,
        ],
        check=True,
    )


def recompile_video(input_pattern: str, output_path: str, fps: int, audio_source_path: str | None = None) -> None:
    args = [ffmpeg_binary(), '-hide_banner', '-y', '-framerate', str(fps), '-i', input_pattern, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos']
    if audio_source_path:
        args.extend(['-i', audio_source_path, '-map', '0:v:0', '-map', '1:a?', '-c:a', 'aac', '-b:a', '192k', '-shortest'])

    args.extend(['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', str(fps), output_path])
    subprocess.run(args, check=True)


def create_poster(input_path: str, output_path: str) -> None:
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            ffmpeg_binary(),
            '-hide_banner',
            '-y',
            '-ss',
            '00:00:01.000',
            '-i',
            input_path,
            '-frames:v',
            '1',
            '-q:v',
            '2',
            output_path,
        ],
        check=True,
    )
