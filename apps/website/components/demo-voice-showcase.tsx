'use client';

import {
  AI_BAR_COUNT,
  HUMAN_BAR_COUNT,
  VoiceRingButton,
  useVoiceMeter,
  type VoiceMeterFrequencyRange,
  type VoiceMeterMetricRange,
  type VoiceRingState,
} from 'agora-realtime-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PcmTrackMetadata = {
  channels: number;
  durationSeconds: number;
  encoding: 's16le';
  file: string;
  sampleRate: number;
};

type SampleMetadata = {
  license: string;
  source: string;
  title: string;
  transcript: string;
  tracks: {
    ai: PcmTrackMetadata;
    human: PcmTrackMetadata;
  };
};

type ActiveSource = {
  destination: MediaStreamAudioDestinationNode;
  gain: GainNode;
  source: AudioBufferSourceNode;
};

type PlaybackGraph = {
  ai: ActiveSource;
  context: AudioContext;
  durationSeconds: number;
  human: ActiveSource;
  progressFrame: number | null;
  startedAt: number;
};

const AI_METRIC_RANGE = { max: 2.9, min: 0 } satisfies VoiceMeterMetricRange;
const HUMAN_METRIC_RANGE = { floor: 0.12, max: 1.35, min: 0.26 } satisfies VoiceMeterMetricRange;
const AI_FREQUENCY_RANGE = { minHz: 80 } satisfies VoiceMeterFrequencyRange;
const HUMAN_FREQUENCY_RANGE = { minHz: 280 } satisfies VoiceMeterFrequencyRange;

const sampleMetadata: SampleMetadata = {
  license: 'CC-BY-4.0',
  source: 'https://github.com/cricketclub/gridspace-stanford-harper-valley',
  title: 'Harper Valley Bank branch-hours call',
  transcript: 'https://github.com/cricketclub/gridspace-stanford-harper-valley/blob/master/data/transcript/ff0296d00e5e4184.json',
  tracks: {
    ai: {
      channels: 1,
      durationSeconds: 51.97,
      encoding: 's16le',
      file: '/audio/harper-valley-agent.s16le.pcm',
      sampleRate: 8000,
    },
    human: {
      channels: 1,
      durationSeconds: 53.97,
      encoding: 's16le',
      file: '/audio/harper-valley-caller.s16le.pcm',
      sampleRate: 8000,
    },
  },
};

const transcriptTurns = [
  { role: 'AI', text: 'Hello, this is Harper Valley National Bank. My name is Linda. How can I help you today?' },
  { role: 'Human', text: 'Hi Linda, my name is Robert Miller. I was wondering what your local branch hours are.' },
  { role: 'AI', text: 'Branch hours are nine thirty A.M. to five P.M.' },
  { role: 'Human', text: 'Wonderful. Okay, thank you for your help.' },
  { role: 'AI', text: 'Thank you for calling. Have a great day.' },
];

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function streamFromStream(stream: MediaStream): MediaStream {
  return stream;
}

async function loadPcmTrack(context: AudioContext, track: PcmTrackMetadata): Promise<AudioBuffer> {
  const response = await fetch(track.file);
  if (!response.ok) throw new Error(`Failed to load ${track.file}`);
  const data = await response.arrayBuffer();
  const sampleCount = Math.floor(data.byteLength / 2);
  const audioBuffer = context.createBuffer(track.channels, sampleCount, track.sampleRate);
  const samples = audioBuffer.getChannelData(0);
  const view = new DataView(data);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = view.getInt16(index * 2, true) / 32768;
  }

  return audioBuffer;
}

function createActiveSource(context: AudioContext, buffer: AudioBuffer, volume: number): ActiveSource {
  const source = context.createBufferSource();
  const gain = context.createGain();
  const destination = context.createMediaStreamDestination();

  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(context.destination);
  gain.connect(destination);

  return { destination, gain, source };
}

function stopActiveSource(activeSource: ActiveSource): void {
  try {
    activeSource.source.stop();
  } catch {
    // The source may already be stopped by the browser when the sample reaches the end.
  }
  activeSource.source.disconnect();
  activeSource.gain.disconnect();
  activeSource.destination.disconnect();
}

