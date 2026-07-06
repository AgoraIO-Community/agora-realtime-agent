import type { Experimental_UseRealtimeReturn as UseRealtimeReturn } from '@ai-sdk/react';
import type {
  Experimental_RealtimeClientEvent as RealtimeClientEvent,
  Experimental_RealtimeServerEvent as RealtimeServerEvent,
  Experimental_RealtimeSessionConfig as RealtimeSessionConfig,
  Experimental_RealtimeStatus as RealtimeStatus,
  Experimental_RealtimeToolDefinition as RealtimeToolDefinition,
  UIMessage,
} from 'ai';

export type {
  RealtimeClientEvent,
  RealtimeServerEvent,
  RealtimeSessionConfig,
  RealtimeStatus,
  RealtimeToolDefinition,
  UIMessage,
};

export type AgoraSessionConfig = {
  instructions?: string;
  voice?: string;
  output_modalities?: Array<'text' | 'audio'>;
  input_audio_format?: { type: 'audio/pcm'; rate: number; channels: number };
  output_audio_format?: { type: 'audio/pcm'; rate: number; channels: number };
  turn_detection?: Record<string, unknown>;
  tools?: Array<{ name: string; description?: string; parameters: Record<string, unknown> }>;
  provider_options?: Record<string, unknown>;
};

export type AgoraRealtimeSetupResponse = {
  session_id: string;
  trace_id: string;
  expires_at?: number;
  region?: string;
  rtc: {
    app_id: string;
    channel: string;
    uid: string | number;
    token: string | null;
    agent_rtc_uid?: string | number;
    rtm_token?: string;
  };
  agent?: {
    id?: string;
    rtc_uid?: string | number;
    status?: string;
    trace_id?: string;
  };
};

export type UseAgoraRealtimeOptions = {
  api: {
    setup: string;
    end?: string;
    text?: string;
    control?: string;
  };
  sessionConfig?: Partial<RealtimeSessionConfig>;
  sampleRate?: number;
  maxEvents?: number;
  onRemoteAudioTrack?: (args: { mediaStreamTrack: MediaStreamTrack; uid: string | number }) => void;
  onRemoteAudioTrackEnded?: (args: { uid: string | number }) => void;
  onToolCall?: (args: {
    toolCall: { toolCallId: string; toolName: string; args: unknown };
  }) => Promise<unknown> | unknown | undefined;
  onEvent?: (event: RealtimeServerEvent) => void;
  onError?: (error: Error) => void;
};

export type AgoraRealtimeDebugStep = {
  at: number;
  details?: Record<string, unknown> | undefined;
  label: string;
};

export type AgoraRealtimeDebugState = {
  connectionState?: string | undefined;
  isLocalAudioPublished: boolean;
  lastError?: string | undefined;
  lastRemoteAudioLevel?: number | undefined;
  lastUpdatedAt?: number | undefined;
  remoteAudioPlaying: boolean;
  remoteUsers: Array<{
    hasAudio: boolean;
    hasVideo: boolean;
    uid: string | number;
  }>;
  setup?: {
    agentId?: string | undefined;
    agentRtcUid?: string | number | undefined;
    agentStatus?: string | undefined;
    agentTraceId?: string | undefined;
    channel: string;
    sessionId: string;
    token: 'missing' | 'present';
    traceId: string;
    uid: string | number;
  } | undefined;
  steps: AgoraRealtimeDebugStep[];
};

export type UseAgoraRealtimeReturn = UseRealtimeReturn & {
  debug: AgoraRealtimeDebugState;
};
