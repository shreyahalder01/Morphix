from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from worker.db import record_history, set_job_status
from worker.ffmpeg import create_poster, extract_frames, recompile_video
from worker.providers.comfyui import ComfyUIClient


def _frame_name(index: int) -> str:
    return f'{index:06d}.png'


async def process_render_job(job: dict) -> dict:
    job_id = job['id']
    original_path = job['original_storage_path']
    fps = int(job['fps'])
    prompt = job.get('prompt') or ''
    style_name = job['style_key']
    raw_strength = job.get('strength')
    strength = float(raw_strength) if raw_strength not in (None, '') else 0.82

    output_root = Path('.morphix') / 'outputs' / job_id
    preview_root = Path('.morphix') / 'previews' / job_id
    output_root.mkdir(parents=True, exist_ok=True)
    preview_root.mkdir(parents=True, exist_ok=True)

    provider_prompt = prompt.strip()
    comfyui = ComfyUIClient()

    try:
        with TemporaryDirectory() as temp_dir:
            source_frames = Path(temp_dir) / 'source'
            styled_frames = Path(temp_dir) / 'styled'
            source_frames.mkdir(parents=True, exist_ok=True)
            styled_frames.mkdir(parents=True, exist_ok=True)

            set_job_status(job_id, 'extracting_frames', 18, 'Extracting frames with FFmpeg...')
            record_history(job_id, 'extracting_frames', 18, 'Extracting frames with FFmpeg...', {'provider': 'comfyui'})
            extract_frames(original_path, str(source_frames), fps)

            frame_paths = sorted(source_frames.glob('*.png'))
            total_frames = max(len(frame_paths), 1)

            set_job_status(job_id, 'applying_style_transfer', 50, 'Applying ComfyUI mixed-media style transfer...')
            record_history(job_id, 'applying_style_transfer', 50, 'Applying ComfyUI mixed-media style transfer...', {'frames': total_frames})

            for index, frame_path in enumerate(frame_paths):
                prompt_id = comfyui.submit_frame(str(frame_path), style_name, provider_prompt, strength)
                outputs = comfyui.wait_for_output(prompt_id)
                if not outputs:
                    raise RuntimeError(f'No outputs returned for frame {index}')

                comfyui.download_output(outputs[0], str(styled_frames / _frame_name(index)))
                if index % max(total_frames // 8, 1) == 0:
                    progress = 50 + int((index / total_frames) * 30)
                    set_job_status(job_id, 'applying_style_transfer', progress, f'Styling frame {index + 1} of {total_frames}...')
                    record_history(job_id, 'applying_style_transfer', progress, f'Styling frame {index + 1} of {total_frames}...', {'frame': index})

            output_video = output_root / 'mixed-media.mp4'
            poster_file = preview_root / 'poster.jpg'

            set_job_status(job_id, 'recompiling_video', 86, 'Recompiling the stylized frame sequence...')
            record_history(job_id, 'recompiling_video', 86, 'Recompiling the stylized frame sequence...')
            recompile_video(str(styled_frames / '%06d.png'), str(output_video), fps, audio_source_path=original_path)
            create_poster(str(output_video), str(poster_file))

            final_update = set_job_status(
                job_id,
                'done',
                100,
                'Mixed-media animation is ready for download.',
                output_file_name='mixed-media.mp4',
                output_storage_path=str(output_video),
                poster_storage_path=str(poster_file),
                provider='comfyui',
                provider_job_id=None,
                original_storage_path=original_path,
                original_url=f'/api/process/{job_id}/file?kind=original',
                output_url=f'/api/process/{job_id}/file?kind=output',
                download_url=f'/api/process/{job_id}/file?kind=output&download=1',
                poster_url=f'/api/process/{job_id}/file?kind=poster',
            )
            record_history(job_id, 'done', 100, 'Mixed-media animation is ready for download.', {'output': str(output_video)})
            return final_update
    except Exception as error:  # noqa: BLE001
        set_job_status(job_id, 'failed', 100, 'Mixed-media render failed.', error=str(error))
        record_history(job_id, 'failed', 100, 'Mixed-media render failed.', {'error': str(error)})
        raise
