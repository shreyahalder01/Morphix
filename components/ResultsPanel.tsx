'use client';
import type { ApiJob } from '@/types';

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

interface Props {
  job: ApiJob;
  onReset: () => void;
}

export default function ResultsPanel({ job, onReset }: Props) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Success banner */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(87,230,164,0.10), rgba(66,166,255,0.08))',
        border: '1px solid rgba(87,230,164,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(87,230,164,0.18)', border: '1px solid rgba(87,230,164,0.35)',
          display: 'grid', placeItems: 'center', fontSize: '1.2rem',
        }}>✓</div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', color: 'var(--white)', fontWeight: 700, fontSize: '1.05rem' }}>
            Render complete
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            Style: <strong style={{ color: 'var(--white)' }}>{job.style}</strong> · {job.fps} fps
          </div>
        </div>
      </div>

      {/* Video preview placeholder */}
      <div style={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(139,104,255,0.18), rgba(66,166,255,0.12))',
        minHeight: '240px',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}>
        {job.downloadUrl ? (
          <video
            controls
            src={job.downloadUrl}
            style={{ width: '100%', maxHeight: '360px', display: 'block' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎞</div>
            <div>Preview unavailable</div>
          </div>
        )}
      </div>

      {/* Job metadata */}
      <div style={{
        padding: '16px 18px',
        borderRadius: '18px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'grid',
        gap: '10px',
      }}>
        {[
          ['Job ID', job.id],
          ['Style', job.style],
          ['FPS', String(job.fps)],
          ['Completed', TIME_FORMATTER.format(new Date(job.updatedAt))],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <span style={{ color: 'var(--white)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {job.downloadUrl && (
          <a
            href={job.downloadUrl}
            download
            style={{
              display: 'block',
              padding: '14px 20px',
              borderRadius: '14px',
              textAlign: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--blue) 100%)',
              fontFamily: 'Syne, system-ui, sans-serif',
              transition: 'transform 0.2s',
              textDecoration: 'none',
            }}
          >
            ⬇ Download MP4
          </a>
        )}
        <button
          onClick={onReset}
          style={{
            padding: '13px 20px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--white)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            fontFamily: 'Syne, system-ui, sans-serif',
          }}
        >
          Start another render
        </button>
      </div>
    </div>
  );
}
