import type { AgoraRealtimeDebugState } from 'agora-realtime-react';

function formatDebugTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function compactDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return '';
  const entries = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)}`);
  return entries.join(' ');
}

export function RtcDebugPanel({
  debug,
  isCapturing,
  isPlaying,
  status,
}: {
  debug: AgoraRealtimeDebugState;
  isCapturing: boolean;
  isPlaying: boolean;
  status: string;
}) {
  const recentSteps = debug.steps.slice(-8).reverse();
  return (
    <aside className="rtc-debug-panel" data-testid="rtc-debug-panel">
      <div className="rtc-debug-header">RTC debug</div>
      <dl className="rtc-debug-grid">
        <div>
          <dt>Status</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt>Conn</dt>
          <dd>{debug.connectionState ?? 'idle'}</dd>
        </div>
        <div>
          <dt>Mic</dt>
          <dd>{isCapturing ? 'capturing' : debug.isLocalAudioPublished ? 'published' : 'off'}</dd>
        </div>
        <div>
          <dt>Speaker</dt>
          <dd>{isPlaying || debug.remoteAudioPlaying ? 'playing' : 'waiting'}</dd>
        </div>
        <div>
          <dt>Remote</dt>
          <dd>{debug.remoteUsers.length ? debug.remoteUsers.map((user) => `${user.uid}:${user.hasAudio ? 'audio' : 'no-audio'}`).join(', ') : 'none'}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>{debug.setup?.channel ?? 'n/a'}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{debug.setup?.agentRtcUid ?? 'n/a'}</dd>
        </div>
        <div>
          <dt>Agent status</dt>
          <dd>{debug.setup?.agentStatus ?? 'n/a'}</dd>
        </div>
        <div>
          <dt>Token</dt>
          <dd>{debug.setup?.token ?? 'n/a'}</dd>
        </div>
        <div>
          <dt>Remote level</dt>
          <dd>{debug.lastRemoteAudioLevel === undefined ? 'n/a' : debug.lastRemoteAudioLevel.toFixed(3)}</dd>
        </div>
      </dl>
      {debug.lastError ? <div className="rtc-debug-error">{debug.lastError}</div> : null}
      <ol className="rtc-debug-log">
        {recentSteps.map((step) => (
          <li key={`${step.at}-${step.label}`}>
            <span>{formatDebugTime(step.at)}</span>
            <strong>{step.label}</strong>
            <em>{compactDetails(step.details)}</em>
          </li>
        ))}
      </ol>
    </aside>
  );
}