export function DemoVoiceShowcase() {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceRingState>('disconnected');
  const graphRef = useRef<PlaybackGraph | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<{ ai: AudioBuffer; human: AudioBuffer } | null>(null);
  const playbackGenerationRef = useRef(0);
  const sample = useMemo(() => sampleMetadata, []);

  const {
    levels: aiLevels,
    start: startAiMeter,
    stop: stopAiMeter,
  } = useVoiceMeter({
    barCount: AI_BAR_COUNT,
    divisor: 132,
    frequencyRange: AI_FREQUENCY_RANGE,
    metricRange: AI_METRIC_RANGE,
    smoothingTimeConstant: 0.74,
    streamFromInput: streamFromStream,
  });
  const {
    levels: humanLevels,
    start: startHumanMeter,
    stop: stopHumanMeter,
  } = useVoiceMeter({
    barCount: HUMAN_BAR_COUNT,
    divisor: 145,
    frequencyRange: HUMAN_FREQUENCY_RANGE,
    metricRange: HUMAN_METRIC_RANGE,
    smoothingTimeConstant: 0.72,
    streamFromInput: streamFromStream,
  });

  const stopPlayback = useCallback(() => {
    playbackGenerationRef.current += 1;
    const graph = graphRef.current;
    if (graph && graph.progressFrame !== null) cancelAnimationFrame(graph.progressFrame);
    if (graph) {
      stopActiveSource(graph.ai);
      stopActiveSource(graph.human);
    }
    graphRef.current = null;
    stopAiMeter();
    stopHumanMeter();
    setProgress(0);
    setVoiceState('disconnected');
  }, [stopAiMeter, stopHumanMeter]);

  const playSample = useCallback(async () => {
    if (voiceState !== 'disconnected') {
      stopPlayback();
      return;
    }

    setError(null);
    setVoiceState('connecting');
    const playbackGeneration = playbackGenerationRef.current + 1;
    playbackGenerationRef.current = playbackGeneration;

    try {
      const AudioContextConstructor = getAudioContextConstructor();
      if (!AudioContextConstructor) throw new Error('This browser does not support Web Audio.');

      const context = contextRef.current ?? new AudioContextConstructor();
      contextRef.current = context;
      if (context.state === 'suspended') await context.resume();

      const buffers = buffersRef.current ?? {
        ai: await loadPcmTrack(context, sample.tracks.ai),
        human: await loadPcmTrack(context, sample.tracks.human),
      };
      buffersRef.current = buffers;

      const ai = createActiveSource(context, buffers.ai, 0.94);
      const human = createActiveSource(context, buffers.human, 1);
      if (playbackGenerationRef.current !== playbackGeneration) {
        stopActiveSource(ai);
        stopActiveSource(human);
        return;
      }
      const startedAt = context.currentTime + 0.08;
      const durationSeconds = Math.max(buffers.ai.duration, buffers.human.duration);

      startAiMeter(ai.destination.stream);
      startHumanMeter(human.destination.stream);
      ai.source.start(startedAt);
      human.source.start(startedAt);
      setVoiceState('listening');

      const updateProgress = () => {
        const elapsed = Math.max(0, context.currentTime - startedAt);
        const nextProgress = Math.min(1, elapsed / durationSeconds);
        setProgress(nextProgress);
        if (nextProgress >= 1) {
          stopPlayback();
          return;
        }
        const currentGraph = graphRef.current;
        if (currentGraph) currentGraph.progressFrame = requestAnimationFrame(updateProgress);
      };

      graphRef.current = {
        ai,
        context,
        durationSeconds,
        human,
        progressFrame: requestAnimationFrame(updateProgress),
        startedAt,
      };
    } catch (caught) {
      stopPlayback();
      setError(caught instanceof Error ? caught.message : 'Could not play the sample.');
    }
  }, [sample, startAiMeter, startHumanMeter, stopPlayback, voiceState]);

  useEffect(() => () => {
    stopPlayback();
    void contextRef.current?.close();
    contextRef.current = null;
  }, [stopPlayback]);

  return (
    <section className="demo-stage" id="sample" aria-label="Local PCM voice sample">
      <div className="demo-ring-wrap">
        <VoiceRingButton
          aiLevels={aiLevels}
          ariaLabel={voiceState === 'disconnected' ? 'Play sample call' : 'Stop sample call'}
          className="site-voice-ring"
          humanLevels={humanLevels}
          onClick={playSample}
          state={voiceState}
          testId="sample-call-button"
        />
        <button className="sample-action" onClick={playSample} type="button">
          {voiceState === 'disconnected' ? 'Play local sample' : voiceState === 'connecting' ? 'Loading sample' : 'Stop sample'}
        </button>
      </div>

      <div className="sample-meta">
        <div className="sample-header">
          <span>Local PCM</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <dl className="sample-grid">
          <div>
            <dt>Human</dt>
            <dd>caller PCM</dd>
          </div>
          <div>
            <dt>AI</dt>
            <dd>agent PCM</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>8kHz s16le</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>no live account</dd>
          </div>
        </dl>
        <ol className="transcript-list" aria-label="Sample transcript">
          {transcriptTurns.map((turn) => (
            <li key={`${turn.role}-${turn.text}`}>
              <span>{turn.role}</span>
              <p>{turn.text}</p>
            </li>
          ))}
        </ol>
        {error ? <p className="sample-error" role="status">{error}</p> : null}
        <p className="sample-credit">
          Audio: {sample.title}, Gridspace-Stanford Harper Valley dataset, {sample.license}.
        </p>
      </div>
    </section>
  );
}
