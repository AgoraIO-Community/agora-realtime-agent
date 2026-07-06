'use client';

import {
  AI_BAR_COUNT,
  HUMAN_BAR_COUNT,
  VoiceRingButton,
  microphoneCompatibilityWarning,
  useAgoraRealtime,
  useVoiceMeter,
  type VoiceMeterFrequencyRange,
  type VoiceMeterMetricRange,
  type VoiceRingState,
} from 'agora-realtime-react';
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { buildDefaultAgentSessionConfig } from '../app/default-agent-config';
import { RtcDebugPanel } from './rtc-debug-panel';

const AI_METRIC_RANGE = { max: 2.9, min: 0 } satisfies VoiceMeterMetricRange;
const HUMAN_METRIC_RANGE = { floor: 0.12, max: 1.35, min: 0.26 } satisfies VoiceMeterMetricRange;
const AI_FREQUENCY_RANGE = { minHz: 80 } satisfies VoiceMeterFrequencyRange;
const HUMAN_FREQUENCY_RANGE = { minHz: 280 } satisfies VoiceMeterFrequencyRange;

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function streamFromTrack(mediaStreamTrack: MediaStreamTrack): MediaStream {
  return new MediaStream([mediaStreamTrack]);
}

function streamFromStream(stream: MediaStream): MediaStream {
  return stream;
}

function voiceStateFromRealtime(input: {
  isStarting: boolean;
  realtimeStatus: string;
}): VoiceRingState {
  if (input.isStarting || input.realtimeStatus === 'connecting') return 'connecting';
  if (input.realtimeStatus === 'connected') return 'listening';
  return 'disconnected';
}

function startErrorMessage(caught: unknown): string {
  if (caught instanceof DOMException) {
    if (caught.name === 'NotAllowedError') return 'Microphone permission was blocked.';
    if (caught.name === 'NotFoundError') return 'No microphone was found.';
    if (caught.name === 'NotReadableError') return 'Microphone is already in use.';
  }
  if (caught instanceof Error && caught.message) return caught.message;
  return 'Voice start failed.';
}

export function DefaultAgentVoice() {
  const [isStarting, setIsStarting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const fallbackPlaybackContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionConfig = useMemo(() => buildDefaultAgentSessionConfig(), []);
  const {
    levels: aiLevels,
    start: startAiWaveMeter,
    stop: stopAiWaveMeter,
  } = useVoiceMeter({
    barCount: AI_BAR_COUNT,
    divisor: 132,
    frequencyRange: AI_FREQUENCY_RANGE,
    metricRange: AI_METRIC_RANGE,
    smoothingTimeConstant: 0.74,
    streamFromInput: streamFromTrack,
  });
  const {
    levels: humanLevels,
    start: startHumanWaveMeter,
    stop: stopHumanWaveMeter,
  } = useVoiceMeter({
    barCount: HUMAN_BAR_COUNT,
    divisor: 145,
    frequencyRange: HUMAN_FREQUENCY_RANGE,
    metricRange: HUMAN_METRIC_RANGE,
    smoothingTimeConstant: 0.72,
    streamFromInput: streamFromStream,
  });
  const stopAllMeters = useCallback(() => {
    stopAiWaveMeter();
    stopHumanWaveMeter();
  }, [stopAiWaveMeter, stopHumanWaveMeter]);

  const realtime = useAgoraRealtime({
    api: { setup: '/api/agora/realtime/setup', end: '/api/agora/realtime/end' },
    sessionConfig,
    maxEvents: 40,
    onError: (error) => {
      setIsStarting(false);
      setStartError(error.message);
    },
    onRemoteAudioTrack: ({ mediaStreamTrack }) => startAiWaveMeter(mediaStreamTrack),
    onRemoteAudioTrackEnded: () => stopAiWaveMeter(),
  });

  const voiceState = voiceStateFromRealtime({
    isStarting,
    realtimeStatus: realtime.status,
  });
  const isVoiceActive = voiceState !== 'disconnected';
  const disconnectRealtimeOnUnmount = useEffectEvent(() => realtime.disconnect());

  useEffect(() => {
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    setShowDebug(debugParam === '1' || debugParam === 'true');
  }, []);

  useEffect(() => () => {
    stopAllMeters();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    void fallbackPlaybackContextRef.current?.close();
    fallbackPlaybackContextRef.current = null;
    disconnectRealtimeOnUnmount();
  }, [stopAllMeters]);

  async function unlockPlaybackAudio() {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return;

    const context = fallbackPlaybackContextRef.current ?? new AudioContextConstructor();
    fallbackPlaybackContextRef.current = context;
    const buffer = context.createBuffer(1, 1, context.sampleRate);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    if (context.state === 'suspended') await context.resume();
  }

  function stopVoice() {
    setStartError(null);
    stopAllMeters();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    realtime.disconnect();
  }

  async function startVoice() {
    const warning = microphoneCompatibilityWarning();
    if (warning) {
      setStartError(warning);
      return;
    }
    setIsStarting(true);
    setStartError(null);
    try {
      await unlockPlaybackAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      startHumanWaveMeter(stream);
      await realtime.connect();
      realtime.startAudioCapture(stream);
    } catch (caught) {
      stopAllMeters();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      realtime.disconnect();
      setStartError(startErrorMessage(caught));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="voice-stage grid min-h-screen place-items-center">
      <div className="voice-control">
        <VoiceRingButton
          aiLevels={aiLevels}
          disabled={isStarting}
          humanLevels={humanLevels}
          onClick={isVoiceActive ? stopVoice : startVoice}
          state={voiceState}
        />
        {startError ? (
          <p className="voice-start-error" role="status">
            {startError}
          </p>
        ) : null}
      </div>
      {showDebug ? (
        <RtcDebugPanel
          debug={realtime.debug}
          isCapturing={realtime.isCapturing}
          isPlaying={realtime.isPlaying}
          status={realtime.status}
        />
      ) : null}
    </main>
  );
}
