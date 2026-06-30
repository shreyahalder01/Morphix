'use client';
import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import StyleSelector from '@/components/style-selector';
import { STYLES } from '@/lib/server/styles-data';

interface UploadPanelProps {
  onJobCreated: (jobId: string) => void;
}

export default function UploadPanel({ onJobCreated }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultStyle = STYLES[0]?.id ?? 'ghibli';
  const [file, setFile] = useState<File | null>(null);
  const [styleId, setStyleId] = useState<string>(defaultStyle);
  const [fps, setFps] = useState(24);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFile(f: File) {
    if (!f.type.startsWith('video/')) {
      setError('Please upload a video file (MP4, MOV, WebM, AVI).');
      return;
    }
    setError('');
    setFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError('');

    // Resolve the full prompt hint for the selected style
    const selectedStyle = STYLES.find(s => s.id === styleId);
    const prompt = selectedStyle?.promptHint ?? styleId;

    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('style', styleId);       // style id for display / DB
      fd.append('prompt', prompt);       // actual prompt sent to AI engine
      fd.append('fps', String(fps));
      const res = await fetch('/api/process', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Upload failed');
      }
      const { jobId } = await res.json();
      onJobCreated(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  const selectedStyle = STYLES.find(s => s.id === styleId);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        style={{
          padding: '32px',
          borderRadius: '24px',
          background: dragging
            ? 'linear-gradient(180deg, rgba(139,104,255,0.18), rgba(255,255,255,0.04))'
            : 'linear-gradient(180deg, rgba(139,104,255,0.08), rgba(255,255,255,0.02))',
          border: dragging
            ? '1px dashed rgba(139,104,255,0.70)'
            : '1px dashed rgba(139,104,255,0.30)',
          minHeight: '200px',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onChange} />
        <div>
          <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🎬</div>
          {file ? (
            <>
              <strong style={{ display: 'block', color: 'var(--white)', fontSize: '1.1rem' }}>{file.name}</strong>
              <p style={{ color: 'var(--muted)', marginTop: '6px' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB — click or drop to replace
              </p>
            </>
          ) : (
            <>
              <strong style={{ display: 'block', color: 'var(--white)', fontSize: '1.1rem' }}>
                Drop your video here or click to browse
              </strong>
              <p style={{ color: 'var(--muted)', marginTop: '8px', maxWidth: '440px' }}>
                Supports MP4, MOV, WebM, AVI — up to 64 MB
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '14px' }}>
                {['MP4', 'MOV', 'WebM', 'AVI', 'MKV'].map(f => (
                  <span key={f} style={{
                    padding: '5px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--muted)',
                    fontSize: '0.78rem',
                  }}>{f}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Style selector */}
      <div>
        <div style={{
          color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '12px',
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Choose style
        </div>
        <StyleSelector value={styleId} onChange={setStyleId} />
      </div>

      {/* FPS selector */}
      <div style={{
        padding: '16px 18px',
        borderRadius: '18px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '10px' }}>
          <span>Output FPS</span>
          <strong style={{ color: 'var(--purple-2)' }}>{fps} fps</strong>
        </label>
        <input
          type="range" min={5} max={60} step={1} value={fps}
          onChange={e => setFps(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--purple)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.74rem', marginTop: '6px' }}>
          <span>5 fps</span><span>60 fps</span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '14px',
          background: 'rgba(239,90,168,0.10)', border: '1px solid rgba(239,90,168,0.28)',
          color: '#ef5aa8', fontSize: '0.9rem',
        }}>{error}</div>
      )}

      <button
        onClick={submit}
        disabled={!file || loading}
        style={{
          padding: '14px 20px',
          borderRadius: '14px',
          border: 0,
          cursor: file && !loading ? 'pointer' : 'not-allowed',
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          background: file && !loading
            ? 'linear-gradient(135deg, var(--purple) 0%, var(--blue) 100%)'
            : 'rgba(255,255,255,0.06)',
          opacity: file && !loading ? 1 : 0.5,
          transition: 'transform 0.2s, opacity 0.2s',
          fontFamily: 'Syne, system-ui, sans-serif',
        }}
      >
        {loading
          ? 'Uploading…'
          : file
            ? `Start render — ${selectedStyle?.name ?? styleId}`
            : 'Select a video first'}
      </button>
    </div>
  );
}
