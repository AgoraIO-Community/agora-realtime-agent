import { useCallback, useEffect, useRef, useState } from 'react';
import { AgoraRealtimeSession } from './agora-realtime-session.js';
import { INITIAL_DEBUG_STATE } from './debug.js';
import { withDefined } from './utils.js';
import type {
  AgoraRealtimeDebugState,
  AgoraRealtimeDebugStep,
  RealtimeClientEvent,
  RealtimeServerEvent,
  RealtimeStatus,
  UIMessage,
  UseAgoraRealtimeOptions,
  UseAgoraRealtimeReturn,
} from './types.js';

export function useAgoraRealtime(options: UseAgoraRealtimeOptions): UseAgoraRealtimeReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [events, setEvents] = useState<RealtimeServerEvent[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [debug, setDebug] = useState<AgoraRealtimeDebugState>(INITIAL_DEBUG_STATE);

  const patchDebug = useCallback((patch: Partial<AgoraRealtimeDebugState>) => {
    setDebug((current) => ({ ...current, ...patch, lastUpdatedAt: Date.now() }));
  }, []);

  const pushDebug = useCallback((label: string, details?: Record<string, unknown>) => {
    const step: AgoraRealtimeDebugStep = withDefined({ at: Date.now(), details, label });
    setDebug((current) => ({
      ...current,
      lastUpdatedAt: step.at,
      steps: [...current.steps, step].slice(-40),
    }));
    console.debug('[agora-realtime]', label, details ?? {});
  }, []);

  const pushEvent = useCallback((event: RealtimeServerEvent) => {
    setEvents((current) => {
      const next = [...current, event];
      return next.slice(-(optionsRef.current.maxEvents ?? 500));
    });
    optionsRef.current.onEvent?.(event);
  }, []);

  const sessionRef = useRef<AgoraRealtimeSession | null>(null);
  if (sessionRef.current === null) {
    sessionRef.current = new AgoraRealtimeSession({
      appendMessage: (message) => setMessages((current) => [...current, message]),
      onError: (error) => optionsRef.current.onError?.(error),
      onRemoteAudioTrack: (args) => optionsRef.current.onRemoteAudioTrack?.(args),
      onRemoteAudioTrackEnded: (args) => optionsRef.current.onRemoteAudioTrackEnded?.(args),
      patchDebug,
      pushDebug,
      pushEvent,
      setCapturing: setIsCapturing,
      setPlaying: setIsPlaying,
      setStatus,
    });
  }

  const connect = useCallback(() => sessionRef.current?.connect({
    api: { setup: optionsRef.current.api.setup },
    sessionConfig: optionsRef.current.sessionConfig,
  }) ?? Promise.resolve(), []);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect(optionsRef.current.api.end);
  }, []);

  const startAudioCapture = useCallback((stream: MediaStream) => {
    sessionRef.current?.startAudioCapture(stream);
  }, []);

  const stopAudioCapture = useCallback(() => {
    sessionRef.current?.stopAudioCapture();
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    sessionRef.current?.sendTextMessage(text, optionsRef.current.api.text);
  }, []);

  const sendEvent = useCallback((event: RealtimeClientEvent) => {
    sessionRef.current?.sendEvent(event, optionsRef.current.api.control);
  }, []);

  const stopPlayback = useCallback(() => {
    sessionRef.current?.stopPlayback();
  }, []);

  useEffect(() => () => {
    void sessionRef.current?.cleanupRtc();
  }, []);

  return {
    status,
    messages,
    events,
    debug,
    isCapturing,
    isPlaying,
    connect,
    disconnect,
    addToolOutput: () => undefined,
    sendEvent,
    sendTextMessage,
    sendAudio: () => undefined,
    commitAudio: () => undefined,
    clearAudioBuffer: () => undefined,
    requestResponse: (requestOptions) => sendEvent(
      requestOptions ? { type: 'response-create', options: requestOptions } : { type: 'response-create' },
    ),
    cancelResponse: () => sendEvent({ type: 'response-cancel' }),
    startAudioCapture,
    stopAudioCapture,
    stopPlayback,
  };
}
