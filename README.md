# Morphix Mixed Media Studio

Morphix is a Next.js-based mixed-media animation studio scaffold. Users upload a source video, pick a mixed-media style, choose an output FPS between 12 and 24, and submit the job to a backend pipeline that uses FFmpeg plus a pluggable AI video-to-video seam.

## What is included

- `UploadPanel`: drag-and-drop video upload
- `StyleSelector`: mixed-media combination picker
- `ProcessingDashboard`: live progress and status UI
- `ResultsPanel`: side-by-side original/output comparison and download button
- `app/api/process`: upload + job creation route
- `app/api/process/[jobId]`: job status route
- `app/api/process/[jobId]/file`: file streaming route for preview and download
- `lib/server/processor.ts`: FFmpeg extraction, AI payload generation, and recompilation pipeline

## Run locally

1. Install FFmpeg if you want to use your own system binary.
	The Node server now falls back to `ffmpeg-static`, and the Python worker falls back to `imageio-ffmpeg`, so a system-wide install is optional.
2. Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

3. Apply the database schema:

```bash
Get-Content db/schema.sql | docker compose exec -T postgres psql -U morphix -d morphix -f -
```

If you prefer a host-side `psql` command, use `127.0.0.1:5433` instead of `localhost` and make sure no other Postgres instance is already bound to port 5433.

4. Install frontend dependencies:

```bash
npm install
```

5. Install worker dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r worker/requirements.txt
```

6. Run the worker service:

```bash
uvicorn worker.main:app --reload --port 8000
```

7. Start the dev server:

```bash
npm run dev
```

8. Open `http://localhost:3000`.

## Where to plug in the AI engine

The integration seam is `lib/server/ai-engine.ts`.

- `buildAiProviderPayload(...)` prepares the metadata you would send to your AI provider.
- `mockStyleTransfer(...)` is the mock fallback used when `AI_PROVIDER=mock`.
- The current worker is already wired to a real ComfyUI HTTP API flow in `worker/providers/comfyui.py`.

Examples of provider wiring:

- Stable Video Diffusion hosted API
- Runway video-to-video endpoint
- Custom ComfyUI workflow served from your own GPU worker

In production, replace the mock frame copy step with:

1. Frame upload to your provider or worker.
2. Style transfer response handling.
3. Writing provider-generated frames back into the `styled` frame directory.
4. FFmpeg recompilation to MP4 or MOV.

## Environment variables

```bash
DATABASE_URL=postgresql://morphix:morphix@127.0.0.1:5433/morphix
REDIS_URL=redis://localhost:6379/0
REDIS_STREAM_NAME=morphix:render:jobs
REDIS_CONSUMER_GROUP=morphix-workers
REDIS_CONSUMER_NAME=worker-1
MORPHIX_PROVIDER=comfyui
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_CHECKPOINT=sdxl.safetensors
COMFYUI_API_KEY=your-api-key
COMFYUI_API_KEY_HEADER=Authorization
COMFYUI_API_KEY_PREFIX=Bearer
AI_PROVIDER=mock
AI_STYLE_API_URL=https://your-provider.example.com/process
AI_STYLE_API_KEY=your-api-key
FFMPEG_PATH=ffmpeg
```

For hosted ComfyUI-compatible APIs, set `COMFYUI_BASE_URL` to the provider endpoint and set either `COMFYUI_API_KEY` or `AI_STYLE_API_KEY`. The default header is `Authorization: Bearer <key>`; adjust `COMFYUI_API_KEY_HEADER` and `COMFYUI_API_KEY_PREFIX` if your provider expects a different format.

## Production notes

- The current job store is file-based for clarity.
- Swap `lib/server/job-store.ts` and `lib/server/processor.ts` with Redis + a worker queue for scale.
- Store source and output media in object storage such as S3 or GCS before moving to serverless or multi-instance deployment.
- The current worker uses ComfyUI for concrete frame-by-frame style transfer. Replace `worker/providers/comfyui.py` with a Runway or Stable Video Diffusion adapter if that better matches your deployment.
- Render history is exposed through `GET /api/jobs`, backed by the `render_history` table.
