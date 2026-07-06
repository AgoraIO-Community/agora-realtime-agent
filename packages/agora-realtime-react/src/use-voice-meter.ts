'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_LEVEL_FLOOR = 0.12;
const DEFAULT_VOICE_METER_FREQUENCY_RANGE: VoiceMeterFrequencyRange = { minHz: 80 };

export type VoiceMeterMetricRange = {
  floor?: number;
  max: number;
  min: number;
};

export type VoiceMeterFrequencyRange = {
  maxHz?: number;
  minHz: number;
};

export type VoiceMeterOptions<TInput> = {
  barCount: number;
  divisor: number;
  frequencyRange?: VoiceMeterFrequencyRange;
  metricRange?: VoiceMeterMetricRange;
  smoothingTimeConstant: number;
  streamFromInput: (input: TInput) => MediaStream;
};

export type VoiceMeterReturn<TInput> = {
  levels: number[] | null;
  start: (input: TInput) => void;
  stop: () => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function normalizeMetricLevel(rawLevel: number, metricRange: VoiceMeterMetricRange): number {
  const floor = clamp(metricRange.floor ?? DEFAULT_LEVEL_FLOOR, 0, 1);
  const min = clamp(metricRange.min, 0, 0.999);
  const max = clamp(Math.max(metricRange.max, min + 0.001), min + 0.001, 4);
  if (rawLevel <= min) return floor;
  if (rawLevel >= max) return 1;
  return floor + ((rawLevel - min) / (max - min)) * (1 - floor);
}

function visibleFrequencyBins(input: {
  bins: Uint8Array;
  fftSize: number;
  frequencyRange: VoiceMeterFrequencyRange;
  sampleRate: number;
}) {
  const hzPerBin = input.sampleRate / input.fftSize;
  const nyquistHz = input.sampleRate / 2;
  const minHz = clamp(input.frequencyRange.minHz, 0, nyquistHz);
  const maxHz = clamp(input.frequencyRange.maxHz ?? nyquistHz, minHz + hzPerBin, nyquistHz);
  const startBin = clamp(Math.ceil(minHz / hzPerBin), 0, Math.max(0, input.bins.length - 1));
  const endBin = clamp(Math.ceil(maxHz / hzPerBin), startBin + 1, input.bins.length);
  return { endBin, startBin };
}

function sampleFrequencyLevels(
  bins: Uint8Array,
  count: number,
  divisor: number,
  metricRange: VoiceMeterMetricRange,
  frequencyRange: VoiceMeterFrequencyRange,
  sampleRate: number,
  fftSize: number,
) {
  const { endBin, startBin } = visibleFrequencyBins({ bins, fftSize, frequencyRange, sampleRate });
  const visibleBinCount = endBin - startBin;
  return Array.from({ length: count }, (_, index) => {
    const start = startBin + Math.floor((index / count) * visibleBinCount);
    const end = Math.max(start + 1, startBin + Math.floor(((index + 1) / count) * visibleBinCount));
    let sum = 0;
    for (let bin = start; bin < end; bin += 1) sum += bins[bin] ?? 0;
    return normalizeMetricLevel((sum / (end - start)) / divisor, metricRange);
  });
}

export function microphoneCompatibilityWarning(): string | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) return 'HTTPS is required for microphone capture on this browser.';
  if (!navigator.mediaDevices?.getUserMedia) return 'This browser does not expose microphone capture.';
  return null;
}

export function useVoiceMeter<TInput>({
  barCount,
  divisor,
  frequencyRange = DEFAULT_VOICE_METER_FREQUENCY_RANGE,
  metricRange = { max: 1, min: 0 },
  smoothingTimeConstant,
  streamFromInput,
}: VoiceMeterOptions<TInput>): VoiceMeterReturn<TInput> {
  const [levels, setLevels] = useState<number[] | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stop = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    setLevels(null);
  }, []);

  const start = useCallback((input: TInput) => {
    stop();
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor({ sampleRate: 24000 });
    if (context.state === 'suspended') void context.resume();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    const source = context.createMediaStreamSource(streamFromInput(input));
    source.connect(analyser);
    contextRef.current = context;
    sourceRef.current = source;

    const bins = new Uint8Array(analyser.frequencyBinCount);
    const resolvedMetricRange = {
      floor: metricRange.floor ?? DEFAULT_LEVEL_FLOOR,
      max: metricRange.max,
      min: metricRange.min,
    };
    const resolvedFrequencyRange: VoiceMeterFrequencyRange = {
      minHz: frequencyRange.minHz,
      ...(frequencyRange.maxHz === undefined ? {} : { maxHz: frequencyRange.maxHz }),
    };
    const draw = () => {
      analyser.getByteFrequencyData(bins);
      setLevels(sampleFrequencyLevels(
        bins,
        barCount,
        divisor,
        resolvedMetricRange,
        resolvedFrequencyRange,
        context.sampleRate,
        analyser.fftSize,
      ));
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, [
    barCount,
    divisor,
    frequencyRange.maxHz,
    frequencyRange.minHz,
    metricRange.floor,
    metricRange.max,
    metricRange.min,
    smoothingTimeConstant,
    stop,
    streamFromInput,
  ]);

  useEffect(() => stop, [stop]);

  return { levels, start, stop };
}
