'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

export const AI_BAR_COUNT = 72;
export const HUMAN_BAR_COUNT = 72;

export type VoiceRingState = 'connecting' | 'disconnected' | 'interrupted' | 'listening' | 'thinking';

export type Rgb = readonly [number, number, number];
export type BarPalette = {
  end: Rgb;
  middle: Rgb;
  start: Rgb;
};

export type WaveRingConfig = {
  barCount: number;
  barWidth: number;
  direction: 'in' | 'out';
  excitement: number;
  frequencyDirection: 1 | -1;
  maxBarHeight: number;
  minBarHeight: number;
  opacity: number;
  palette: BarPalette;
  radius: number;
  sampleStride: number;
};

export type VoiceRingConfig = {
  ai: WaveRingConfig;
  human: WaveRingConfig;
  levelFloor: number;
  ringGap: number;
  ringLineWidth: number;
  transitionMs: number;
};

export type VoiceRingConfigInput = {
  ai?: Partial<WaveRingConfig>;
  human?: Partial<WaveRingConfig>;
  levelFloor?: number;
  ringGap?: number;
  ringLineWidth?: number;
  transitionMs?: number;
};

export type VoiceRingButtonProps = {
  ariaLabel?: string;
  aiLevels: number[] | null;
  canvasClassName?: string;
  className?: string;
  config?: VoiceRingConfigInput;
  disabled?: boolean;
  humanLevels: number[] | null;
  onClick: () => void;
  state: VoiceRingState;
  style?: CSSProperties;
  testId?: string;
};

const RING_CENTER = 200;
const VOICE_CANVAS_SIZE = 400;
const WAVE_BLEND_PRIMARY_WEIGHT = 0.7;
const WAVE_ROTATION_SPEED = 7.8;

