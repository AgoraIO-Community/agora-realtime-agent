import type { AgoraRealtimeSetupResponse, RealtimeServerEvent } from './types.js';

export function sessionCreatedEvent(setup: AgoraRealtimeSetupResponse): RealtimeServerEvent {
  return {
    type: 'session-created',
    sessionId: setup.session_id,
    raw: { transport: 'agora-rtc', setup },
  };
}

export function agoraVolumeIndicatorEvent(
  setup: AgoraRealtimeSetupResponse,
  volumes: Array<{ level: number; uid: string | number }>,
): RealtimeServerEvent {
  return {
    type: 'custom',
    rawType: 'agora-volume-indicator',
    raw: {
      agent_rtc_uid: setup.rtc.agent_rtc_uid ?? setup.agent?.rtc_uid,
      local_uid: setup.rtc.uid,
      transport: 'agora-rtc',
      volumes,
    },
  };
}

export function agoraAudioLevelEvent(
  setup: AgoraRealtimeSetupResponse,
  input: { level: number; uid: string | number },
): RealtimeServerEvent {
  return {
    type: 'custom',
    rawType: 'agora-audio-level',
    raw: {
      agent_rtc_uid: setup.rtc.agent_rtc_uid ?? setup.agent?.rtc_uid,
      level: Math.min(1, Math.max(0, input.level)),
      local_uid: setup.rtc.uid,
      transport: 'agora-rtc',
      uid: input.uid,
    },
  };
}
