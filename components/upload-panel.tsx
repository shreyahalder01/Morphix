'use client';

import { useRef } from 'react';
import { CloudUpload, FileVideo, FolderOpen, Video } from 'lucide-react';

interface UploadPanelProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function UploadPanel({ file, onFileChange }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const nextFile = files?.[0] ?? null;
    if (!nextFile) return;
    onFileChange(nextFile);
  };

  return (
    <section className="glass-panel gradient-border rounded-[1.75rem] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-morphix-purple/90">Step 1</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Upload your source video</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          MP4 and MOV supported
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-morphix-purple/30 bg-gradient-to-b from-morphix-purple/10 to-white/[0.02] px-6 text-center transition hover:border-morphix-purple/50 hover:bg-morphix-purple/12"
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-glow">
          <CloudUpload className="h-8 w-8 text-morphix-purple" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-white">Drag and drop a video here</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          Upload a video, then pick a mixed-media style and output frame rate. The backend will extract frames with FFmpeg and hand them to the AI provider seam.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {['MP4', 'MOV', 'High motion', 'Audio preserved'].map((label) => (
            <span key={label} className="rounded-full border border-white/8 bg-black/25 px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-slate-300">
              {label}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <FolderOpen className="h-4 w-4" />
          Choose file
        </button>
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
        {file ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileVideo className="h-5 w-5 text-morphix-blue" />
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{Math.round(file.size / 1024 / 1024)} MB</p>
              </div>
            </div>
            <button type="button" onClick={() => onFileChange(null)} className="text-xs text-slate-400 transition hover:text-white">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-400">
            <Video className="h-5 w-5" />
            No file selected yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default UploadPanel;