'use client';

import {
  HUMAN_BAR_COUNT,
  VoiceRingButton,
  microphoneCompatibilityWarning,
  useVoiceMeter,
  type VoiceMeterFrequencyRange,
  type VoiceMeterMetricRange,
  type VoiceRingState,
} from 'agora-realtime-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const HUMAN_METRIC_RANGE = { floor: 0.1, max: 1.35, min: 0.18 } satisfies VoiceMeterMetricRange;
const HUMAN_FREQUENCY_RANGE = { minHz: 120 } satisfies VoiceMeterFrequencyRange;

function streamFromStream(stream: MediaStream): MediaStream {
  return stream;
}

export function MicrophoneVoiceRingPreview() {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<VoiceRingState>('disconnected');
  const streamRef = useRef<MediaStream | null>(null);
  const {
    levels: humanLevels,
    start,
    stop,
  } = useVoiceMeter({
    barCount: HUMAN_BAR_COUNT,
    divisor: 145,
    frequencyRange: HUMAN_FREQUENCY_RANGE,
    metricRange: HUMAN_METRIC_RANGE,
    smoothingTimeConstant: 0.72,
    streamFromInput: streamFromStream,
  });

  const stopMicrophone = useCallback(() => {
    stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState('disconnected');
  }, [stop]);

  const startMicrophone = useCallback(async () => {
    setError(null);
    const warning = microphoneCompatibilityWarning();
    if (warning) {
      setError(warning);
      setState('interrupted');
      return;
    }

    try {
      setState('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      start(stream);
      setState('listening');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Microphone access was not available.');
      setState('interrupted');
    }
  }, [start]);

  const toggleMicrophone = useCallback(() => {
    if (state === 'listening' || state === 'connecting') {
      stopMicrophone();
      return;
    }
    void startMicrophone();
  }, [startMicrophone, state, stopMicrophone]);

  useEffect(() => stopMicrophone, [stopMicrophone]);

  return (
    <section className="voice-doc-preview" aria-label="Voice ring microphone preview">
      <div className="voice-doc-stage">
        <VoiceRingButton
          aiLevels={null}
          ariaLabel={state === 'listening' ? 'Stop microphone preview' : 'Start microphone preview'}
          className="docs-voice-ring"
          humanLevels={humanLevels}
          onClick={toggleMicrophone}
          state={state}
          testId="docs-microphone-voice-ring"
        />
        <button className="sample-action docs-voice-action" onClick={toggleMicrophone} type="button">
          {state === 'connecting' ? 'Opening microphone' : state === 'listening' ? 'Stop microphone' : 'Start microphone'}
        </button>
      </div>

      <div className="voice-doc-copy">
        <p className="eyebrow">Rendered component</p>
        <h2>Human voice in, no agent output.</h2>
        <p>
          This preview renders the actual <code>VoiceRingButton</code> from the SDK. The warm inward ring is driven by your microphone through <code>useVoiceMeter</code>; the AI ring is disabled with <code>aiLevels=&#123;null&#125;</code>.
        </p>
        <dl className="voice-doc-facts">
          <div>
            <dt>Input</dt>
            <dd>Microphone MediaStream</dd>
          </div>
          <div>
            <dt>AI levels</dt>
            <dd>None</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>No agent session</dd>
          </div>
        </dl>
        {error ? <p className="sample-error" role="status">{error}</p> : null}
      </div>
    </section>
  );
}
