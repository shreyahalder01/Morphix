'use client';
import { useEffect, useState, useCallback } from 'react';
import type { ApiJob } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  pending:    'Queued',
  extracting: 'Extracting frames…',
  styling:    'Applying style…',
  compiling:  'Compiling output…',
  done:       'Complete',
  error:      'Failed',
};

const STATUS_COLORS: Record<string, string> = {
  pending:    '#96a0b5',
  extracting: '#42a6ff',
  styling:    '#8b68ff',
  compiling:  '#ef5aa8',
  done:       '#57e6a4',
  error:      '#ef5aa8',
};

interface Props {
  jobId: string;
  onDone: (job: ApiJob) => void;
}

export default function ProcessingDashboard({ jobId, onDone }: Props) {
  const [job, setJob] = useState<ApiJob | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/process/${jobId}`);
      if (!res.ok) return;
      const data: ApiJob = await res.json();
      setJob(data);
      if (data.status === 'done') onDone(data);
    } catch {
      // network blip — keep polling
    }
  }, [jobId, onDone]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [poll]);

  if (!job) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>⏳</div>
        Loading job…
      </div>
    );
  }

  const isDone = job.status === 'done';
  const isError = job.status === 'error';
  const color = STATUS_COLORS[job.status] ?? '#96a0b5';

  const steps = [
    { key: 'extracting', label: 'Extract frames',    pct: 30  },
    { key: 'styling',    label: 'Style transfer',    pct: 80  },
    { key: 'compiling',  label: 'Compile video',     pct: 95  },
    { key: 'done',       label: 'Done',              pct: 100 },
  ];

  function stepState(stepKey: string, stepPct: number) {
    if (isDone) return 'done';
    if (isError) return 'idle';
    const order = steps.map(s => s.key);
    const cur = order.indexOf(job!.status);
    const me = order.indexOf(stepKey);
    if (me < cur) return 'done';
    if (me === cur) return 'active';
    return 'idle';
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', color: 'var(--white)', fontWeight: 700, fontSize: '1.05rem' }}>
              Render job
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '2px' }}>{jobId}</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '999px',
            background: `${color}18`, border: `1px solid ${color}44`,
            color, fontSize: '0.82rem', fontWeight: 600,
          }}>
            {!isDone && !isError && (
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: color, boxShadow: `0 0 12px ${color}`,
                display: 'inline-block',
              }} />
            )}
            {STATUS_LABELS[job.status] ?? job.status}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '8px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          <div
            className={!isDone && !isError ? 'progress-bar' : ''}
            style={{
              height: '100%',
              width: `${job.progress}%`,
              borderRadius: '999px',
              background: isDone
                ? 'linear-gradient(90deg, #57e6a4, #42a6ff)'
                : isError
                  ? 'rgba(239,90,168,0.6)'
                  : undefined,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--muted)', fontSize: '0.78rem' }}>
          <span>Style: <strong style={{ color: 'var(--white)' }}>{job.style}</strong></span>
          <span><strong style={{ color: 'var(--purple-2)' }}>{job.progress}%</strong></span>
        </div>
      </div>

      {/* Step list */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {steps.map(step => {
          const state = stepState(step.key, step.pct);
          return (
            <div key={step.key} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '13px 16px', borderRadius: '16px',
              background: state === 'active' ? 'rgba(139,104,255,0.10)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${state === 'active' ? 'rgba(139,104,255,0.30)' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'grid', placeItems: 'center', fontSize: '0.8rem',
                background: state === 'done' ? 'rgba(87,230,164,0.15)' : state === 'active' ? 'rgba(139,104,255,0.20)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${state === 'done' ? 'rgba(87,230,164,0.35)' : state === 'active' ? 'rgba(139,104,255,0.40)' : 'rgba(255,255,255,0.08)'}`,
                color: state === 'done' ? '#57e6a4' : state === 'active' ? 'var(--purple-2)' : 'var(--muted)',
              }}>
                {state === 'done' ? '✓' : state === 'active' ? '…' : '○'}
              </div>
              <span style={{ color: state === 'idle' ? 'var(--muted)' : 'var(--white)', fontSize: '0.92rem', fontWeight: state === 'active' ? 600 : 400 }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isError && (
        <div style={{
          padding: '14px 16px', borderRadius: '14px',
          background: 'rgba(239,90,168,0.10)', border: '1px solid rgba(239,90,168,0.28)',
          color: '#ef5aa8', fontSize: '0.9rem',
        }}>
          <strong>Error:</strong> {job.error ?? 'Unknown error'}
        </div>
      )}
    </div>
  );
}