export const DEFAULT_VOICE_RING_CONFIG: VoiceRingConfig = {
  ai: {
    barCount: AI_BAR_COUNT,
    barWidth: 2,
    direction: 'out',
    excitement: 2.35,
    frequencyDirection: 1,
    maxBarHeight: 66,
    minBarHeight: 11,
    opacity: 0.98,
    palette: {
      end: [76, 238, 255],
      middle: [82, 164, 255],
      start: [154, 118, 255],
    },
    radius: 62,
    sampleStride: 1,
  },
  human: {
    barCount: HUMAN_BAR_COUNT,
    barWidth: 2,
    direction: 'in',
    excitement: 1.7,
    frequencyDirection: 1,
    maxBarHeight: 36,
    minBarHeight: 6,
    opacity: 0.94,
    palette: {
      end: [154, 118, 255],
      middle: [236, 95, 180],
      start: [255, 184, 96],
    },
    radius: 62,
    sampleStride: 1,
  },
  levelFloor: 0.12,
  ringGap: 0,
  ringLineWidth: 2,
  transitionMs: 360,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergeVoiceRingConfig(input?: VoiceRingConfigInput): VoiceRingConfig {
  const outerRadius = input?.ai?.radius ?? DEFAULT_VOICE_RING_CONFIG.ai.radius;
  const ringGap = input?.ringGap ?? DEFAULT_VOICE_RING_CONFIG.ringGap;
  const humanRadius = input?.human?.radius ?? Math.max(48, outerRadius - ringGap);

  return {
    ai: {
      ...DEFAULT_VOICE_RING_CONFIG.ai,
      ...input?.ai,
      radius: outerRadius,
    },
    human: {
      ...DEFAULT_VOICE_RING_CONFIG.human,
      ...input?.human,
      radius: humanRadius,
    },
    levelFloor: input?.levelFloor ?? DEFAULT_VOICE_RING_CONFIG.levelFloor,
    ringGap,
    ringLineWidth: input?.ringLineWidth ?? DEFAULT_VOICE_RING_CONFIG.ringLineWidth,
    transitionMs: input?.transitionMs ?? DEFAULT_VOICE_RING_CONFIG.transitionMs,
  };
}

function makeFlatLevels(count: number, levelFloor: number): number[] {
  return Array.from({ length: count }, () => levelFloor);
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

function mixRgb(start: Rgb, end: Rgb, amount: number): Rgb {
  return [
    Math.round(start[0] + (end[0] - start[0]) * amount),
    Math.round(start[1] + (end[1] - start[1]) * amount),
    Math.round(start[2] + (end[2] - start[2]) * amount),
  ];
}

function circularLevelAt(levels: number[], index: number, levelFloor: number): number {
  return levels[((index % levels.length) + levels.length) % levels.length] ?? levelFloor;
}

function cubicInterpolate(leftOuter: number, left: number, right: number, rightOuter: number, amount: number): number {
  const squared = amount * amount;
  const cubed = squared * amount;
  return left + 0.5 * amount * (right - leftOuter)
    + squared * (leftOuter - 2.5 * left + 2 * right - 0.5 * rightOuter)
    + cubed * (-0.5 * leftOuter + 1.5 * left - 1.5 * right + 0.5 * rightOuter);
}

function sampleCircularLevel(levels: number[], position: number, levelFloor: number): number {
  if (levels.length === 0) return levelFloor;
  const wrapped = ((position % levels.length) + levels.length) % levels.length;
  const leftIndex = Math.floor(wrapped);
  const amount = wrapped - leftIndex;
  return clamp(cubicInterpolate(
    circularLevelAt(levels, leftIndex - 1, levelFloor),
    circularLevelAt(levels, leftIndex, levelFloor),
    circularLevelAt(levels, leftIndex + 1, levelFloor),
    circularLevelAt(levels, leftIndex + 2, levelFloor),
    amount,
  ), levelFloor, 1);
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;
}

function mixLevels(from: number[], to: number[], amount: number, levelFloor: number): number[] {
  const count = Math.max(from.length, to.length);
  return Array.from({ length: count }, (_, index) => {
    const left = from[index % from.length] ?? levelFloor;
    const right = to[index % to.length] ?? left;
    return left + (right - left) * amount;
  });
}

function waveSamplePosition(input: {
  index: number;
  levelCount: number;
  ring: WaveRingConfig;
  sampleOffset: number;
}) {
  const progress = input.ring.barCount <= 1 ? 0 : input.index / (input.ring.barCount - 1);
  const directedProgress = input.ring.frequencyDirection === 1 ? progress : 1 - progress;
  const centeredProgress = 0.5 + (directedProgress - 0.5) * input.ring.sampleStride;
  return centeredProgress * Math.max(0, input.levelCount - 1) + input.sampleOffset;
}

function equivalentSamplePosition(position: number, sourceCount: number, targetCount: number): number {
  const sourceSpan = Math.max(1, sourceCount - 1);
  return (position / sourceSpan) * Math.max(0, targetCount - 1);
}

function blendWaveLevels(input: {
  levelFloor: number;
  primaryLevels: number[];
  primaryWeight: number;
  ring: WaveRingConfig;
  sampleOffset: number;
  secondaryLevels: number[];
}): number[] {
  return Array.from({ length: input.ring.barCount }, (_, index) => {
    const primaryPosition = waveSamplePosition({
      index,
      levelCount: input.primaryLevels.length,
      ring: input.ring,
      sampleOffset: input.sampleOffset,
    });
    const primaryLevel = sampleCircularLevel(input.primaryLevels, primaryPosition, input.levelFloor);
    const secondaryLevel = sampleCircularLevel(
      input.secondaryLevels,
      equivalentSamplePosition(primaryPosition, input.primaryLevels.length, input.secondaryLevels.length),
      input.levelFloor,
    );
    return input.primaryWeight * primaryLevel + (1 - input.primaryWeight) * secondaryLevel;
  });
}

function levelAboveFloor(level: number, levelFloor: number): number {
  return clamp((level - levelFloor) / (1 - levelFloor), 0, 1);
}

function exciteLevel(level: number, excitement: number): number {
  const amplified = clamp((level - 0.035) * excitement, 0, 1);
  return amplified * amplified * (3 - 2 * amplified);
}

function voiceIntensityFromLevels(levels: number[] | null, levelFloor: number): number {
  if (!levels || levels.length === 0) return 0;
  const sorted = [...levels].sort((left, right) => right - left);
  const sampleCount = Math.max(1, Math.ceil(sorted.length * 0.22));
  const topAverage = sorted.slice(0, sampleCount).reduce((sum, level) => sum + level, 0) / sampleCount;
  return levelAboveFloor(topAverage, levelFloor);
}

function stateTarget(state: VoiceRingState): number {
  switch (state) {
    case 'connecting':
      return 0.48;
    case 'listening':
      return 1;
    case 'thinking':
      return 0.72;
    case 'interrupted':
      return 1;
    case 'disconnected':
    default:
      return 0;
  }
}

function stateScale(state: VoiceRingState): number {
  switch (state) {
    case 'connecting':
      return 0.98;
    case 'listening':
      return 1;
    case 'thinking':
      return 1.015;
    case 'interrupted':
      return 1.035;
    case 'disconnected':
    default:
      return 0.94;
  }
}

function idleRingPalette(config: VoiceRingConfig): BarPalette {
  return {
    end: config.ai.palette.end,
    middle: config.ai.palette.start,
    start: config.human.palette.start,
  };
}

function drawRingCircle(ctx: CanvasRenderingContext2D, input: {
  amount: number;
  config: VoiceRingConfig;
  palette: BarPalette;
  radius: number;
}) {
  if (input.amount <= 0.001) return;
  const gradient = ctx.createLinearGradient(
    RING_CENTER - input.radius,
    RING_CENTER - input.radius,
    RING_CENTER + input.radius,
    RING_CENTER + input.radius,
  );
  const alpha = input.amount * 0.58;
  gradient.addColorStop(0, rgba(input.palette.start, alpha));
  gradient.addColorStop(0.5, rgba(input.palette.middle, alpha + 0.04));
  gradient.addColorStop(1, rgba(input.palette.end, alpha));

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';
  ctx.lineWidth = input.config.ringLineWidth;
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.arc(RING_CENTER, RING_CENTER, input.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStateArc(ctx: CanvasRenderingContext2D, input: {
  clock: number;
  config: VoiceRingConfig;
  palette: BarPalette;
  radius: number;
  state: VoiceRingState;
  stateAmount: number;
}) {
  if (input.state !== 'connecting' && input.state !== 'thinking') return;
  const sweep = input.state === 'connecting' ? 0.42 : 0.24;
  const speed = input.state === 'connecting' ? 2.8 : 1.1;
  const start = input.clock * speed;
  const color = input.state === 'connecting' ? input.palette.middle : input.palette.end;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = input.config.ringLineWidth + (input.state === 'connecting' ? 1.2 : 0.6);
  ctx.strokeStyle = rgba(color, 0.26 * input.stateAmount);
  ctx.beginPath();
  ctx.arc(RING_CENTER, RING_CENTER, input.radius + 2, start, start + Math.PI * sweep);
  ctx.stroke();
  ctx.restore();
}

function drawInterruptBurst(ctx: CanvasRenderingContext2D, input: {
  clock: number;
  config: VoiceRingConfig;
  progress: number;
}) {
  if (input.progress <= 0) return;
  const amount = Math.sin(input.progress * Math.PI);
  const bars = 18;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = input.config.ringLineWidth + 1;
  for (let index = 0; index < bars; index += 1) {
    const angle = -Math.PI / 2 + (index / bars) * Math.PI * 2 + input.clock * 0.18;
    const spike = amount * (9 + ((index * 17) % 11));
    const radius = input.config.ai.radius + 8 + spike * 0.3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.strokeStyle = rgba(index % 2 === 0 ? input.config.ai.palette.start : input.config.human.palette.end, amount * 0.62);
    ctx.beginPath();
    ctx.moveTo(RING_CENTER + cos * radius, RING_CENTER + sin * radius);
    ctx.lineTo(RING_CENTER + cos * (radius + spike), RING_CENTER + sin * (radius + spike));
    ctx.stroke();
  }
  ctx.restore();
}

function drawWavePass(ctx: CanvasRenderingContext2D, input: {
  clock: number;
  config: VoiceRingConfig;
  levels: number[];
  ring: WaveRingConfig;
  sampleOffset: number;
  stateAmount: number;
}) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';
  ctx.lineWidth = input.ring.barWidth;
  const barPresence = input.stateAmount;

  for (let index = 0; index < input.ring.barCount; index += 1) {
    const angle = -Math.PI / 2 + (index / input.ring.barCount) * Math.PI * 2;
    const sampledLevel = input.levels[index] ?? input.config.levelFloor;
    const level = exciteLevel(levelAboveFloor(sampledLevel, input.config.levelFloor), input.ring.excitement) * input.stateAmount;
    const height = input.ring.minBarHeight * barPresence + level * input.ring.maxBarHeight;
    if (height <= 0.2) continue;
    const innerRadius = input.ring.direction === 'out' ? input.ring.radius : input.ring.radius - height;
    const outerRadius = input.ring.direction === 'out' ? input.ring.radius + height : input.ring.radius;
    const colorShift = (Math.sin(index * 0.19 + input.sampleOffset * 0.018 + input.clock * 0.22 + (input.ring.direction === 'out' ? 0.4 : 1.7)) + 1) / 2;
    const alpha = clamp((barPresence * 0.36 + level * 0.64) * input.ring.opacity, 0, 1);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x1 = RING_CENTER + cos * innerRadius;
    const y1 = RING_CENTER + sin * innerRadius;
    const x2 = RING_CENTER + cos * outerRadius;
    const y2 = RING_CENTER + sin * outerRadius;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    if (input.ring.direction === 'out') {
      const baseColor = input.ring.palette.start;
      const middleColor = mixRgb(input.ring.palette.start, input.ring.palette.middle, 0.56 + colorShift * 0.28);
      const tipColor = mixRgb(input.ring.palette.middle, input.ring.palette.end, 0.72 + colorShift * 0.2);
      gradient.addColorStop(0, rgba(baseColor, alpha * 0.46));
      gradient.addColorStop(0.5, rgba(middleColor, alpha));
      gradient.addColorStop(1, rgba(tipColor, alpha * 0.9));
    } else {
      const innerColor = mixRgb(input.ring.palette.start, input.ring.palette.middle, colorShift * 0.34);
      const middleColor = mixRgb(input.ring.palette.middle, input.ring.palette.end, 0.36 + colorShift * 0.22);
      const baseColor = input.ring.palette.end;
      gradient.addColorStop(0, rgba(innerColor, alpha * 0.9));
      gradient.addColorStop(0.5, rgba(middleColor, alpha));
      gradient.addColorStop(1, rgba(baseColor, alpha * 0.46));
    }

    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWaveRing(ctx: CanvasRenderingContext2D, input: {
  clock: number;
  config: VoiceRingConfig;
  levels: number[];
  ring: WaveRingConfig;
  sampleOffset: number;
  state: VoiceRingState;
  stateAmount: number;
}) {
  drawWavePass(ctx, input);
}

function drawVoiceCanvas(
  canvas: HTMLCanvasElement,
  input: {
    aiLevels: number[];
    clock: number;
    config: VoiceRingConfig;
    humanLevels: number[];
    interruptProgress: number;
    state: VoiceRingState;
    stateAmount: number;
    waveOffset: number;
  },
) {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const backingWidth = Math.round(cssWidth * pixelRatio);
  const backingHeight = Math.round(cssHeight * pixelRatio);
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(backingWidth / VOICE_CANVAS_SIZE, 0, 0, backingHeight / VOICE_CANVAS_SIZE, 0, 0);
  ctx.clearRect(0, 0, VOICE_CANVAS_SIZE, VOICE_CANVAS_SIZE);

  const idleRingAmount = input.state === 'disconnected'
    ? 1 - input.stateAmount
    : Math.max(0, 1 - input.stateAmount * 3.2);
  drawRingCircle(ctx, {
    amount: idleRingAmount,
    config: input.config,
    palette: idleRingPalette(input.config),
    radius: input.config.ai.radius,
  });
  drawWaveRing(ctx, {
    clock: input.clock,
    config: input.config,
    levels: input.aiLevels,
    ring: input.config.ai,
    sampleOffset: input.waveOffset,
    state: input.state,
    stateAmount: input.stateAmount,
  });
  drawWaveRing(ctx, {
    clock: input.clock,
    config: input.config,
    levels: input.humanLevels,
    ring: input.config.human,
    sampleOffset: input.waveOffset,
    state: input.state,
    stateAmount: input.stateAmount,
  });
  drawStateArc(ctx, {
    clock: input.clock,
    config: input.config,
    palette: input.config.ai.palette,
    radius: input.config.ai.radius + input.config.ai.minBarHeight + 8,
    state: input.state,
    stateAmount: input.stateAmount,
  });
  drawInterruptBurst(ctx, {
    clock: input.clock,
    config: input.config,
    progress: input.interruptProgress,
  });
}

export function VoiceRingButton({
  aiLevels,
  ariaLabel,
  canvasClassName,
  className,
  config: configInput,
  disabled = false,
  humanLevels,
  onClick,
  state,
  style,
  testId = 'start-conversation-button',
}: VoiceRingButtonProps): ReactElement {
  const config = mergeVoiceRingConfig(configInput);
  const [stateAmount, setStateAmount] = useState(stateTarget(state));
  const [waveOffset, setWaveOffset] = useState(0);
  const [clock, setClock] = useState(0);
  const [resizeKey, setResizeKey] = useState(0);
  const [interruptProgress, setInterruptProgress] = useState(0);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const interruptFrameRef = useRef<number | null>(null);
  const stateAmountRef = useRef(stateTarget(state));
  const lastFrameAtRef = useRef(0);

  const flatAiLevels = makeFlatLevels(config.ai.barCount, config.levelFloor);
  const flatHumanLevels = makeFlatLevels(config.human.barCount, config.levelFloor);
  const liveAiLevels = state !== 'disconnected' && aiLevels ? aiLevels : flatAiLevels;
  const liveHumanLevels = state !== 'disconnected' && humanLevels ? humanLevels : flatHumanLevels;
  const visibleAiLevels = mixLevels(flatAiLevels, liveAiLevels, stateAmount, config.levelFloor);
  const visibleHumanLevels = mixLevels(flatHumanLevels, liveHumanLevels, stateAmount, config.levelFloor);
  const blendedAiLevels = blendWaveLevels({
    levelFloor: config.levelFloor,
    primaryLevels: visibleAiLevels,
    primaryWeight: WAVE_BLEND_PRIMARY_WEIGHT,
    ring: config.ai,
    sampleOffset: waveOffset,
    secondaryLevels: visibleHumanLevels,
  });
  const blendedHumanLevels = blendWaveLevels({
    levelFloor: config.levelFloor,
    primaryLevels: visibleHumanLevels,
    primaryWeight: WAVE_BLEND_PRIMARY_WEIGHT,
    ring: config.human,
    sampleOffset: waveOffset,
    secondaryLevels: visibleAiLevels,
  });
  const voiceScale = stateScale(state) + stateAmount * voiceIntensityFromLevels(humanLevels, config.levelFloor) * 0.045;
  const buttonStyle = {
    alignItems: 'center',
    aspectRatio: '1',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    cursor: disabled ? 'wait' : 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    outline: 'none',
    padding: 0,
    position: 'relative',
    transform: 'scale(var(--voice-state-scale))',
    transition: 'opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    width: 'min(100%, 28rem)',
    ...style,
    '--voice-state-scale': voiceScale,
  } as CSSProperties;
  const canvasStyle = {
    height: '100%',
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  } as CSSProperties;

  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    drawVoiceCanvas(canvas, {
      aiLevels: blendedAiLevels,
      clock,
      config,
      humanLevels: blendedHumanLevels,
      interruptProgress,
      state,
      stateAmount,
      waveOffset,
    });
  }, [blendedAiLevels, blendedHumanLevels, clock, config, interruptProgress, resizeKey, state, stateAmount, waveOffset]);

  useEffect(() => {
    if (transitionFrameRef.current !== null) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    const startedAt = performance.now();
    const fromProgress = stateAmountRef.current;
    const targetProgress = stateTarget(state);

    const step = (now: number) => {
      const elapsed = clamp((now - startedAt) / config.transitionMs, 0, 1);
      const nextProgress = fromProgress + (targetProgress - fromProgress) * easeInOutCubic(elapsed);
      stateAmountRef.current = nextProgress;
      setStateAmount(nextProgress);
      if (elapsed < 1) {
        transitionFrameRef.current = requestAnimationFrame(step);
        return;
      }
      transitionFrameRef.current = null;
      if (targetProgress === 0) {
        setWaveOffset(0);
      }
    };

    transitionFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (transitionFrameRef.current !== null) {
        cancelAnimationFrame(transitionFrameRef.current);
        transitionFrameRef.current = null;
      }
    };
  }, [config.transitionMs, state]);

  useEffect(() => {
    if (state !== 'interrupted') return undefined;
    if (interruptFrameRef.current !== null) cancelAnimationFrame(interruptFrameRef.current);
    const startedAt = performance.now();
    const step = (now: number) => {
      const elapsed = clamp((now - startedAt) / 420, 0, 1);
      setInterruptProgress(elapsed < 1 ? elapsed : 0);
      if (elapsed < 1) {
        interruptFrameRef.current = requestAnimationFrame(step);
        return;
      }
      interruptFrameRef.current = null;
    };
    interruptFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (interruptFrameRef.current !== null) cancelAnimationFrame(interruptFrameRef.current);
      interruptFrameRef.current = null;
    };
  }, [state]);

  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const resizeObserver = new ResizeObserver(() => setResizeKey((current) => current + 1));
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (state === 'disconnected') return undefined;

    lastFrameAtRef.current = performance.now();

    const step = (now: number) => {
      const elapsedSeconds = clamp((now - lastFrameAtRef.current) / 1000, 0, 0.05);
      lastFrameAtRef.current = now;

      setClock((current) => current + elapsedSeconds);
      setWaveOffset((current) => current + elapsedSeconds * WAVE_ROTATION_SPEED);

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [state]);

  return (
    <button
      aria-label={ariaLabel ?? (state === 'disconnected' ? 'Start voice' : 'Stop voice')}
      className={joinClassNames('voice-ring-button', className)}
      data-state={state}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={buttonStyle}
      type="button"
    >
      <canvas
        aria-hidden="true"
        className={joinClassNames('voice-wave-canvas', canvasClassName)}
        data-testid="voice-wave-canvas"
        height={VOICE_CANVAS_SIZE}
        ref={waveCanvasRef}
        style={canvasStyle}
        width={VOICE_CANVAS_SIZE}
      />
    </button>
  );
}
